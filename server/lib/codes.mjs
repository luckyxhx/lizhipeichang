import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

export const DEFAULT_MAX_DEVICES = 2;
export const CODE_FORMAT_EXAMPLE = "LZ-XXXX-XXXX";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const digest = (secret, context, value) =>
  createHmac("sha256", secret).update(`${context}:${value}`).digest("hex");

const normalizeCode = (value) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

const normalizeDeviceId = (value) => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return /^[a-f0-9]{32,96}$/.test(normalized) ? normalized : "";
};

const publicRecord = (record, nowMs) => {
  const expiresAtMs = record.expiresAt ? Date.parse(record.expiresAt) : null;
  const isRevoked = Boolean(record.revokedAt);
  const isExpired = expiresAtMs !== null && expiresAtMs <= nowMs;
  const deviceCount = record.devices.length;

  return {
    id: record.id,
    label: record.label,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    revokedAt: record.revokedAt,
    maxDevices: record.maxDevices,
    deviceCount,
    remainingDevices: Math.max(0, record.maxDevices - deviceCount),
    status: isRevoked ? "revoked" : isExpired ? "expired" : "active",
    devices: record.devices.map((device) => ({
      firstSeenAt: device.firstSeenAt,
      lastSeenAt: device.lastSeenAt,
    })),
  };
};

const assertSecret = (secret) => {
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("AUTH_COOKIE_SECRET must contain at least 32 characters");
  }
};

const emptyStore = () => ({
  version: 1,
  codes: [],
});

