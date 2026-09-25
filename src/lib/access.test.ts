import { describe, expect, it } from "vitest";

import {
  buildAccessUrl,
  getTokenFromSearch,
  isTokenAllowed,
  parseAllowedTokens,
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
});
