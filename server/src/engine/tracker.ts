import type { Prisma } from "@prisma/client";
import type {
  FlightOffer,
  FlightOfferSummary,
  FlightProvider,
  PriceSnapshot,
  ProviderName,
  TrackedSearch,
} from "@flight-tracker/shared";
import { prisma } from "../db.js";
import { priceSnapshotToDomain, trackedSearchToDomain } from "../lib/mappers.js";
import { buildProviderByName, getProviderChain } from "../providers/index.js";
import { addUsage, getUsage } from "../providers/usage.js";
import { offerMatches } from "./filters.js";
import { capPairs, enumerateDatePairs, type DatePair } from "./window.js";

const MAX_QUERIES = Number(process.env.MAX_QUERIES_PER_RUN ?? 60);

export interface RunResult {
  trackedSearchId: string;
  evaluated: number;
  matched: number;
  snapshot: PriceSnapshot | null;
  isNewLow: boolean;
}

function summarize(offer: FlightOffer): FlightOfferSummary {
  const carriers = new Set<string>();
  for (const s of offer.outbound.segments) carriers.add(s.carrierCode);
  if (offer.inbound) for (const s of offer.inbound.segments) carriers.add(s.carrierCode);
  const outSegs = offer.outbound.segments;
  const inSegs = offer.inbound?.segments;
  return {
    carrierCodes: [...carriers],
    outboundDepartAt: outSegs[0].departAt,
    outboundArriveAt: outSegs[outSegs.length - 1].arriveAt,
    inboundDepartAt: inSegs ? inSegs[0].departAt : null,
    inboundArriveAt: inSegs ? inSegs[inSegs.length - 1].arriveAt : null,
    outboundStops: offer.outbound.stops,
    inboundStops: offer.inbound ? offer.inbound.stops : null,
  };
}

/** Provider 名稱轉換為對應的 env var 前綴（"google-flights" → "GOOGLE_FLIGHTS"）。 */
function envPrefix(name: ProviderName): string {
  return name.toUpperCase().replace(/-/g, "_");
}

function getProviderLimit(name: ProviderName): number | null {
  if (name === "mock") return null;
  const raw = process.env[`${envPrefix(name)}_SEARCH_LIMIT`];
  const n = Number(raw);
  return raw && Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function tryBuildProvider(name: ProviderName): FlightProvider | null {
  try {
    return buildProviderByName(name);
  } catch {
    return null;
  }
}

async function isProviderAvailable(name: ProviderName): Promise<boolean> {
  const limit = getProviderLimit(name);
  if (limit === null) return true;
  return (await getUsage(name)) < limit;
}

export async function runTrackedSearch(search: TrackedSearch): Promise<RunResult> {
  return runTrackedSearchWithChain(search, getProviderChain());
}

/**
 * 對單一追蹤項目跑一輪，查詢指定 chain 中所有可用來源，取全域最低價並寫入快照。
 * 每個 provider 各自尊重其用量上限，失敗的單次查詢不中斷整輪。
 */
export async function runTrackedSearchWithChain(
  search: TrackedSearch,
  chain: ProviderName[],
): Promise<RunResult> {
  const pairs = capPairs(enumerateDatePairs(search), MAX_QUERIES);

  let best: { offer: FlightOffer; pair: DatePair; source: ProviderName; provider: FlightProvider } | null = null;
  let totalMatched = 0;

  for (const providerName of chain) {
    const provider = tryBuildProvider(providerName);
    if (!provider) continue;
    if (!(await isProviderAvailable(providerName))) continue;

    let searchCount = 0;
    for (const pair of pairs) {
      try {
        const offers = await provider.search({
          origin: search.origin,
          destination: search.destination,
          departureDate: pair.departureDate,
          returnDate: pair.returnDate,
          passengers: search.passengers,
          nonStop: search.nonStop,
          currency: search.currency,
        });
        searchCount++;
        for (const offer of offers) {
          if (!offerMatches(offer, search)) continue;
          totalMatched++;
          if (!best || offer.totalPrice < best.offer.totalPrice) {
            best = { offer, pair, source: providerName, provider };
          }
        }
      } catch (err) {
        console.error(`[tracker] ${providerName} 查詢失敗 (${pair.departureDate}):`, err);
      }
    }
    if (searchCount > 0) await addUsage(providerName, searchCount);
  }

  if (!best) {
    return { trackedSearchId: search.id, evaluated: pairs.length, matched: 0, snapshot: null, isNewLow: false };
  }

  const { offer, pair, source: providerName, provider } = best;

  const prevMin = await prisma.priceSnapshot.aggregate({
    where: { trackedSearchId: search.id },
    _min: { lowestPrice: true },
  });
  const isNewLow =
    prevMin._min.lowestPrice === null || offer.totalPrice < prevMin._min.lowestPrice;

  let bookingDeepLink = offer.bookingDeepLink;
  let bookingReturnDeepLink: string | null = null;
  if (provider.resolveBookingLink) {
    try {
      const links = await provider.resolveBookingLink(offer);
      if (links) {
        bookingDeepLink = links.outbound;
        bookingReturnDeepLink = links.inbound;
      }
    } catch (err) {
      console.error(`[tracker] 解析訂票連結失敗 (${providerName}):`, err);
    }
  }

  const row = await prisma.priceSnapshot.create({
    data: {
      trackedSearchId: search.id,
      lowestPrice: offer.totalPrice,
      currency: offer.currency,
      bestOutboundDate: pair.departureDate,
      bestReturnDate: pair.returnDate,
      bookingDeepLink,
      bookingReturnDeepLink,
      offerSummary: summarize(offer) as unknown as Prisma.InputJsonValue,
      source: providerName,
    },
  });

  return {
    trackedSearchId: search.id,
    evaluated: pairs.length,
    matched: totalMatched,
    snapshot: priceSnapshotToDomain(row),
    isNewLow,
  };
}

export async function runTrackedSearchById(id: string, chain?: ProviderName[]): Promise<RunResult | null> {
  const row = await prisma.trackedSearch.findUnique({ where: { id } });
  if (!row) return null;
  const search = trackedSearchToDomain(row);
  return chain ? runTrackedSearchWithChain(search, chain) : runTrackedSearch(search);
}

/** 對所有 active 的追蹤項目各跑一輪（逐一執行以控制負載）。 */
export async function runAllActive(
  onResult?: (result: RunResult) => void | Promise<void>,
): Promise<RunResult[]> {
  return runAllActiveWithChain(getProviderChain(), onResult);
}

/**
 * 同 runAllActive，但允許外部指定 provider 鏈（供 GitHub Actions 分開排程使用）。
 * 例如：只用 ["google-flights"] 的每小時輪詢，或只用 ["amadeus"] 的每日輪詢。
 */
export async function runAllActiveWithChain(
  chain: ProviderName[],
  onResult?: (result: RunResult) => void | Promise<void>,
): Promise<RunResult[]> {
  const rows = await prisma.trackedSearch.findMany({ where: { active: true } });
  const results: RunResult[] = [];
  for (const row of rows) {
    try {
      const result = await runTrackedSearchWithChain(trackedSearchToDomain(row), chain);
      results.push(result);
      if (onResult) await onResult(result);
    } catch (err) {
      console.error(`[tracker] 追蹤項目 ${row.id} 執行失敗:`, err);
    }
  }
  return results;
}
