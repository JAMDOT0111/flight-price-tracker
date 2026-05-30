import type { FlightProvider, ProviderName } from "@flight-tracker/shared";
import { buildProviderByName, getPrimaryProviderName, getProviderChain } from "./index.js";
import { getUsage } from "./usage.js";

export interface SelectedProvider {
  provider: FlightProvider;
  name: ProviderName;
  /** 是否因「不可用或達上限」而退回非首選來源 */
  fellBack: boolean;
}

export interface ProviderUsageStatus {
  provider: ProviderName;
  used: number;
  /** null 代表無上限 */
  limit: number | null;
  available: boolean;
}

/**
 * 取得某來源的每月搜尋上限：環境變數 `<NAME>_SEARCH_LIMIT`（正整數）。
 * mock 一律無上限；未設定或非正整數視為無上限（null）。
 */
function getLimit(name: ProviderName): number | null {
  if (name === "mock") return null;
  const raw = process.env[`${name.toUpperCase()}_SEARCH_LIMIT`];
  const n = Number(raw);
  return raw && Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

/** 嘗試建立 provider；缺金鑰等情況回 null（代表不可用）。 */
function tryBuild(name: ProviderName): FlightProvider | null {
  try {
    return buildProviderByName(name);
  } catch {
    return null;
  }
}

async function isUnderLimit(name: ProviderName): Promise<boolean> {
  const limit = getLimit(name);
  if (limit === null) return true;
  return (await getUsage(name)) < limit;
}

/**
 * 依優先序挑出「可用且未達上限」的第一個來源；mock 為永遠可用的保底。
 */
export async function selectProvider(): Promise<SelectedProvider> {
  const chain = getProviderChain();
  const primary = chain[0];
  for (const name of chain) {
    const provider = tryBuild(name);
    if (!provider) continue;
    if (!(await isUnderLimit(name))) continue;
    return { provider, name, fellBack: name !== primary };
  }
  return { provider: buildProviderByName("mock"), name: "mock", fellBack: primary !== "mock" };
}

/** 退回非首選來源的原因：未設定（缺金鑰等不可用）或已達用量上限。 */
export type FallbackReason = "unavailable" | "quota";

/** 供 /api/config 顯示：各來源用量、目前生效來源、退回原因。 */
export async function getProviderStatus(): Promise<{
  primaryProvider: ProviderName;
  activeProvider: ProviderName;
  fallbackReason: FallbackReason | null;
  usage: ProviderUsageStatus[];
}> {
  const chain = getProviderChain();
  const usage: ProviderUsageStatus[] = [];
  for (const name of chain) {
    usage.push({
      provider: name,
      used: await getUsage(name),
      limit: getLimit(name),
      available: tryBuild(name) !== null,
    });
  }
  const primary = getPrimaryProviderName();
  const selected = await selectProvider();
  let fallbackReason: FallbackReason | null = null;
  if (selected.name !== primary) {
    const primaryStatus = usage.find((u) => u.provider === primary);
    fallbackReason = primaryStatus && !primaryStatus.available ? "unavailable" : "quota";
  }
  return { primaryProvider: primary, activeProvider: selected.name, fallbackReason, usage };
}
