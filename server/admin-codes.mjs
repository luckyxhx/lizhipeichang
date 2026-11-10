#!/usr/bin/env node

import path from "node:path";
import { parseArgs } from "node:util";

import { createAuthStore, generateAuthorizationCode } from "./lib/codes.mjs";

const secret = process.env.AUTH_COOKIE_SECRET ?? "";
const dataFile = path.resolve(
  process.env.AUTH_DATA_FILE ?? path.join(process.cwd(), "server/data/auth-store.json"),
);

if (secret.length < 32) {
  console.error("AUTH_COOKIE_SECRET must contain at least 32 characters.");
  process.exit(1);
}

const store = createAuthStore({
  filePath: dataFile,
  secret,
});

const [command, ...rest] = process.argv.slice(2);

const parseCommand = (args) =>
  parseArgs({
    args,
    options: {
      label: { type: "string" },
      code: { type: "string" },
      expires: { type: "string" },
      "max-devices": { type: "string" },
      id: { type: "string" },
      count: { type: "string" },
      prefix: { type: "string" },
      format: { type: "string" },
    },
    allowPositionals: false,
    strict: true,
  }).values;

const printList = () => {
  const records = store.listCodes();
  if (records.length === 0) {
    console.log("No authorization codes.");
    return;
  }

  for (const record of records) {
    console.log(
      [
        record.id,
        record.status,
        `${record.deviceCount}/${record.maxDevices}`,
        record.label,
        record.expiresAt ?? "never",
      ].join("\t"),
    );
  }
};

const toOutputRecord = (item) => ({
  id: item.record.id,
  code: item.code,
  label: item.record.label,
  maxDevices: item.record.maxDevices,
  expiresAt: item.record.expiresAt,
});

try {
  if (command === "create") {
    const values = parseCommand(rest);
    if (!values.label) {
      throw new Error("--label is required");
    }
    const code = values.code ?? generateAuthorizationCode();
    const deviceLimit = Number(values["max-devices"] ?? 2);
    const result = store.createCode({
      label: values.label,
      code,
      expiresAt: values.expires ?? null,
      deviceLimit,
    });
    if (values.format === "json") {
      console.log(JSON.stringify(toOutputRecord(result)));
    } else {
      console.log(`id=${result.record.id}`);
      console.log(`code=${result.code}`);
      console.log(`label=${result.record.label}`);
      console.log(`maxDevices=${result.record.maxDevices}`);
      console.log(`expiresAt=${result.record.expiresAt ?? "never"}`);
    }
  } else if (command === "create-batch") {
    const values = parseCommand(rest);
    if (!values.prefix) {
      throw new Error("--prefix is required");
    }
    const count = Number(values.count ?? 1);
    const deviceLimit = Number(values["max-devices"] ?? 2);
    const results = store.createCodeBatch({
      labelPrefix: values.prefix,
      count,
      expiresAt: values.expires ?? null,
      deviceLimit,
    });
    if (values.format === "json") {
      console.log(JSON.stringify(results.map(toOutputRecord)));
    } else {
      for (const item of results) {
        console.log(
          [
            item.code,
            item.record.label,
            item.record.id,
            item.record.maxDevices,
            item.record.expiresAt ?? "never",
          ].join("\t"),
        );
      }
    }
  } else if (command === "list") {
    printList();
  } else if (command === "reset-devices") {
    const values = parseCommand(rest);
    if (!values.id) {
      throw new Error("--id is required");
    }
    if (!store.resetDevices(values.id)) {
      throw new Error(`Authorization code not found: ${values.id}`);
    }
    console.log(`devices reset for ${values.id}`);
  } else if (command === "revoke") {
    const values = parseCommand(rest);
    if (!values.id) {
      throw new Error("--id is required");
    }
    if (!store.revokeCode(values.id)) {
      throw new Error(`Authorization code not found: ${values.id}`);
    }
    console.log(`revoked ${values.id}`);
  } else {
    console.log(
      [
        "Usage:",
        "  node server/admin-codes.mjs create --label <order-label> [--code <code>] [--expires <ISO>] [--max-devices 2] [--format json]",
        "  node server/admin-codes.mjs create-batch --prefix <order-prefix> --count <1-50> [--expires <ISO>] [--max-devices 2] [--format json]",
        "  node server/admin-codes.mjs list",
        "  node server/admin-codes.mjs reset-devices --id <code-id>",
        "  node server/admin-codes.mjs revoke --id <code-id>",
      ].join("\n"),
    );
    process.exitCode = command ? 1 : 0;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
