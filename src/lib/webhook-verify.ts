import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/**
 * Returns true if request is authorized when a secret is configured.
 * If `secret` is empty/undefined, verification is skipped (open endpoint).
 */
export function verifyOutrankWebhook(request: Request, secret: string | undefined): boolean {
  const s = secret?.trim();
  if (!s) return true;

  const h1 = request.headers.get("x-webhook-signature");
  const h2 = request.headers.get("x-outrank-signature");
  const auth = request.headers.get("authorization");
  const bearer =
    auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;

  const candidates = [h1, h2, bearer].filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );

  if (candidates.length === 0) return false;

  return candidates.some((c) => safeEqual(c, s));
}
