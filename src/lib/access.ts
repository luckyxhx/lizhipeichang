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

export const buildAccessUrl = (
  origin: string,
  pathname: string,
  token: string,
): string => {
  const url = new URL(`${origin}${pathname}`);
  url.searchParams.set("token", token);
  return url.toString();
};
