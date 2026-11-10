import { createHmac, timingSafeEqual } from "node:crypto";

const digest = (secret, value) =>
  createHmac("sha256", secret).update(value).digest("base64url");

export const createSessionToken = ({
  codeId,
  deviceId,
  secret,
  ttlSeconds,
  nowMs = Date.now(),
}) => {
  const expiresAt = Math.floor(nowMs / 1000) + ttlSeconds;
  const payload = Buffer.from(
    JSON.stringify({
      version: 1,
      codeId,
      deviceId,
      expiresAt,
    }),
  ).toString("base64url");
  const signature = digest(secret, `session.${payload}`);
  return `${payload}.${signature}`;
};

export const verifySessionToken = ({ token, secret, nowMs = Date.now() }) => {
  if (typeof token !== "string") {
    return null;
  }

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) {
    return null;
  }

  const expectedSignature = digest(secret, `session.${payload}`);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      parsed?.version !== 1 ||
      typeof parsed.codeId !== "string" ||
      typeof parsed.deviceId !== "string" ||
      !Number.isInteger(parsed.expiresAt) ||
      parsed.expiresAt <= Math.floor(nowMs / 1000)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};
