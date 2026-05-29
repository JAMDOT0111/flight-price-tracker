import type {
  FlightItinerary,
  FlightOffer,
  FlightProvider,
  FlightSearchQuery,
  FlightSegment,
} from "@flight-tracker/shared";

const DUFFEL_API = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

interface DuffelSegment {
  origin: { iata_code: string };
  destination: { iata_code: string };
  departing_at: string;
  arriving_at: string;
  marketing_carrier: { iata_code: string };
  marketing_carrier_flight_number: string | null;
  passengers?: Array<{ baggages?: Array<{ type: string; quantity: number }> }>;
}

interface DuffelSlice {
  segments: DuffelSegment[];
}

interface DuffelOffer {
  total_amount: string;
  total_currency: string;
  slices: DuffelSlice[];
}

interface DuffelOfferRequestResponse {
  data: { offers: DuffelOffer[] };
}

function mapSlice(slice: DuffelSlice): FlightItinerary {
  const segments: FlightSegment[] = slice.segments.map((s) => ({
    carrierCode: s.marketing_carrier.iata_code,
    flightNumber: `${s.marketing_carrier.iata_code}${s.marketing_carrier_flight_number ?? ""}`,
    origin: s.origin.iata_code,
    destination: s.destination.iata_code,
    departAt: s.departing_at,
    arriveAt: s.arriving_at,
  }));
  return { segments, stops: Math.max(0, slice.segments.length - 1) };
}

/** 由第一段第一位乘客的行李資訊推估含託運行李件數（Duffel 不一定提供公斤數）。 */
function checkedBags(slice: DuffelSlice): number | null {
  const baggages = slice.segments[0]?.passengers?.[0]?.baggages;
  if (!baggages) return null;
  return baggages
    .filter((b) => b.type === "checked")
    .reduce((sum, b) => sum + (b.quantity ?? 0), 0);
}

/**
 * 真實資料來源：Duffel Flights API。
 * 注意：Duffel 報價幣別由其決定（未必等於使用者所選幣別）；
 * 託運行李多半只提供件數、無公斤數。
 */
export class DuffelProvider implements FlightProvider {
  readonly name = "duffel";

  constructor(private readonly token: string) {
    if (!token) throw new Error("缺少 DUFFEL_API_TOKEN");
  }

  async search(query: FlightSearchQuery): Promise<FlightOffer[]> {
    const slices = [
      {
        origin: query.origin,
        destination: query.destination,
        departure_date: query.departureDate,
      },
    ];
    if (query.returnDate) {
      slices.push({
        origin: query.destination,
        destination: query.origin,
        departure_date: query.returnDate,
      });
    }

    const passengers = Array.from({ length: query.passengers }, () => ({ type: "adult" as const }));

    const res = await fetch(`${DUFFEL_API}/air/offer_requests?return_offers=true`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Duffel-Version": DUFFEL_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ data: { slices, passengers, cabin_class: "economy" } }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Duffel API 錯誤 ${res.status}: ${detail.slice(0, 300)}`);
    }

    const json = (await res.json()) as DuffelOfferRequestResponse;
    const offers = json.data.offers.map<FlightOffer>((o) => {
      const outbound = mapSlice(o.slices[0]);
      const inbound = o.slices[1] ? mapSlice(o.slices[1]) : null;
      return {
        totalPrice: Number(o.total_amount),
        currency: o.total_currency,
        outbound,
        inbound,
        includedCheckedBags: checkedBags(o.slices[0]),
        includedCheckedBagWeightKg: null,
        bookingDeepLink: null,
      };
    });

    offers.sort((a, b) => a.totalPrice - b.totalPrice);
    return typeof query.maxResults === "number" ? offers.slice(0, query.maxResults) : offers;
  }
}
