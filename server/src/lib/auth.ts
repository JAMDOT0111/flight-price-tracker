import { createHash, timingSafeEqual } from "node:crypto";

/** 使用 timingSafeEqual 防止 timing attack 的常數時間比較 */
export function verifyRunSecret(authHeader: string | undefined): boolean {
  const secret = process.env.RUN_SECRET?.trim();
  if (!secret) return false;
  const token = (authHeader ?? "").replace(/^Bearer\s+/i, "");
  const a = createHash("sha256").update(token).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}
