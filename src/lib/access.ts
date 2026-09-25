import type { ProductEdition } from "@/types";

const normalizeToken = (token: string | null): string => token?.trim() ?? "";

export interface TokenRule {
  token: string;
  expiresAt: number | null;
}

export const parseAllowedTokens = (rawValue: string | undefined): string[] =>
  (rawValue ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

export const parseTokenRules = (rawValue: string | undefined): TokenRule[] => {
  const rules: TokenRule[] = [];

  parseAllowedTokens(rawValue).forEach((entry) => {
    const separatorIndex = entry.lastIndexOf("@");
    if (separatorIndex < 0) {
      rules.push({ token: entry, expiresAt: null });
      return;
    }

    const token = entry.slice(0, separatorIndex).trim();
    const expiryValue = entry.slice(separatorIndex + 1).trim();
    const expiresAt = Date.parse(expiryValue);

    if (token && Number.isFinite(expiresAt)) {
      rules.push({ token, expiresAt });
    }
  });

  return rules;
};

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

  return parseTokenRules(allowedTokensValue).some(
    (rule) =>
      rule.token === normalizedToken &&
      (rule.expiresAt === null || rule.expiresAt > Date.now()),
  );
};

export interface AccessResolution {
  authorized: boolean;
  edition: ProductEdition;
  token: string;
  tokenConfigured: boolean;
  expiresAt: number | null;
}

export const resolveAccess = (
  search: string,
  allowedTokensValue: string | undefined,
  paidTokensValue: string | undefined,
  now = Date.now(),
): AccessResolution => {
  const token = getTokenFromSearch(search);
  const freeTokenRules = parseTokenRules(allowedTokensValue);
  const paidTokenRules = parseTokenRules(paidTokensValue);
  const tokenConfigured =
    parseAllowedTokens(allowedTokensValue).length > 0 ||
    parseAllowedTokens(paidTokensValue).length > 0;

  const activePaidToken = paidTokenRules.find(
    (rule) => rule.token === token && (rule.expiresAt === null || rule.expiresAt > now),
  );
  if (token && activePaidToken) {
    return {
      authorized: true,
      edition: "paid",
      token,
      tokenConfigured,
      expiresAt: activePaidToken.expiresAt,
    };
  }

  const activeFreeToken = freeTokenRules.find(
    (rule) => rule.token === token && (rule.expiresAt === null || rule.expiresAt > now),
  );
  if (token && activeFreeToken) {
    return {
      authorized: true,
      edition: "free",
      token,
      tokenConfigured,
      expiresAt: activeFreeToken.expiresAt,
    };
  }

  return {
    authorized: false,
    edition: "free",
    token,
    tokenConfigured,
    expiresAt: null,
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
