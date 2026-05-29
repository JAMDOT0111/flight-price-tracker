import type { PriceSnapshot } from "@flight-tracker/shared";
import { prisma } from "../db.js";
import { sendToAll } from "./webpush.js";

/** 發現新低價時推播通知。 */
export async function notifyNewLow(trackedSearchId: string, snapshot: PriceSnapshot): Promise<void> {
  const s = await prisma.trackedSearch.findUnique({ where: { id: trackedSearchId } });
  if (!s) return;

  const dateRange = snapshot.bestReturnDate
    ? `${snapshot.bestOutboundDate} → ${snapshot.bestReturnDate}`
    : snapshot.bestOutboundDate;

  await sendToAll({
    title: `新低價：${s.origin}→${s.destination}`,
    body: `${snapshot.lowestPrice} ${snapshot.currency}（${dateRange}）`,
    url: `/s/${s.shareToken}`,
  });
}
