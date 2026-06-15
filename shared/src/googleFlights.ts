import type { PriceSnapshot, TrackedSearchInput, TripType } from "./types.js";

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 自然語言 q 參數，導向 Google Flights 搜尋頁（不耗第三方 API 額度）。 */
export function buildGoogleFlightsSearchUrl(options: {
  origin: string;
  destination: string;
  tripType: TripType;
  currency: string;
  departureDate: string;
  returnDate?: string | null;
}): string {
  const { origin, destination, tripType, currency, departureDate, returnDate } = options;
  const q =
    tripType === "roundtrip" && returnDate
      ? `Flights from ${origin} to ${destination} on ${departureDate} through ${returnDate}`
      : `Flights from ${origin} to ${destination} on ${departureDate} oneway`;
  return `https://www.google.com/travel/flights?${new URLSearchParams({ q, curr: currency }).toString()}`;
}

/** 依追蹤條件與最新快照決定 GF 搜尋日期（有快照用最佳去/回，否則用區間起日 + 固定天數）。 */
export function buildGoogleFlightsUrlForTrackedSearch(
  search: TrackedSearchInput,
  latestSnapshot?: PriceSnapshot | null,
): string {
  const departureDate = latestSnapshot?.bestOutboundDate ?? search.dateRangeStart;
  const returnDate =
    search.tripType === "roundtrip"
      ? latestSnapshot?.bestReturnDate ?? addDays(departureDate, search.durationMin)
      : null;
  return buildGoogleFlightsSearchUrl({
    origin: search.origin,
    destination: search.destination,
    tripType: search.tripType,
    currency: search.currency,
    departureDate,
    returnDate,
  });
}
