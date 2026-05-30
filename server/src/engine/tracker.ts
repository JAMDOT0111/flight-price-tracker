import type { Prisma } from "@prisma/client";
import type {
  FlightOffer,
  FlightOfferSummary,
  PriceSnapshot,
  TrackedSearch,
} from "@flight-tracker/shared";
import { prisma } from "../db.js";
import { priceSnapshotToDomain, trackedSearchToDomain } from "../lib/mappers.js";
import { selectProvider } from "../providers/selector.js";
import { addUsage } from "../providers/usage.js";
import { offerMatches } from "./filters.js";
import { capPairs, enumerateDatePairs, type DatePair } from "./window.js";

const MAX_QUERIES = Number(process.env.MAX_QUERIES_PER_RUN ?? 60);

export interface RunResult {
  trackedSearchId: string;
  /** 實際查詢的日期組合數 */
  evaluated: number;
  /** 通過過濾的報價數 */
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

/** 對單一追蹤項目跑一輪滑動視窗，找出區間最低價並寫入快照。 */
export async function runTrackedSearch(search: TrackedSearch): Promise<RunResult> {
  const pairs = capPairs(enumerateDatePairs(search), MAX_QUERIES);

  // 每輪開始選定來源（依鏈/用量上限），整輪沿用。
  const { provider, name: providerName } = await selectProvider();

  let best: { offer: FlightOffer; pair: DatePair } | null = null;
  let matched = 0;
  let searchCount = 0;

  for (const pair of pairs) {
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
      matched++;
      if (!best || offer.totalPrice < best.offer.totalPrice) best = { offer, pair };
    }
  }

  await addUsage(providerName, searchCount);

  if (!best) {
    return { trackedSearchId: search.id, evaluated: pairs.length, matched, snapshot: null, isNewLow: false };
  }

  const prevMin = await prisma.priceSnapshot.aggregate({
    where: { trackedSearchId: search.id },
    _min: { lowestPrice: true },
  });
  const isNewLow =
    prevMin._min.lowestPrice === null || best.offer.totalPrice < prevMin._min.lowestPrice;

  // 僅對選定的最低價解析訂票連結（省 API 額度）；失敗不影響主流程。
  let bookingDeepLink = best.offer.bookingDeepLink;
  let bookingReturnDeepLink: string | null = null;
  if (provider.resolveBookingLink) {
    try {
      const links = await provider.resolveBookingLink(best.offer);
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
      lowestPrice: best.offer.totalPrice,
      currency: best.offer.currency,
      bestOutboundDate: best.pair.departureDate,
      bestReturnDate: best.pair.returnDate,
      bookingDeepLink,
      bookingReturnDeepLink,
      offerSummary: summarize(best.offer) as unknown as Prisma.InputJsonValue,
      source: providerName,
    },
  });

  return {
    trackedSearchId: search.id,
    evaluated: pairs.length,
    matched,
    snapshot: priceSnapshotToDomain(row),
    isNewLow,
  };
}

export async function runTrackedSearchById(id: string): Promise<RunResult | null> {
  const row = await prisma.trackedSearch.findUnique({ where: { id } });
  if (!row) return null;
  return runTrackedSearch(trackedSearchToDomain(row));
}

/** 對所有 active 的追蹤項目各跑一輪（逐一執行以控制負載）。 */
export async function runAllActive(
  onResult?: (result: RunResult) => void | Promise<void>,
): Promise<RunResult[]> {
  const rows = await prisma.trackedSearch.findMany({ where: { active: true } });
  const results: RunResult[] = [];
  for (const row of rows) {
    try {
      const result = await runTrackedSearch(trackedSearchToDomain(row));
      results.push(result);
      if (onResult) await onResult(result);
    } catch (err) {
      console.error(`[tracker] 追蹤項目 ${row.id} 執行失敗:`, err);
    }
  }
  return results;
}
