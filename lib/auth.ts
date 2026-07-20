import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE_NAME = "escg_admin_session";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("ADMIN_PASSWORD environment variable is not set.");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

// Compares in constant time regardless of input length. Comparing the raw
// buffers directly would short-circuit on a length mismatch before ever
// calling timingSafeEqual, making the length-equality check itself an
// (extremely low-value, but real) timing side-channel — pad both to the same
// fixed size first so timingSafeEqual always runs, then check length with a
// trivial equality that isn't gating the expensive comparison.
function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  const paddedLength = Math.max(aBuf.length, bBuf.length, 256);
  const aPadded = Buffer.alloc(paddedLength);
  const bPadded = Buffer.alloc(paddedLength);
  aBuf.copy(aPadded);
  bBuf.copy(bPadded);
  return timingSafeEqual(aPadded, bPadded) && aBuf.length === bBuf.length;
}

export function matchesAdminPassword(password: string): boolean {
  return Boolean(password) && safeEqual(password, getSecret());
}

export function createSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_DURATION_MS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) {
    return false;
  }

  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}
