import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../env.js";

// ---- Auth tokens (JWT, sent as "Authorization: Bearer <token>") ----

export interface AuthToken {
  userId: number;
  jti: string;
  expiresAt: Date;
}

export function signAuthToken(userId: number): string {
  return jwt.sign({}, env.jwtSecret, {
    algorithm: "HS256",
    subject: String(userId),
    jwtid: randomUUID(),
    expiresIn: env.tokenTtlSeconds,
  });
}

export function verifyAuthToken(token: string): AuthToken | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
    if (typeof payload === "string" || !payload.sub || !payload.jti || !payload.exp) return null;
    return {
      userId: Number(payload.sub),
      jti: payload.jti,
      expiresAt: new Date(payload.exp * 1000),
    };
  } catch {
    return null;
  }
}

// ---- Signed download links ----
// The link carries who may download what and until when, plus an HMAC signature
// over those values. Changing any of them makes the signature invalid.

export const DOWNLOAD_LINK_TTL_SECONDS = 5 * 60;

function downloadSignature(userId: number, productId: number, expires: number): string {
  return createHmac("sha256", env.jwtSecret)
    .update(`download:${userId}:${productId}:${expires}`)
    .digest("hex");
}

export function signDownload(userId: number, productId: number) {
  const expires = Math.floor(Date.now() / 1000) + DOWNLOAD_LINK_TTL_SECONDS;
  return { expires, signature: downloadSignature(userId, productId, expires) };
}

export function verifyDownload(
  userId: number,
  productId: number,
  expires: number,
  signature: string,
): boolean {
  if (expires < Date.now() / 1000) return false;
  const expected = Buffer.from(downloadSignature(userId, productId, expires));
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