export const generateAuthorizationCode = () => {
  const bytes = randomBytes(8);
  const chars = Array.from(bytes, (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]);
  return `LZ-${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
};

export const createAuthStore = ({
  filePath,
  secret,
  maxDevices = DEFAULT_MAX_DEVICES,
  clock = () => Date.now(),
}) => {
  assertSecret(secret);

  if (!Number.isInteger(maxDevices) || maxDevices < 1 || maxDevices > 10) {
    throw new Error("maxDevices must be an integer between 1 and 10");
  }

  const absolutePath = path.resolve(filePath);

  const readStore = () => {
    if (!existsSync(absolutePath)) {
      return emptyStore();
    }

    try {
      const parsed = JSON.parse(readFileSync(absolutePath, "utf8"));
      if (!parsed || !Array.isArray(parsed.codes)) {
        throw new Error("Invalid authorization store shape");
      }
      return parsed;
    } catch (error) {
      throw new Error(
        `Unable to read authorization store: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  const writeStore = (store) => {
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    const temporaryPath = `${absolutePath}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
    writeFileSync(temporaryPath, `${JSON.stringify(store, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    renameSync(temporaryPath, absolutePath);
  };

  const findRecordByHash = (store, codeHash) =>
    store.codes.find((record) => record.codeHash === codeHash);

  const findRecordById = (store, id) => store.codes.find((record) => record.id === id);

  const createCode = ({
    label,
    code = generateAuthorizationCode(),
    expiresAt = null,
    deviceLimit = maxDevices,
  }) => {
    const normalizedCode = normalizeCode(code);
    if (normalizedCode.length < 8) {
      throw new Error("Authorization code must contain at least 8 characters");
    }

    const normalizedLabel = String(label ?? "").trim();
    if (!normalizedLabel) {
      throw new Error("A label is required so the code can be matched to an order");
    }

    if (
      expiresAt !== null &&
      (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= clock())
    ) {
      throw new Error("expiresAt must be a future ISO date");
    }

    if (!Number.isInteger(deviceLimit) || deviceLimit < 1 || deviceLimit > 10) {
      throw new Error("deviceLimit must be an integer between 1 and 10");
    }

    const store = readStore();
    const codeHash = digest(secret, "code", normalizedCode);
    if (findRecordByHash(store, codeHash)) {
      throw new Error("Authorization code already exists");
    }

    const record = {
      id: `code_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
      codeHash,
      label: normalizedLabel,
      createdAt: new Date(clock()).toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      revokedAt: null,
      maxDevices: deviceLimit,
      devices: [],
    };

    store.codes.push(record);
    writeStore(store);

    return {
      code: normalizedCode,
      record: publicRecord(record, clock()),
    };
  };

  const createCodeBatch = ({
    labelPrefix,
    count,
    expiresAt = null,
    deviceLimit = maxDevices,
  }) => {
    const normalizedPrefix = String(labelPrefix ?? "").trim();
    if (!normalizedPrefix) {
      throw new Error("A label prefix is required");
    }
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      throw new Error("Batch count must be an integer between 1 and 50");
    }
    if (
      expiresAt !== null &&
      (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= clock())
    ) {
      throw new Error("expiresAt must be a future ISO date");
    }
    if (!Number.isInteger(deviceLimit) || deviceLimit < 1 || deviceLimit > 10) {
      throw new Error("deviceLimit must be an integer between 1 and 10");
    }

    const store = readStore();
    const created = [];
    const nowIso = new Date(clock()).toISOString();
    const expiresAtIso = expiresAt ? new Date(expiresAt).toISOString() : null;

    for (let index = 1; index <= count; index += 1) {
      let code;
      let codeHash;
      do {
        code = generateAuthorizationCode();
        codeHash = digest(secret, "code", code);
      } while (findRecordByHash(store, codeHash));

      const record = {
        id: `code_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
        codeHash,
        label: `${normalizedPrefix}-${String(index).padStart(3, "0")}`,
        createdAt: nowIso,
        expiresAt: expiresAtIso,
        revokedAt: null,
        maxDevices: deviceLimit,
        devices: [],
      };
      store.codes.push(record);
      created.push({
        code,
        record: publicRecord(record, clock()),
      });
    }

    writeStore(store);
    return created;
  };

  const redeemCode = ({ code, deviceId }) => {
    const normalizedCode = normalizeCode(code);
    const normalizedDeviceId = normalizeDeviceId(deviceId);
    if (!normalizedCode || !normalizedDeviceId) {
      return { ok: false, reason: "invalid_code" };
    }

    const store = readStore();
    const codeHash = digest(secret, "code", normalizedCode);
    const record = findRecordByHash(store, codeHash);
    if (!record) {
      return { ok: false, reason: "invalid_code" };
    }

    const nowMs = clock();
    const expiresAtMs = record.expiresAt ? Date.parse(record.expiresAt) : null;
    if (record.revokedAt) {
      return { ok: false, reason: "revoked_code" };
    }
    if (expiresAtMs !== null && expiresAtMs <= nowMs) {
      return { ok: false, reason: "expired_code" };
    }

    const deviceHash = digest(secret, "device", normalizedDeviceId);
    const existingDevice = record.devices.find(
      (device) => device.deviceHash === deviceHash,
    );
    const nowIso = new Date(nowMs).toISOString();

    if (existingDevice) {
      existingDevice.lastSeenAt = nowIso;
      writeStore(store);
      return {
        ok: true,
        reason: "already_bound",
        codeId: record.id,
        label: record.label,
        remainingDevices: Math.max(0, record.maxDevices - record.devices.length),
      };
    }

    if (record.devices.length >= record.maxDevices) {
      return {
        ok: false,
        reason: "device_limit",
        codeId: record.id,
        maxDevices: record.maxDevices,
      };
    }

    record.devices.push({
      deviceHash,
      firstSeenAt: nowIso,
      lastSeenAt: nowIso,
    });
    writeStore(store);

    return {
      ok: true,
      reason: "new_device",
      codeId: record.id,
      label: record.label,
      remainingDevices: Math.max(0, record.maxDevices - record.devices.length),
    };
  };

  const resolveSession = ({ codeId, deviceId }) => {
    const normalizedDeviceId = normalizeDeviceId(deviceId);
    if (!codeId || !normalizedDeviceId) {
      return null;
    }

    const store = readStore();
    const record = findRecordById(store, codeId);
    if (!record) {
      return null;
    }

    const nowMs = clock();
    const expiresAtMs = record.expiresAt ? Date.parse(record.expiresAt) : null;
    if (record.revokedAt || (expiresAtMs !== null && expiresAtMs <= nowMs)) {
      return null;
    }

    const deviceHash = digest(secret, "device", normalizedDeviceId);
    const device = record.devices.find((item) => item.deviceHash === deviceHash);
    if (!device) {
      return null;
    }

    return {
      codeId: record.id,
      label: record.label,
      remainingDevices: Math.max(0, record.maxDevices - record.devices.length),
    };
  };

  const listCodes = () => {
    const store = readStore();
    const nowMs = clock();
    return store.codes
      .map((record) => publicRecord(record, nowMs))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  };

  const resetDevices = (id) => {
    const store = readStore();
    const record = findRecordById(store, id);
    if (!record) {
      return false;
    }
    record.devices = [];
    writeStore(store);
    return true;
  };

  const revokeCode = (id) => {
    const store = readStore();
    const record = findRecordById(store, id);
    if (!record) {
      return false;
    }
    record.revokedAt = new Date(clock()).toISOString();
    writeStore(store);
    return true;
  };

  return {
    filePath: absolutePath,
    createCode,
    createCodeBatch,
    redeemCode,
    resolveSession,
    listCodes,
    resetDevices,
    revokeCode,
  };
};

export { normalizeCode };
