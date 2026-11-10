import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

import { createAuthStore } from "./lib/codes.mjs";
import { createSessionToken, verifySessionToken } from "./lib/sessions.mjs";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 3010);
const host = process.env.HOST ?? "127.0.0.1";
const authSecret = process.env.AUTH_COOKIE_SECRET ?? "";
const clientPaidToken = process.env.CLIENT_PAID_TOKEN ?? "";
const clientDistDirectory = path.resolve(
  process.env.CLIENT_DIST_DIR ?? path.join(currentDirectory, "..", "dist"),
);
const authDataFile = path.resolve(
  process.env.AUTH_DATA_FILE ?? path.join(currentDirectory, "data", "auth-store.json"),
);
const cookieSecure = process.env.COOKIE_SECURE === "true";
const sessionTtlSeconds = Number(process.env.SESSION_TTL_SECONDS ?? 15552000);
const deviceCookieMaxAgeSeconds = Number(
  process.env.DEVICE_COOKIE_MAX_AGE_SECONDS ?? 31536000,
);
const requestBodyLimit = 8 * 1024;
const loginPage = readFileSync(new URL("./login.html", import.meta.url), "utf8");

if (authSecret.length < 32) {
  throw new Error("AUTH_COOKIE_SECRET must be set to at least 32 characters");
}

if (clientPaidToken.length < 16) {
  throw new Error("CLIENT_PAID_TOKEN must be set to a private value");
}

const store = createAuthStore({
  filePath: authDataFile,
  secret: authSecret,
});

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

const rateLimitAttempts = new Map();
const attemptWindowMs = 10 * 60 * 1000;
const maxFailedAttempts = 10;

const parseCookies = (cookieHeader = "") =>
  new Map(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=");
        if (separatorIndex < 0) {
          return [part, ""];
        }
        return [
          decodeURIComponent(part.slice(0, separatorIndex)),
          decodeURIComponent(part.slice(separatorIndex + 1)),
        ];
      }),
  );

const appendSetCookie = (response, cookie) => {
  const existing = response.getHeader("Set-Cookie");
  if (!existing) {
    response.setHeader("Set-Cookie", cookie);
    return;
  }

  const cookies = Array.isArray(existing) ? existing : [existing];
  response.setHeader("Set-Cookie", [...cookies, cookie]);
};

const cookieAttributes = (maxAgeSeconds) =>
  `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${
    cookieSecure ? "; Secure" : ""
  }`;

const setDeviceCookie = (response, deviceId) => {
  appendSetCookie(
    response,
    `lz_device=${encodeURIComponent(deviceId)}; ${cookieAttributes(
      deviceCookieMaxAgeSeconds,
    )}`,
  );
};

const setSessionCookie = (response, token) => {
  appendSetCookie(
    response,
    `lz_session=${encodeURIComponent(token)}; ${cookieAttributes(sessionTtlSeconds)}`,
  );
};

const clearSessionCookie = (response) => {
  appendSetCookie(
    response,
    `lz_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
      cookieSecure ? "; Secure" : ""
    }`,
  );
};

const ensureDeviceId = (request, response) => {
  const cookies = parseCookies(request.headers.cookie);
  const existing = cookies.get("lz_device") ?? "";
  if (/^[a-f0-9]{32,96}$/.test(existing)) {
    return existing;
  }

  const deviceId = randomBytes(24).toString("hex");
  setDeviceCookie(response, deviceId);
  return deviceId;
};

const getClientIp = (request) => {
  const forwarded = request.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(",")[0];
  return (firstForwarded || request.socket.remoteAddress || "unknown").trim();
};

const readRateLimit = (key) => {
  const now = Date.now();
  const current = rateLimitAttempts.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitAttempts.set(key, { count: 0, resetAt: now + attemptWindowMs });
    return { blocked: false };
  }
  return {
    blocked: current.count >= maxFailedAttempts,
    retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
  };
};

