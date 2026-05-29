import { randomBytes } from "node:crypto";

/** 產生可分享連結用的不易猜測 token */
export function generateShareToken(): string {
  return randomBytes(9).toString("base64url");
}
