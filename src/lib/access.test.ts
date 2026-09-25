import { describe, expect, it } from "vitest";

import {
  buildAccessUrl,
  getTokenFromSearch,
  isTokenAllowed,
  parseAllowedTokens,
  parseTokenRules,
  resolveAccess,
} from "@/lib/access";

describe("access", () => {
  it("解析去空格后的 token 列表", () => {
    expect(parseAllowedTokens("abc123, def456,,ghi789")).toEqual([
      "abc123",
      "def456",
      "ghi789",
    ]);
  });

  it("仅允许精确匹配的 token", () => {
    expect(isTokenAllowed("abc123", "abc123,def456")).toBe(true);
    expect(isTokenAllowed(" ABC123 ", "abc123,def456")).toBe(false);
    expect(isTokenAllowed("", "abc123")).toBe(false);
  });

  it("从查询字符串读取 token", () => {
    expect(getTokenFromSearch("?token=abc123&source=xhs")).toBe("abc123");
    expect(getTokenFromSearch("?source=xhs")).toBe("");
  });

  it("构建带 token 的访问链接", () => {
    expect(buildAccessUrl("https://example.com", "/", "abc123")).toBe(
      "https://example.com/?token=abc123",
    );
  });

  it("按 token 列表区分免费版和完整版", () => {
    expect(resolveAccess("?token=free123", "free123", "paid123")).toMatchObject({
      authorized: true,
      edition: "free",
    });
    expect(resolveAccess("?token=paid123", "free123", "paid123")).toMatchObject({
      authorized: true,
      edition: "paid",
    });
  });

  it("完整版 token 优先于免费版 token", () => {
    expect(resolveAccess("?token=paid123", "paid123", "paid123").edition).toBe("paid");
  });

  it("无效 token 不授权", () => {
    expect(resolveAccess("?token=unknown", "free123", "paid123")).toMatchObject({
      authorized: false,
      edition: "free",
      tokenConfigured: true,
    });
  });

  it("支持带 ISO 有效期的 token", () => {
    const rules = parseTokenRules(
      "free123@2026-12-31T23:59:59+08:00,paid123@2026-12-31T23:59:59+08:00",
    );

    expect(rules).toHaveLength(2);
    expect(rules[1]).toMatchObject({
      token: "paid123",
      expiresAt: Date.parse("2026-12-31T23:59:59+08:00"),
    });
  });

  it("有效期结束后不再授权", () => {
    const paidToken = "paid123@2026-12-31T23:59:59+08:00";
    const beforeExpiry = Date.parse("2026-12-30T00:00:00+08:00");
    const afterExpiry = Date.parse("2027-01-01T00:00:00+08:00");

    expect(
      resolveAccess("?token=paid123", undefined, paidToken, beforeExpiry),
    ).toMatchObject({
      authorized: true,
      edition: "paid",
      expiresAt: Date.parse("2026-12-31T23:59:59+08:00"),
    });
    expect(
      resolveAccess("?token=paid123", undefined, paidToken, afterExpiry),
    ).toMatchObject({
      authorized: false,
      edition: "free",
    });
  });
});