const recordFailedAttempt = (key) => {
  const now = Date.now();
  const current = rateLimitAttempts.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitAttempts.set(key, {
      count: 1,
      resetAt: now + attemptWindowMs,
    });
    return;
  }
  current.count += 1;
};

const clearRateLimit = (key) => {
  rateLimitAttempts.delete(key);
};

const sendJson = (response, statusCode, payload, extraHeaders = {}) => {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  response.end(body);
};

const redirect = (response, location, statusCode = 302) => {
  response.writeHead(statusCode, {
    Location: location,
    "Cache-Control": "no-store",
  });
  response.end();
};

const readJsonBody = (request) =>
  new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > requestBodyLimit) {
        reject(new Error("request_too_large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("invalid_json"));
      }
    });
    request.on("error", reject);
  });

const originIsAllowed = (request) => {
  const origin = request.headers.origin;
  if (!origin) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const forwardedHost = request.headers["x-forwarded-host"];
    const hostHeader = Array.isArray(forwardedHost)
      ? forwardedHost[0]
      : forwardedHost || request.headers.host;
    return Boolean(hostHeader) && originUrl.host === hostHeader;
  } catch {
    return false;
  }
};

const appUrl = `/app/?${new URLSearchParams({ token: clientPaidToken }).toString()}`;

const resolveRequestSession = (request) => {
  const cookies = parseCookies(request.headers.cookie);
  const deviceId = cookies.get("lz_device") ?? "";
  const session = verifySessionToken({
    token: cookies.get("lz_session"),
    secret: authSecret,
  });
  if (!session || session.deviceId !== deviceId) {
    return null;
  }

  return store.resolveSession({
    codeId: session.codeId,
    deviceId: session.deviceId,
  });
};

const serveLoginPage = (request, response) => {
  ensureDeviceId(request, response);
  if (resolveRequestSession(request)) {
    redirect(response, appUrl);
    return;
  }

  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(loginPage),
    "Cache-Control": "no-store",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; form-action 'self'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  });
  response.end(loginPage);
};

const safeClientPath = (pathname) => {
  const relativePath = pathname.replace(/^\/app\/?/, "");
  if (!relativePath || relativePath.includes("\0")) {
    return path.join(clientDistDirectory, "index.html");
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(relativePath);
  } catch {
    return null;
  }
  const resolvedPath = path.resolve(clientDistDirectory, decodedPath);
  const allowedPrefix = `${path.resolve(clientDistDirectory)}${path.sep}`;
  if (resolvedPath !== path.resolve(clientDistDirectory, "index.html")) {
    if (!resolvedPath.startsWith(allowedPrefix)) {
      return null;
    }
  }
  return resolvedPath;
};

