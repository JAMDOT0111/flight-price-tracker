import webpush from "web-push";
import { prisma } from "../db.js";

const publicKey = process.env.VAPID_PUBLIC_KEY ?? "";
const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";

/** 是否已設定 VAPID 金鑰；未設定則推播功能為 no-op，不影響其餘功能。 */
export const pushEnabled = Boolean(publicKey && privateKey);
export const vapidPublicKey = publicKey;

if (pushEnabled) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** 推播給所有訂閱者；過期訂閱（404/410）自動清除。 */
export async function sendToAll(payload: PushPayload): Promise<void> {
  if (!pushEnabled) return;
  const subs = await prisma.pushSubscription.findMany();
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } }).catch(() => {});
        }
      }
    }),
  );
}
