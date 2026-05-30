import type {
  FlightItinerary,
  FlightOffer,
  FlightProvider,
  FlightSearchQuery,
  FlightSegment,
  ResolvedBookingLinks,
} from "@flight-tracker/shared";
import { buildGoogleFlightsSearchUrl } from "@flight-tracker/shared";

const IGNAV_API = "https://ignav.com/api";

/** 幣別 → Ignav market（2 碼國別）對照；對不到時用 IGNAV_MARKET（預設 TW）。 */
const CURRENCY_TO_MARKET: Record<string, string> = {
  TWD: "TW",
  USD: "US",
  JPY: "JP",
  HKD: "HK",
  SGD: "SG",
  KRW: "KR",
  CNY: "CN",
  EUR: "DE",
  GBP: "GB",
  AUD: "AU",
  THB: "TH",
  MYR: "MY",
  VND: "VN",
  PHP: "PH",
  IDR: "ID",
};

interface IgnavSegment {
  marketing_carrier_code: string | null;
  flight_number: string | null;
  departure_airport: string;
  departure_time_local: string;
  arrival_airport: string;
  arrival_time_local: string;
}

interface IgnavLeg {
  segments: IgnavSegment[];
}

interface IgnavItinerary {
  price: { amount: number; currency: string };
  outbound: IgnavLeg;
  inbound: IgnavLeg | null;
  bags?: { carry_on: number | null; checked: number | null } | null;
  ignav_id: string;
}

interface IgnavFareResponse {
  itineraries: IgnavItinerary[];
}

interface IgnavBookingLink {
  provider_name: string;
  provider_type: "airline" | "third_party";
  url: string;
}

interface IgnavBookingOption {
  /** 此組連結涵蓋的航段：["outbound"] 為單程去程；["outbound","inbound"] 為來回 */
  legs: ("outbound" | "inbound")[];
  links: IgnavBookingLink[];
}

interface IgnavBookingLinksResponse {
  booking_options: IgnavBookingOption[];
}

