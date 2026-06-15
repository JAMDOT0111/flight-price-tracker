import type {
  FlightItinerary,
  FlightOffer,
  FlightProvider,
  FlightSearchQuery,
  FlightSegment,
} from "@flight-tracker/shared";

const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";
const BASE = `https://${RAPIDAPI_HOST}`;

/** 機場 entityId 快取，避免每次查詢都打 searchAirport API。 */
const entityCache = new Map<string, { skyId: string; entityId: string }>();

// ---------- RapidAPI 回傳型別 ----------

interface RapidAirport {
  skyId: string;
  entityId: string;
}

interface RapidSegment {
  origin: { flightPlaceId: string };
  destination: { flightPlaceId: string };
  departure: string;  // "2026-08-01T15:30:00"
  arrival: string;
  flightNumber: string;
  marketingCarrier: { name: string; alternateId: string };
}

interface RapidLeg {
  departure: string;
  arrival: string;
  stopCount: number;
  segments: RapidSegment[];
  carriers: { marketing: Array<{ name: string; alternateId: string }> };
}

interface RapidItinerary {
  price: { raw: number; formatted: string };
  legs: RapidLeg[];
}

interface RapidSearchResponse {
  status: boolean;
  data?: { itineraries?: RapidItinerary[] };
  message?: string;
}

// ---------- 輔助函式 ----------

function mapLeg(leg: RapidLeg): FlightItinerary {
  const segments: FlightSegment[] = leg.segments.map((s) => ({
    carrierCode: s.marketingCarrier.alternateId ?? s.marketingCarrier.name.slice(0, 2).toUpperCase(),
    flightNumber: s.flightNumber,
    origin: s.origin.flightPlaceId,
    destination: s.destination.flightPlaceId,
    departAt: s.departure,
    arriveAt: s.arrival,
  }));
  return { segments, stops: Math.max(0, leg.stopCount) };
}

/**
 * 真實資料來源：Skyscanner（透過 RapidAPI sky-scrapper）。
 * 需設定 RAPIDAPI_KEY 環境變數；免費方案每月 500 次請求。
 * SKYSCANNER_SEARCH_LIMIT 建議設為 150（含 airport lookup 每次約 3 calls）。
 */
export class SkyscannerProvider implements FlightProvider {
  readonly name = "skyscanner";

  constructor(private readonly apiKey: string) {
    if (!apiKey) throw new Error("缺少 RAPIDAPI_KEY");
  }

  private headers(): Record<string, string> {
    return {
      "X-RapidAPI-Key": this.apiKey,
      "X-RapidAPI-Host": RAPIDAPI_HOST,
    };
  }

  /** 查詢機場的 skyId 與 entityId（帶快取）。 */
  private async resolveAirport(iata: string): Promise<{ skyId: string; entityId: string }> {
    if (entityCache.has(iata)) return entityCache.get(iata)!;

    const res = await fetch(
      `${BASE}/api/v1/flights/searchAirport?query=${encodeURIComponent(iata)}&locale=en-US`,
      { headers: this.headers() },
    );
    if (!res.ok) throw new Error(`Skyscanner airport lookup 失敗：${res.status}`);

    const json = (await res.json()) as { status: boolean; data?: RapidAirport[] };
    const match = json.data?.find(
      (a) => a.skyId.toUpperCase() === iata.toUpperCase(),
    );
    if (!match) throw new Error(`找不到機場：${iata}`);

    const result = { skyId: match.skyId, entityId: match.entityId };
    entityCache.set(iata, result);
    return result;
  }

  async search(query: FlightSearchQuery): Promise<FlightOffer[]> {
    const [origin, destination] = await Promise.all([
      this.resolveAirport(query.origin),
      this.resolveAirport(query.destination),
    ]);

    const params = new URLSearchParams({
      originSkyId: origin.skyId,
      destinationSkyId: destination.skyId,
      originEntityId: origin.entityId,
      destinationEntityId: destination.entityId,
      date: query.departureDate,
      cabinClass: "economy",
      adults: String(query.passengers),
      currency: query.currency,
      market: "TW",
      locale: "en-US",
      countryCode: "TW",
    });
    if (query.returnDate) params.set("returnDate", query.returnDate);

    const res = await fetch(`${BASE}/api/v1/flights/searchFlights?${params}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Skyscanner API 錯誤 ${res.status}: ${detail.slice(0, 200)}`);
    }

    const json = (await res.json()) as RapidSearchResponse;
    if (!json.status || !json.data?.itineraries?.length) return [];

    const offers = json.data.itineraries.map<FlightOffer>((it) => {
      const outbound = mapLeg(it.legs[0]);
      const inbound = it.legs[1] ? mapLeg(it.legs[1]) : null;
      return {
        totalPrice: it.price.raw,
        currency: query.currency,
        outbound,
        inbound,
        includedCheckedBags: null,
        includedCheckedBagWeightKg: null,
        bookingDeepLink: null,
      };
    });

    offers.sort((a, b) => a.totalPrice - b.totalPrice);
    return typeof query.maxResults === "number" ? offers.slice(0, query.maxResults) : offers;
  }
}
