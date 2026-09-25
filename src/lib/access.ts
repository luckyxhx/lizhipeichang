import type { ProductEdition } from "@/types";

const normalizeToken = (token: string | null): string => token?.trim() ?? "";

export const parseAllowedTokens = (rawValue: string | undefined): string[] =>
  (rawValue ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

export const getTokenFromSearch = (search: string): string =>
  normalizeToken(new URLSearchParams(search).get("token"));

export const isTokenAllowed = (
  token: string,
  allowedTokensValue: string | undefined,
): boolean => {
  const normalizedToken = normalizeToken(token);
  if (!normalizedToken) {
    return false;
  }

  return parseAllowedTokens(allowedTokensValue).includes(normalizedToken);
};

export interface AccessResolution {
  authorized: boolean;
  edition: ProductEdition;
  token: string;
  tokenConfigured: boolean;
}

export const resolveAccess = (
  search: string,
  allowedTokensValue: string | undefined,
  paidTokensValue: string | undefined,
): AccessResolution => {
  const token = getTokenFromSearch(search);
  const freeTokens = parseAllowedTokens(allowedTokensValue);
  const paidTokens = parseAllowedTokens(paidTokensValue);
  const tokenConfigured = freeTokens.length > 0 || paidTokens.length > 0;

  if (token && paidTokens.includes(token)) {
    return {
      authorized: true,
      edition: "paid",
      token,
      tokenConfigured,
    };
  }

  if (token && freeTokens.includes(token)) {
    return {
      authorized: true,
      edition: "free",
      token,
      tokenConfigured,
    };
  }

  return {
    authorized: false,
    edition: "free",
    token,
    tokenConfigured,
  };
};

export const buildAccessUrl = (
  origin: string,
  pathname: string,
  token: string,
): string => {
  const url = new URL(`${origin}${pathname}`);
  url.searchParams.set("token", token);
  return url.toString();
};
