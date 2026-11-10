import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createAuthStore } from "../lib/codes.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const secret = "integration-secret-that-is-longer-than-thirty-two-characters";
const clientToken = "integration-client-token-private-value";

const getFreePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });

const getSetCookies = (response) => {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }
  const header = response.headers.get("set-cookie") ?? "";
  return header ? [header] : [];
};

const mergeCookieHeader = (cookies, setCookieHeaders) => {
  const next = new Map(cookies);
  for (const header of setCookieHeaders) {
    const pair = header.split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator > 0) {
      next.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }
  return next;
};

const cookieHeader = (cookies) =>
  Array.from(cookies, ([name, value]) => `${name}=${value}`).join("; ");

const waitForHealth = async (baseUrl) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // The child process may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Server did not become healthy");
};

test("授权接口限制设备并保护应用与下载文件", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "lizhipeichang-server-"));
  const clientDirectory = path.join(directory, "client");
  const dataFile = path.join(directory, "auth-store.json");
  mkdirSync(path.join(clientDirectory, "assets"), { recursive: true });
  mkdirSync(path.join(clientDirectory, "downloads"), { recursive: true });
  writeFileSync(
    path.join(clientDirectory, "index.html"),
    '<!doctype html><html><body><div id="root">guide</div></body></html>',
  );
  writeFileSync(path.join(clientDirectory, "assets", "app.js"), "console.log('ok');");
  writeFileSync(path.join(clientDirectory, "downloads", "sample.pdf"), "%PDF-test");

  const store = createAuthStore({ filePath: dataFile, secret });
  const { code } = store.createCode({ label: "integration-order" });
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;

  const child = spawn(process.execPath, [path.join(root, "server", "index.mjs")], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      AUTH_COOKIE_SECRET: secret,
      CLIENT_PAID_TOKEN: clientToken,
      CLIENT_DIST_DIR: clientDirectory,
      AUTH_DATA_FILE: dataFile,
      COOKIE_SECURE: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await waitForHealth(baseUrl);

    const login = await fetch(`${baseUrl}/`, {
      headers: { Accept: "text/html" },
    });
    assert.equal(login.status, 200);
    let cookies = mergeCookieHeader(new Map(), getSetCookies(login));
    assert.match(cookieHeader(cookies), /lz_device=/);

    const redeem = await fetch(`${baseUrl}/api/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader(cookies),
      },
      body: JSON.stringify({ code }),
    });
    assert.equal(redeem.status, 200);
    cookies = mergeCookieHeader(cookies, getSetCookies(redeem));
    assert.match(cookieHeader(cookies), /lz_session=/);

    const protectedApp = await fetch(`${baseUrl}/app/`, {
      headers: { Accept: "text/html" },
      redirect: "manual",
    });
    assert.equal(protectedApp.status, 302);
    assert.equal(protectedApp.headers.get("location"), "/?reason=auth_required");

    const redirectToToken = await fetch(`${baseUrl}/app/`, {
      headers: {
        Accept: "text/html",
        Cookie: cookieHeader(cookies),
      },
      redirect: "manual",
    });
    assert.equal(redirectToToken.status, 302);
    assert.equal(redirectToToken.headers.get("location"), `/app/?token=${clientToken}`);

    const app = await fetch(`${baseUrl}/app/?token=${clientToken}`, {
      headers: {
        Accept: "text/html",
        Cookie: cookieHeader(cookies),
      },
    });
    assert.equal(app.status, 200);
    assert.match(await app.text(), /guide/);

    const download = await fetch(`${baseUrl}/app/downloads/sample.pdf`, {
      headers: { Cookie: cookieHeader(cookies) },
    });
    assert.equal(download.status, 200);
    assert.match(
      download.headers.get("content-disposition") ?? "",
      /attachment; filename="sample\.pdf"/,
    );

    const secondDevice = await fetch(`${baseUrl}/api/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    assert.equal(secondDevice.status, 200);

    const thirdDevice = await fetch(`${baseUrl}/api/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    assert.equal(thirdDevice.status, 403);
    assert.deepEqual(await thirdDevice.json(), {
      error: "device_limit",
      maxDevices: 2,
    });
  } finally {
    child.kill("SIGTERM");
    rmSync(directory, { recursive: true, force: true });
  }
});
