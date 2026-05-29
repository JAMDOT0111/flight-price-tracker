import type { TrackedSearch } from "@flight-tracker/shared";
import { addDays, diffDays, eachDateInclusive } from "../lib/dates.js";

export interface DatePair {
  departureDate: string;
  returnDate: string | null;
}

/**
 * 滑動視窗：列出區間內所有要查詢的 (去, 回) 日期組合。
 * - 單程：區間內每個出發日。
 * - 來回（固定/區間天數）：出發日滑動，回程 = 出發日 + 天數，且回程不可超過區間迄。
 */
export function enumerateDatePairs(search: TrackedSearch): DatePair[] {
  const dates = eachDateInclusive(search.dateRangeStart, search.dateRangeEnd);

  if (search.tripType === "oneway") {
    return dates.map((d) => ({ departureDate: d, returnDate: null }));
  }

  const minD = Math.max(1, search.durationMin);
  const maxD = Math.max(minD, search.durationMax);
  const totalSpan = diffDays(search.dateRangeStart, search.dateRangeEnd);

  const pairs: DatePair[] = [];
  for (const departureDate of dates) {
    const offset = diffDays(search.dateRangeStart, departureDate);
    for (let duration = minD; duration <= maxD; duration++) {
      // 回程需落在區間內
      if (offset + duration > totalSpan) break;
      pairs.push({ departureDate, returnDate: addDays(departureDate, duration) });
    }
  }
  return pairs;
}

/** 若組合數超過上限，均勻取樣以控制 API 呼叫量。 */
export function capPairs(pairs: DatePair[], max: number): DatePair[] {
  if (pairs.length <= max) return pairs;
  const step = pairs.length / max;
  const out: DatePair[] = [];
  for (let i = 0; i < max; i++) out.push(pairs[Math.floor(i * step)]);
  return out;
}
