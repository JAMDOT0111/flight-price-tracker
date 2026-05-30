import type { ProviderName } from "@flight-tracker/shared";
import { prisma } from "../db.js";

/** 目前的計數期間（UTC 月份，"YYYY-MM"）。 */
export function currentPeriod(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** 取得某來源在指定期間的累計搜尋次數。 */
export async function getUsage(provider: ProviderName, period = currentPeriod()): Promise<number> {
  const row = await prisma.providerUsage.findUnique({
    where: { provider_period: { provider, period } },
  });
  return row?.searchCount ?? 0;
}

/** 累加某來源在指定期間的搜尋次數。 */
export async function addUsage(
  provider: ProviderName,
  count: number,
  period = currentPeriod(),
): Promise<void> {
  if (count <= 0) return;
  await prisma.providerUsage.upsert({
    where: { provider_period: { provider, period } },
    create: { provider, period, searchCount: count },
    update: { searchCount: { increment: count } },
  });
}