const serveFile = (request, response, filePath, { attachment = false } = {}) => {
  let stats;
  try {
    stats = statSync(filePath);
  } catch {
    return false;
  }

  if (!stats.isFile()) {
    return false;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes.get(extension) ?? "application/octet-stream";
  const headers = {
    "Content-Type": contentType,
    "Content-Length": stats.size,
    "Cache-Control": attachment
      ? "private, no-store"
      : extension === ".html"
        ? "no-store"
        : "private, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };

  if (attachment) {
    headers["Content-Disposition"] = `attachment; filename="${path.basename(filePath)}"`;
  }

  response.writeHead(200, headers);
  if (request.method === "HEAD") {
    response.end();
    return true;
  }

  const stream = createReadStream(filePath);
  stream.on("error", () => {
    if (!response.headersSent) {
      response.writeHead(500);
    }
    response.end();
  });
  stream.pipe(response);
  return true;
};

const handleApi = async (request, response, pathname) => {
  if (pathname === "/api/session" && request.method === "GET") {
    ensureDeviceId(request, response);
    const session = resolveRequestSession(request);
    sendJson(response, 200, {
      authorized: Boolean(session),
      appUrl: session ? appUrl : null,
      remainingDevices: session?.remainingDevices ?? null,
    });
    return true;
  }

  if (pathname === "/api/redeem" && request.method === "POST") {
    const deviceId = ensureDeviceId(request, response);
    if (!originIsAllowed(request)) {
      sendJson(response, 403, { error: "origin_not_allowed" });
      return true;
    }

    const rateLimitKey = getClientIp(request);
    const rateLimit = readRateLimit(rateLimitKey);
    if (rateLimit.blocked) {
      sendJson(
        response,
        429,
        { error: "rate_limited" },
        { "Retry-After": String(rateLimit.retryAfterSeconds ?? 600) },
      );
      return true;
    }

    let payload;
    try {
      payload = await readJsonBody(request);
    } catch {
      recordFailedAttempt(rateLimitKey);
      sendJson(response, 400, { error: "invalid_request" });
      return true;
    }

    const result = store.redeemCode({
      code: payload?.code,
      deviceId,
    });

    if (!result.ok) {
      recordFailedAttempt(rateLimitKey);
      const statusCode =
        result.reason === "device_limit"
          ? 403
          : result.reason === "expired_code"
            ? 410
            : 401;
      sendJson(response, statusCode, {
        error: result.reason,
        maxDevices: result.maxDevices ?? null,
      });
      return true;
    }

    clearRateLimit(rateLimitKey);
    const session = createSessionToken({
      codeId: result.codeId,
      deviceId,
      secret: authSecret,
      ttlSeconds: sessionTtlSeconds,
    });
    setSessionCookie(response, session);
    sendJson(response, 200, {
      authorized: true,
      appUrl,
      remainingDevices: result.remainingDevices,
    });
    return true;
  }

  if (pathname === "/api/logout" && request.method === "POST") {
    clearSessionCookie(response);
    sendJson(response, 200, { ok: true });
    return true;
  }

  return false;
};

const handleApp = (request, response, url) => {
  const session = resolveRequestSession(request);
  if (!session) {
    if ((request.headers.accept ?? "").includes("text/html")) {
      redirect(response, "/?reason=auth_required");
    } else {
      sendJson(response, 401, { error: "unauthorized" });
    }
    return;
  }

  const filePath = safeClientPath(url.pathname);
  if (!filePath) {
    sendJson(response, 400, { error: "invalid_path" });
    return;
  }

  if (url.pathname === "/app" || url.pathname === "/app/") {
    if (url.searchParams.get("token") !== clientPaidToken) {
      url.searchParams.set("token", clientPaidToken);
      redirect(
        response,
        url.pathname.replace(/^\/app$/, "/app/") + `?${url.searchParams}`,
      );
      return;
    }
    if (!serveFile(request, response, filePath)) {
      sendJson(response, 503, { error: "client_not_built" });
    }
    return;
  }

  if (
    serveFile(request, response, filePath, {
      attachment: url.pathname.startsWith("/app/downloads/"),
    })
  ) {
    return;
  }

  if ((request.headers.accept ?? "").includes("text/html")) {
    if (!serveFile(request, response, path.join(clientDistDirectory, "index.html"))) {
      sendJson(response, 503, { error: "client_not_built" });
    }
    return;
  }

  sendJson(response, 404, { error: "not_found" });
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`,
    );

    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    if (url.pathname === "/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (await handleApi(request, response, url.pathname)) {
      return;
    }

    if (url.pathname === "/") {
      serveLoginPage(request, response);
      return;
    }

    if (url.pathname === "/app" || url.pathname.startsWith("/app/")) {
      handleApp(request, response, url);
      return;
    }

    sendJson(response, 404, { error: "not_found" });
  } catch (error) {
    console.error("Request failed", {
      method: request.method,
      path: request.url?.split("?")[0],
      error: error instanceof Error ? error.message : String(error),
    });
    if (!response.headersSent) {
      sendJson(response, 500, { error: "server_error" });
    } else {
      response.end();
    }
  }
});

server.listen(port, host, () => {
  console.log(`Authorization server listening at http://${host}:${port}`);
  console.log(`Client directory: ${clientDistDirectory}`);
  console.log(`Authorization data: ${store.filePath}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
