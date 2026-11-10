import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createAuthStore, generateAuthorizationCode } from "../lib/codes.mjs";

const secret = "test-secret-that-is-longer-than-thirty-two-characters";

const createFixture = () => {
  const directory = mkdtempSync(path.join(tmpdir(), "lizhipeichang-codes-"));
  let nowMs = Date.parse("2026-11-10T10:00:00+08:00");
  const store = createAuthStore({
    filePath: path.join(directory, "auth-store.json"),
    secret,
    clock: () => nowMs,
  });

  return {
    store,
    directory,
    advance: (milliseconds) => {
      nowMs += milliseconds;
    },
  };
};

test("生成的授权码格式稳定", () => {
  for (let index = 0; index < 20; index += 1) {
    assert.match(generateAuthorizationCode(), /^LZ-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  }
});

test("一个授权码最多绑定两个设备", () => {
  const fixture = createFixture();
  try {
    const { code, record } = fixture.store.createCode({ label: "订单-001" });
    assert.equal(record.maxDevices, 2);

    assert.deepEqual(
      fixture.store.redeemCode({
        code,
        deviceId: "a".repeat(48),
      }),
      {
        ok: true,
        reason: "new_device",
        codeId: record.id,
        label: "订单-001",
        remainingDevices: 1,
      },
    );
    assert.equal(fixture.store.redeemCode({ code, deviceId: "b".repeat(48) }).ok, true);
    assert.equal(
      fixture.store.redeemCode({ code, deviceId: "a".repeat(48) }).reason,
      "already_bound",
    );
    assert.deepEqual(fixture.store.redeemCode({ code, deviceId: "c".repeat(48) }), {
      ok: false,
      reason: "device_limit",
      codeId: record.id,
      maxDevices: 2,
    });

    const listed = fixture.store.listCodes();
    assert.equal(listed[0].deviceCount, 2);
    assert.equal(listed[0].remainingDevices, 0);
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("重置设备后可以重新绑定", () => {
  const fixture = createFixture();
  try {
    const { code, record } = fixture.store.createCode({ label: "订单-002" });
    fixture.store.redeemCode({ code, deviceId: "a".repeat(48) });
    fixture.store.redeemCode({ code, deviceId: "b".repeat(48) });
    assert.equal(
      fixture.store.redeemCode({ code, deviceId: "c".repeat(48) }).reason,
      "device_limit",
    );

    assert.equal(fixture.store.resetDevices(record.id), true);
    assert.equal(fixture.store.redeemCode({ code, deviceId: "c".repeat(48) }).ok, true);
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("批量生成返回唯一授权码和连续标签", () => {
  const fixture = createFixture();
  try {
    const results = fixture.store.createCodeBatch({
      labelPrefix: "xhs-batch",
      count: 5,
    });

    assert.equal(results.length, 5);
    assert.equal(new Set(results.map((item) => item.code)).size, 5);
    assert.deepEqual(
      results.map((item) => item.record.label),
      [
        "xhs-batch-001",
        "xhs-batch-002",
        "xhs-batch-003",
        "xhs-batch-004",
        "xhs-batch-005",
      ],
    );
    assert.equal(fixture.store.listCodes().length, 5);
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("过期和停用授权码不再通过", () => {
  const fixture = createFixture();
  try {
    const expiresAt = "2026-11-11T10:00:00+08:00";
    const expiring = fixture.store.createCode({
      label: "订单-003",
      expiresAt,
    });
    fixture.advance(24 * 60 * 60 * 1000);
    assert.equal(
      fixture.store.redeemCode({
        code: expiring.code,
        deviceId: "a".repeat(48),
      }).reason,
      "expired_code",
    );
    assert.equal(
      fixture.store.resolveSession({
        codeId: expiring.record.id,
        deviceId: "a".repeat(48),
      }),
      null,
    );

    const active = fixture.store.createCode({ label: "订单-004" });
    assert.equal(
      fixture.store.redeemCode({
        code: active.code,
        deviceId: "b".repeat(48),
      }).ok,
      true,
    );
    assert.equal(fixture.store.revokeCode(active.record.id), true);
    assert.equal(
      fixture.store.resolveSession({
        codeId: active.record.id,
        deviceId: "b".repeat(48),
      }),
      null,
    );
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("会话只对已绑定设备有效", () => {
  const fixture = createFixture();
  try {
    const { code, record } = fixture.store.createCode({ label: "订单-005" });
    fixture.store.redeemCode({ code, deviceId: "a".repeat(48) });

    assert.deepEqual(
      fixture.store.resolveSession({
        codeId: record.id,
        deviceId: "a".repeat(48),
      }),
      {
        codeId: record.id,
        label: "订单-005",
        remainingDevices: 1,
      },
    );
    assert.equal(
      fixture.store.resolveSession({
        codeId: record.id,
        deviceId: "b".repeat(48),
      }),
      null,
    );
  } finally {
    rmSync(fixture.directory, { recursive: true, force: true });
  }
});
