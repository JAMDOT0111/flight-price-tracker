import type {
  FlightItinerary,
  FlightOffer,
  FlightProvider,
  FlightSearchQuery,
  FlightSegment,
} from "@flight-tracker/shared";
import {
  dismissCookieConsent,
  humanScroll,
  launchStealthBrowser,
  newStealthContext,
  randomDelay,
  randomMouseMove,
} from "../scraper/stealth.js";

function buildUrl(q: FlightSearchQuery): string {
  const base = "https://us.trip.com/flights";
  const route = `${q.origin}-${q.destination}`;
  const type = q.returnDate ? "round" : "oneway";

  const params = new URLSearchParams({
    DepartDate: q.departureDate,
    Adult: String(q.passengers),
    Currency: q.currency,
    Locale: "en-XX",
  });
  if (q.returnDate) params.set("ReturnDate", q.returnDate);

  return `${base}/${route}/${type}-${route}/?${params}`;
}

function parseHHMM(raw: string): string | null {
  const m12 = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1]);
    const mn = m12[2];
    const p = m12[3].toUpperCase();
    if (p === "PM" && h !== 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${mn}`;
  }
  const m24 = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return `${String(parseInt(m24[1])).padStart(2, "0")}:${m24[2]}`;
  return null;
}

function toISO(hhmm: string, date: string, plusDays = 0): string {
  const base = new Date(`${date}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + plusDays);
  return `${base.toISOString().slice(0, 10)}T${hhmm}:00`;
}

interface ParsedCard {
  price: number;
  departAt: string;
  arriveAt: string;
  stops: number;
  carrier: string;
}

function parseCard(text: string, q: FlightSearchQuery): ParsedCard | null {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const joined = lines.join(" ");

  // 價格：Trip.com 通常顯示 "TWD 6,081" 或 "NT$6,081"
  const priceMatch =
    joined.match(/(?:TWD|NT\$|\$|¥|€)\s*([\d,]+)/) ??
    joined.match(/([\d,]{4,})\s*(?:TWD|NT\$)/);
  if (!priceMatch) return null;
  const price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
  if (!price || isNaN(price)) return null;

  // 時間：Trip.com 通常 "09:30 – 13:45" 在同一行，或各自一行
  const timePairMatch = joined.match(
    /(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*[–\-]\s*(\d{1,2}:\d{2}(?:\s*[AP]M)?)(\s*\+(\d))?/i,
  );
  let departAt = `${q.departureDate}T00:00:00`;
  let arriveAt = `${q.departureDate}T23:59:00`;

  if (timePairMatch) {
    const dHHMM = parseHHMM(timePairMatch[1].trim());
    const aHHMM = parseHHMM(timePairMatch[2].trim());
    const plusDays = timePairMatch[4] ? parseInt(timePairMatch[4]) : 0;
    if (dHHMM) departAt = toISO(dHHMM, q.departureDate);
    if (aHHMM) arriveAt = toISO(aHHMM, q.departureDate, plusDays);
  } else {
    // fallback：各自一行
    const timeLines = lines.filter((l) => /^\d{1,2}:\d{2}(\s*[AP]M)?(\s*\+\d)?$/i.test(l));
    if (timeLines.length >= 2) {
      const dHHMM = parseHHMM(timeLines[0]);
      const arrRaw = timeLines[1];
      const plusDays = /\+(\d)/.exec(arrRaw)?.[1] ? parseInt(/\+(\d)/.exec(arrRaw)![1]) : 0;
      const aHHMM = parseHHMM(arrRaw.replace(/\+\d/, "").trim());
      if (dHHMM) departAt = toISO(dHHMM, q.departureDate);
      if (aHHMM) arriveAt = toISO(aHHMM, q.departureDate, plusDays);
    }
  }

  // 停靠：Trip.com 顯示 "Non-stop" / "1 Stop" / "Direct"
  const stopsLine = lines.find((l) => /^(non-?stop|direct|\d+\s*stop)/i.test(l));
  let stops = 0;
  if (stopsLine && !/non-?stop|direct/i.test(stopsLine)) {
    stops = parseInt(stopsLine) || 1;
  }

  // 航空公司
  const carrier =
    lines.find(
      (l) =>
        l.length > 2 &&
        !/^\d|^[–\-]$|stop|direct|non|hr|min|TWD|NT\$|\$|CO2/i.test(l) &&
        !/^\d{1,2}:\d{2}/.test(l),
    ) ?? "??";

  return { price, departAt, arriveAt, stops, carrier };
}

function toOffer(card: ParsedCard, q: FlightSearchQuery): FlightOffer {
  const seg: FlightSegment = {
    carrierCode: card.carrier.slice(0, 2).toUpperCase(),
    flightNumber: card.carrier.slice(0, 2).toUpperCase(),
    origin: q.origin,
    destination: q.destination,
    departAt: card.departAt,
    arriveAt: card.arriveAt,
  };
  const outbound: FlightItinerary = { segments: [seg], stops: card.stops };

  let inbound: FlightItinerary | null = null;
  if (q.returnDate) {
    inbound = {
      segments: [{ ...seg, origin: q.destination, destination: q.origin, departAt: `${q.returnDate}T00:00:00`, arriveAt: `${q.returnDate}T23:59:00` }],
      stops: 0,
    };
  }

  return {
    totalPrice: card.price,
    currency: q.currency,
    outbound,
    inbound,
    includedCheckedBags: null,
    includedCheckedBagWeightKg: null,
    bookingDeepLink: null,
  };
}

/**
 * 爬蟲資料來源：Trip.com（Ctrip 國際版）。
 * 建議頻率：每 6 小時一次（env: TRIP_SEARCH_LIMIT）。
 * 具有 Cloudflare 保護，建議在 GitHub Actions 執行（自然 IP 輪換）。
 */
export class TripProvider implements FlightProvider {
  readonly name = "trip";

  async search(q: FlightSearchQuery): Promise<FlightOffer[]> {
    const browser = await launchStealthBrowser();
    try {
      const ctx = await newStealthContext(browser);
      const page = await ctx.newPage();

      await page.goto(buildUrl(q), { waitUntil: "domcontentloaded", timeout: 40_000 });
      await dismissCookieConsent(page);
      await randomDelay(2_500, 5_000);
      await randomMouseMove(page);
      await humanScroll(page, 400);
      await randomDelay(1_000, 2_000);

      // Trip.com 航班卡片選擇器（多個候選）
      const cardSel = [
        '[data-testid="flight-item"]',
        '[class*="flight-item"]',
        '[class*="flightItem"]',
        ".flight-way-item",
        "[data-ga-event-label='flight']",
      ].join(", ");

      const found = await page.waitForSelector(cardSel, { timeout: 30_000 }).catch(() => null);

      if (!found) {
        console.warn(`[trip] 找不到航班卡片，頁面標題：${await page.title()}`);
        // 嘗試截圖供診斷
        await page.screenshot({ path: "/tmp/trip-debug.png" }).catch(() => null);
        return [];
      }

      await randomDelay(800, 1_500);

      const rawTexts: string[] = await page.evaluate((sel) =>
        Array.from(document.querySelectorAll(sel))
          .slice(0, 15)
          .map((el) => (el as HTMLElement).innerText),
        cardSel,
      );

      const offers = rawTexts
        .map((t) => parseCard(t, q))
        .filter((c): c is ParsedCard => c !== null)
        .map((c) => toOffer(c, q));

      offers.sort((a, b) => a.totalPrice - b.totalPrice);
      return typeof q.maxResults === "number" ? offers.slice(0, q.maxResults) : offers;
    } finally {
      await browser.close();
    }
  }
}
