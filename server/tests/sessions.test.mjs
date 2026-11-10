import assert from "node:assert/strict";
import test from "node:test";

import { createSessionToken, verifySessionToken } from "../lib/sessions.mjs";

const secret = "session-test-secret-that-is-longer-than-thirty-two-characters";

test("签名会话可以验证并包含绑定信息", () => {
  const nowMs = Date.parse("2026-11-10T10:00:00+08:00");
  const token = createSessionToken({
    codeId: "code_123",
    deviceId: "a".repeat(48),
    secret,
    ttlSeconds: 3600,
    nowMs,
  });

  assert.deepEqual(verifySessionToken({ token, secret, nowMs: nowMs + 1000 }), {
    version: 1,
    codeId: "code_123",
    deviceId: "a".repeat(48),
    expiresAt: Math.floor(nowMs / 1000) + 3600,
  });
});

test("篡改或过期的会话不通过", () => {
  const nowMs = Date.parse("2026-11-10T10:00:00+08:00");
  const token = createSessionToken({
    codeId: "code_123",
    deviceId: "a".repeat(48),
    secret,
    ttlSeconds: 60,
    nowMs,
  });

  assert.equal(
    verifySessionToken({
      token: `${token.slice(0, -1)}x`,
      secret,
      nowMs,
    }),
    null,
  );
  assert.equal(
    verifySessionToken({
      token,
      secret,
      nowMs: nowMs + 61_000,
    }),
    null,
  );
});
