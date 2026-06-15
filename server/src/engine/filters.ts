import type { FlightItinerary, FlightOffer, TimeWindow, TrackedSearch } from "@flight-tracker/shared";
import { timeOf } from "../lib/dates.js";

function withinWindow(localDateTime: string, window: TimeWindow): boolean {
  const t = timeOf(localDateTime);
  return t >= window.start && t <= window.end;
}

function lastSegmentArrive(itin: FlightItinerary): string {
  return itin.segments[itin.segments.length - 1].arriveAt;
}

/**
 * 依追蹤條件過濾單筆報價。
 * departureWindow = 去程出發時間；arrivalWindow = 返程出發時間（無回程資料時略過）。
 */
export function offerMatches(offer: FlightOffer, search: TrackedSearch): boolean {
  // 直飛
  if (search.nonStop) {
    if (offer.outbound.stops !== 0) return false;
    if (offer.inbound && offer.inbound.stops !== 0) return false;
  }

  // 去程出發時間窗
  if (search.departureWindow) {
    if (!withinWindow(offer.outbound.segments[0].departAt, search.departureWindow)) return false;
  }

  // 返程出發時間窗（inbound 無資料時略過，不視為不符合）
  if (search.arrivalWindow && offer.inbound) {
    const inboundDepart = offer.inbound.segments[0].departAt;
    // 爬蟲未解析回程時間時，departAt 為 T00:00:00，視為資料缺失，略過
    if (!inboundDepart.endsWith("T00:00:00")) {
      if (!withinWindow(inboundDepart, search.arrivalWindow)) return false;
    }
  }

  // 託運行李
  if (search.checkedBaggage.required) {
    if (!offer.includedCheckedBags || offer.includedCheckedBags < 1) return false;
    const minKg = search.checkedBaggage.minKg;
    if (minKg !== null) {
      if (offer.includedCheckedBagWeightKg === null || offer.includedCheckedBagWeightKg < minKg) {
        return false;
      }
    }
  }

  return true;
}
