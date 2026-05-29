import type {
  FlightItinerary,
  FlightOffer,
  FlightProvider,
  FlightSearchQuery,
  FlightSegment,
} from "@flight-tracker/shared";
import { addMinutes, dateAtMinutes, dayOfWeek, dayOfYear, formatLocal } from "./datetime.js";
import { createRng, intBetween, pick } from "./random.js";

const CARRIERS = ["JX", "BR", "VN", "CI", "NH", "TR", "VJ"] as const;
const HUBS = ["HKG", "TPE", "BKK", "SIN", "MNL"] as const;

/** 將「USD 視角」基準價換算到目標幣別的概略係數 */
const CURRENCY_SCALE: Record<string, number> = {
  USD: 1,
  EUR: 0.95,
  GBP: 0.82,
  TWD: 31,
  JPY: 150,
  KRW: 1350,
  HKD: 7.8,
  SGD: 1.35,
  VND: 25000,
};

function currencyScale(currency: string): number {
  return CURRENCY_SCALE[currency.toUpperCase()] ?? 1;
}

function roundToCurrency(value: number, currency: string): number {
  const c = currency.toUpperCase();
  if (c === "JPY" || c === "KRW" || c === "VND") return Math.round(value / 100) * 100;
  if (c === "TWD") return Math.round(value);
  return Math.round(value * 100) / 100;
}

/** 路線的「USD 視角」基準單程價（去 + 回另計） */
function routeBaseUsd(origin: string, destination: string): number {
  const rng = createRng(["route", origin, destination]);
  return 140 + rng() * 460; // 140 ~ 600
}

/** 路線的直飛飛行時間（分鐘） */
function routeDirectMinutes(origin: string, destination: string): number {
  const rng = createRng(["dur", origin, destination]);
  return intBetween(rng, 150, 600);
}

/** 季節性與週末造成的價格係數 */
function dateFactor(dateStr: string, phase: number): number {
  const seasonal = 1 + 0.22 * Math.sin((dayOfYear(dateStr) / 365) * 2 * Math.PI + phase);
  const dow = dayOfWeek(dateStr);
  const weekend = dow === 5 || dow === 0 ? 1.12 : dow === 6 ? 1.06 : 1; // 週五/週日較貴
  return seasonal * weekend;
}

function buildItinerary(
  rng: () => number,
  origin: string,
  destination: string,
  dateStr: string,
  carrier: string,
  stops: number,
): FlightItinerary {
  const directMinutes = routeDirectMinutes(origin, destination);
  const departMinuteOfDay = intBetween(rng, 5 * 60, 22 * 60); // 05:00 ~ 22:00
  const start = dateAtMinutes(dateStr, departMinuteOfDay);

  if (stops === 0) {
    const arrive = addMinutes(start, directMinutes);
    const seg: FlightSegment = {
      carrierCode: carrier,
      flightNumber: `${carrier}${intBetween(rng, 100, 999)}`,
      origin,
      destination,
      departAt: formatLocal(start),
      arriveAt: formatLocal(arrive),
    };
    return { segments: [seg], stops: 0 };
  }

  const hub = pick(rng, HUBS.filter((h) => h !== origin && h !== destination));
  const leg1 = Math.round(directMinutes * (0.45 + rng() * 0.15));
  const layover = intBetween(rng, 60, 180);
  const leg2 = Math.round(directMinutes * (0.5 + rng() * 0.2));

  const arr1 = addMinutes(start, leg1);
  const dep2 = addMinutes(arr1, layover);
  const arr2 = addMinutes(dep2, leg2);

  const segments: FlightSegment[] = [
    {
      carrierCode: carrier,
      flightNumber: `${carrier}${intBetween(rng, 100, 999)}`,
      origin,
      destination: hub,
      departAt: formatLocal(start),
      arriveAt: formatLocal(arr1),
    },
    {
      carrierCode: carrier,
      flightNumber: `${carrier}${intBetween(rng, 100, 999)}`,
      origin: hub,
      destination,
      departAt: formatLocal(dep2),
      arriveAt: formatLocal(arr2),
    },
  ];
  return { segments, stops: 1 };
}

function buildBookingLink(query: FlightSearchQuery, carrier: string, price: number): string {
  const params = new URLSearchParams({
    from: query.origin,
    to: query.destination,
    depart: query.departureDate,
    carrier,
    price: String(price),
  });
  if (query.returnDate) params.set("return", query.returnDate);
  return `https://book.mock-air.test/checkout?${params.toString()}`;
}

/**
 * 開發/展示用的假資料來源。
 * 給定明確去/回日期，回傳決定性的多筆報價（相同查詢結果穩定）。
 */
export class MockProvider implements FlightProvider {
  readonly name = "mock";

  async search(query: FlightSearchQuery): Promise<FlightOffer[]> {
    const rng = createRng([
      query.origin,
      query.destination,
      query.departureDate,
      query.returnDate ?? "oneway",
      query.passengers,
      query.nonStop ? "direct" : "any",
      query.currency,
    ]);

    const scale = currencyScale(query.currency);
    const baseUsd = routeBaseUsd(query.origin, query.destination);
    const phase = rng() * Math.PI * 2;

    const offerCount = intBetween(rng, 4, 7);
    const offers: FlightOffer[] = [];

    for (let i = 0; i < offerCount; i++) {
      const carrier = pick(rng, CARRIERS);
      const stops = query.nonStop ? 0 : rng() < 0.45 ? 1 : 0;

      const outbound = buildItinerary(rng, query.origin, query.destination, query.departureDate, carrier, stops);
      const inbound = query.returnDate
        ? buildItinerary(rng, query.destination, query.origin, query.returnDate, carrier, stops)
        : null;

      const offerVariation = 0.85 + rng() * 0.4; // 0.85 ~ 1.25
      const stopDiscount = stops === 1 ? 0.85 : 1;

      let priceUsd = baseUsd * dateFactor(query.departureDate, phase);
      if (query.returnDate) {
        priceUsd += baseUsd * dateFactor(query.returnDate, phase);
        priceUsd *= 0.95; // 來回略有折扣
      }
      priceUsd *= offerVariation * stopDiscount;

      const totalPrice = roundToCurrency(priceUsd * scale * query.passengers, query.currency);

      const hasBag = rng() < 0.6;
      offers.push({
        totalPrice,
        currency: query.currency,
        outbound,
        inbound,
        includedCheckedBags: hasBag ? 1 : 0,
        includedCheckedBagWeightKg: hasBag ? pick(rng, [20, 23, 30]) : null,
        bookingDeepLink: buildBookingLink(query, carrier, totalPrice),
      });
    }

    offers.sort((a, b) => a.totalPrice - b.totalPrice);
    return typeof query.maxResults === "number" ? offers.slice(0, query.maxResults) : offers;
  }
}
