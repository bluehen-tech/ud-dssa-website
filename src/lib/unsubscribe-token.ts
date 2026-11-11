import { createHmac, timingSafeEqual } from "crypto";

/**
 * Stateless, HMAC-signed unsubscribe tokens.
 *
 * A token proves the unsubscribe link was minted by this server for exactly
 * this (email, list) pair, so a third party cannot unsubscribe someone else by
 * editing the URL. The secret never leaves the server; only the derived token
 * appears in email links.
 */

function getSecret(): string {
  return process.env.UNSUBSCRIBE_TOKEN_SECRET?.trim() || "";
}

function mac(secret: string, email: string, list: string): Buffer {
  return createHmac("sha256", secret)
    .update(`unsubscribe:v1:${email.trim().toLowerCase()}:${list}`)
    .digest();
}

/** Returns null when UNSUBSCRIBE_TOKEN_SECRET is not configured. */
export function signUnsubscribeToken(email: string, list: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  return mac(secret, email, list).toString("base64url");
}

export function verifyUnsubscribeToken(email: string, list: string, token: string): boolean {
  const secret = getSecret();
  if (!secret || !token) return false;

  const expected = mac(secret, email, list);
  let provided: Buffer;
  try {
    provided = Buffer.from(token, "base64url");
  } catch {
    return false;
  }
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