/** 可在瀏覽器直接開啟的訂票 URL（Ignav 偶爾回傳 .svc 等 API 端點）。 */
function isBrowserBookableUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return false;
    if (/\.svc(\/|$)/i.test(u.pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

/** 從 options 挑可開啟的 airline 連結；Ignav 的 third_party 留待航司 fallback 之後。 */
function pickLinkFromOptions(options: IgnavBookingOption[]): string | null {
  const links = options.flatMap((opt) => opt.links);
  const airline = links.find((l) => l.provider_type === "airline" && isBrowserBookableUrl(l.url));
  return airline?.url ?? null;
}

function pickThirdPartyLinkFromOptions(options: IgnavBookingOption[]): string | null {
  const links = options.flatMap((opt) => opt.links);
  const thirdParty = links.find((l) => l.provider_type === "third_party" && isBrowserBookableUrl(l.url));
  return thirdParty?.url ?? null;
}

/** Ignav 無可用連結時的 fallback（依航司選策略）。 */
function buildAirlineFallbackUrl(segment: FlightSegment, currency: string): string | null {
  const { origin, destination, carrierCode, departAt } = segment;
  switch (carrierCode) {
    case "CI":
      // 華航官網 URL 參數無法可靠預填；改導 Google Flights 單程搜尋。
      return buildGoogleFlightsSearchUrl({
        origin,
        destination,
        tripType: "oneway",
        currency,
        departureDate: departAt.slice(0, 10),
      });
    case "JX":
      return "https://www.starlux-airlines.com/zh-TW/booking/book-flight/search-a-flight";
    case "BR":
      return "https://www.evaair.com/zh-tw/index.html";
    default:
      return null;
  }
}

function outboundOnlyOptions(options: IgnavBookingOption[]): IgnavBookingOption[] {
  return options.filter((o) => o.legs.includes("outbound") && !o.legs.includes("inbound"));
}

function inboundOnlyOptions(options: IgnavBookingOption[]): IgnavBookingOption[] {
  return options.filter((o) => o.legs.includes("inbound") && !o.legs.includes("outbound"));
}

function segmentFlightNumberOnly(segment: FlightSegment): string {
  const { carrierCode, flightNumber } = segment;
  return flightNumber.startsWith(carrierCode) ? flightNumber.slice(carrierCode.length) : flightNumber;
}

/** 解析 booking_options → 去/回 URL。來回票不採用合一連結（常誤導至單程頁）。 */
function resolveIgnavBookingLinks(options: IgnavBookingOption[], roundTrip: boolean): ResolvedBookingLinks {
  const outbound = pickLinkFromOptions(outboundOnlyOptions(options));
  if (!roundTrip) return { outbound, inbound: null };
  const inbound = pickLinkFromOptions(inboundOnlyOptions(options));
  return { outbound, inbound };
}

type LegKind = "outbound" | "inbound";

function mapLeg(leg: IgnavLeg): FlightItinerary {
  const segments: FlightSegment[] = leg.segments.map((s) => {
    const carrierCode = s.marketing_carrier_code ?? "";
    return {
      carrierCode,
      flightNumber: `${carrierCode}${s.flight_number ?? ""}`,
      origin: s.departure_airport,
      destination: s.arrival_airport,
      departAt: s.departure_time_local,
      arriveAt: s.arrival_time_local,
    };
  });
  return { segments, stops: Math.max(0, leg.segments.length - 1) };
}

/**
 * 真實資料來源：Ignav Flight Prices API（免費額度，價格追蹤用）。
 * 注意：報價幣別由 `market`（依使用者所選幣別對照）決定；
 * 訂票連結需另打 /api/fares/booking-links（耗額度），此處不取，bookingDeepLink 一律 null。
 */
export class IgnavProvider implements FlightProvider {
  readonly name = "ignav";

  constructor(private readonly apiKey: string) {
    if (!apiKey) throw new Error("缺少 IGNAV_API_KEY");
  }

  private market(currency: string): string {
    return CURRENCY_TO_MARKET[currency.toUpperCase()] ?? process.env.IGNAV_MARKET?.trim() ?? "TW";
  }

  private headers(): Record<string, string> {
    return {
      "X-Api-Key": this.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private async fetchBookingOptions(body: Record<string, unknown>): Promise<IgnavBookingOption[]> {
    const res = await fetch(`${IGNAV_API}/fares/booking-links`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as IgnavBookingLinksResponse & { error?: unknown };
    if ("error" in json && json.error) return [];
    return json.booking_options ?? [];
  }

  /** 以單段行程欄位（不含 ignav_id）查 booking-links。 */
  private manualLegBody(offer: FlightOffer, leg: LegKind): Record<string, unknown> | null {
    const itin = leg === "outbound" ? offer.outbound : offer.inbound;
    if (!itin?.segments[0]) return null;
    const first = itin.segments[0];
    const last = itin.segments[itin.segments.length - 1];
    return {
      origin: first.origin,
      destination: last.destination,
      departure_date: first.departAt.slice(0, 10),
      outbound_carrier_code: first.carrierCode,
      outbound_flight_number: segmentFlightNumberOnly(first),
      market: this.market(offer.currency),
    };
  }

  /** 以單程搜尋匹配航段，再以該 ignav_id 取 booking-links。 */
  private async resolveLegViaOneWaySearchWithOptions(
    offer: FlightOffer,
    leg: LegKind,
  ): Promise<{ url: string | null; options: IgnavBookingOption[] }> {
    const itin = leg === "outbound" ? offer.outbound : offer.inbound;
    if (!itin?.segments[0]) return { url: null, options: [] };
    const first = itin.segments[0];
    const last = itin.segments[itin.segments.length - 1];
    const wantFn = segmentFlightNumberOnly(first);

    const res = await fetch(`${IGNAV_API}/fares/one-way`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        origin: first.origin,
        destination: last.destination,
        departure_date: first.departAt.slice(0, 10),
        market: this.market(offer.currency),
      }),
    });
    if (!res.ok) return { url: null, options: [] };

    const json = (await res.json()) as IgnavFareResponse;
    const match =
      json.itineraries.find((it) => {
        const s = it.outbound.segments[0];
        return s?.marketing_carrier_code === first.carrierCode && s?.flight_number === wantFn;
      }) ?? json.itineraries.find((it) => it.outbound.segments[0]?.marketing_carrier_code === first.carrierCode);

    if (!match) return { url: null, options: [] };
    const options = await this.fetchBookingOptions({ ignav_id: match.ignav_id });
    const filtered = outboundOnlyOptions(options);
    return { url: pickLinkFromOptions(filtered), options: filtered };
  }

  /** 單段訂票連結：先手動欄位，失敗再以單程搜尋 fallback，最後導向航司官網搜尋頁。 */
  private async resolveLegLink(offer: FlightOffer, leg: LegKind): Promise<string | null> {
    let lastOptions: IgnavBookingOption[] = [];

    const manual = this.manualLegBody(offer, leg);
    if (manual) {
      lastOptions = await this.fetchBookingOptions(manual);
      const url = pickLinkFromOptions(outboundOnlyOptions(lastOptions));
      if (url) return url;
    }

    const searchResult = await this.resolveLegViaOneWaySearchWithOptions(offer, leg);
    if (searchResult.url) return searchResult.url;
    if (searchResult.options.length) lastOptions = searchResult.options;

    const itin = leg === "outbound" ? offer.outbound : offer.inbound;
    const first = itin?.segments[0];
    if (first) {
      const fallback = buildAirlineFallbackUrl(first, offer.currency);
      if (fallback) return fallback;
    }

    return pickThirdPartyLinkFromOptions(outboundOnlyOptions(lastOptions));
  }

  async search(query: FlightSearchQuery): Promise<FlightOffer[]> {
    const isRoundTrip = query.returnDate !== null;
    const endpoint = isRoundTrip ? "fares/round-trip" : "fares/one-way";

    const body: Record<string, unknown> = {
      origin: query.origin,
      destination: query.destination,
      departure_date: query.departureDate,
      adults: query.passengers,
      cabin_class: "economy",
      market: this.market(query.currency),
    };
    if (isRoundTrip) body.return_date = query.returnDate;
    if (query.nonStop) body.max_stops = 0;

    const res = await fetch(`${IGNAV_API}/${endpoint}`, {
      method: "POST",
      headers: {
        "X-Api-Key": this.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Ignav API 錯誤 ${res.status}: ${detail.slice(0, 300)}`);
    }

    const json = (await res.json()) as IgnavFareResponse;
    const offers = json.itineraries.map<FlightOffer>((it) => ({
      totalPrice: it.price.amount,
      currency: it.price.currency,
      outbound: mapLeg(it.outbound),
      inbound: it.inbound ? mapLeg(it.inbound) : null,
      includedCheckedBags: it.bags?.checked ?? null,
      includedCheckedBagWeightKg: null,
      bookingDeepLink: null,
      bookingToken: it.ignav_id,
    }));

    offers.sort((a, b) => a.totalPrice - b.totalPrice);
    return typeof query.maxResults === "number" ? offers.slice(0, query.maxResults) : offers;
  }

  /**
   * 取得訂票連結。來回票 ignav_id 常只回誤導的合一連結，
   * 故拆成去程/回程各自解析（手動欄位或單程 ignav_id fallback）。
   */
  async resolveBookingLink(offer: FlightOffer): Promise<ResolvedBookingLinks | null> {
    if (!offer.bookingToken) return null;

    const roundTrip = offer.inbound !== null;
    let outbound: string | null = null;
    let inbound: string | null = null;

    if (offer.bookingToken) {
      const fromToken = resolveIgnavBookingLinks(
        await this.fetchBookingOptions({ ignav_id: offer.bookingToken }),
        roundTrip,
      );
      outbound = fromToken.outbound;
      inbound = fromToken.inbound;
    }

    if (roundTrip) {
      if (!outbound) outbound = await this.resolveLegLink(offer, "outbound");
      if (!inbound) inbound = await this.resolveLegLink(offer, "inbound");
    } else if (!outbound) {
      outbound = await this.resolveLegLink(offer, "outbound");
    }

    if (!outbound && !inbound) return null;
    return { outbound, inbound };
  }
}
