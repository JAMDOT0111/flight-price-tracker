import { chromium } from "playwright";
import type {
  FlightItinerary,
  FlightOffer,
  FlightProvider,
  FlightSearchQuery,
  FlightSegment,
} from "@flight-tracker/shared";

const GF_BASE = "https://www.google.com/travel/flights";

function buildUrl(q: FlightSearchQuery): string {
  const query = q.returnDate
    ? `Flights from ${q.origin} to ${q.destination} on ${q.departureDate} through ${q.returnDate}`
    : `Flights from ${q.origin} to ${q.destination} on ${q.departureDate} oneway`;
  return `${GF_BASE}?${new URLSearchParams({ q: query, curr: q.currency })}`;
}

/** "9:30 AM" 或 "09:30" → "09:30" */
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
  carrierCode: string;
}

function parseCard(text: string, q: FlightSearchQuery): ParsedCard | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // 價格：格式如 "NT$6,081"、"$235"、"¥15,000"
  const priceLine = lines.find((l) => /^(NT\$|\$|¥|€|£|HK\$|S\$|₩|฿|A\$|C\$)[\d,]+$/.test(l));
  if (!priceLine) return null;
  const priceNum = parseInt(priceLine.replace(/[^\d]/g, ""), 10);
  if (!priceNum || isNaN(priceNum)) return null;

  // 時間：各自獨立一行，如 "3:30 PM"、"8:00 PM"（可能有 "+1" 後綴代表隔天）
  const timeLines = lines.filter((l) => /^\d{1,2}:\d{2}\s*[AP]M(\s*\+\d)?$/i.test(l));
  let departAt = `${q.departureDate}T00:00:00`;
  let arriveAt = `${q.departureDate}T23:59:00`;
  if (timeLines.length >= 2) {
    const dHHMM = parseHHMM(timeLines[0]);
    const arrRaw = timeLines[1];
    const plusDays = /\+(\d)/.exec(arrRaw)?.[1] ? parseInt(/\+(\d)/.exec(arrRaw)![1]) : 0;
    const aHHMM = parseHHMM(arrRaw.replace(/\+\d/, "").trim());
    if (dHHMM) departAt = toISO(dHHMM, q.departureDate);
    if (aHHMM) arriveAt = toISO(aHHMM, q.departureDate, plusDays);
  }

  // 停靠數："Nonstop" 或 "1 stop"
  const stopsLine = lines.find((l) => /^(\d+\s+stop|nonstop)$/i.test(l));
  let stops = 0;
  if (stopsLine && !/nonstop/i.test(stopsLine)) {
    stops = parseInt(stopsLine) || 1;
  }

  // 航空公司：出現在時間行之後、路線行（TPE–NRT）之前的純文字行
  const routeIdx = lines.findIndex((l) => /^[A-Z]{3}[–\-][A-Z]{3}/.test(l));
  const timeIdx = lines.findIndex((l) => /^\d{1,2}:\d{2}\s*[AP]M/i.test(l));
  const airlineLine = lines
    .slice(timeIdx + 1, routeIdx > 0 ? routeIdx : undefined)
    .find((l) => !/^\d|^–$|stop|nonstop|hr|min|CO2|kg|%|Avoids/i.test(l));
  const carrierCode = (airlineLine ?? "??").slice(0, 2).toUpperCase();

  return { price: priceNum, departAt, arriveAt, stops, carrierCode };
}

function toOffer(card: ParsedCard, q: FlightSearchQuery): FlightOffer {
  const seg: FlightSegment = {
    carrierCode: card.carrierCode,
    flightNumber: card.carrierCode,
    origin: q.origin,
    destination: q.destination,
    departAt: card.departAt,
    arriveAt: card.arriveAt,
  };
  const outbound: FlightItinerary = { segments: [seg], stops: card.stops };

  let inbound: FlightItinerary | null = null;
  if (q.returnDate) {
    const retSeg: FlightSegment = {
      ...seg,
      origin: q.destination,
      destination: q.origin,
      departAt: `${q.returnDate}T00:00:00`,
      arriveAt: `${q.returnDate}T23:59:00`,
    };
    inbound = { segments: [retSeg], stops: 0 };
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
 * 爬蟲資料來源：Google Flights。
 * 使用 Playwright headless Chromium，不需要 API 金鑰。
 * 注意：回傳的 segment 時間為當地時間字串（無時區），航班號碼僅為 carrier code 前綴。
 */
export class GoogleFlightsProvider implements FlightProvider {
  readonly name = "google-flights";

  async search(q: FlightSearchQuery): Promise<FlightOffer[]> {
    const browser = await chromium.launch({ headless: true });
    try {
      const ctx = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/125.0.0.0 Safari/537.36",
        locale: "en-US",
        viewport: { width: 1366, height: 768 },
      });
      const page = await ctx.newPage();

      await page.goto(buildUrl(q), { waitUntil: "domcontentloaded", timeout: 30_000 });

      // 關閉 Cookie 同意彈窗（若出現）
      const acceptBtn = page
        .locator('button:has-text("Accept all"), button:has-text("I agree")')
        .first();
      if (await acceptBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await acceptBtn.click();
      }

      // 等待航班結果出現（li.pIav2d 為 Google Flights 結果卡片，class 名稱可能隨版本更新）
      await page.waitForSelector("li.pIav2d", { timeout: 30_000 });
      await page.waitForTimeout(1_500);

      const rawTexts: string[] = await page.evaluate(() =>
        Array.from(document.querySelectorAll("li.pIav2d"))
          .slice(0, 15)
          .map((el) => (el as HTMLElement).innerText),
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
