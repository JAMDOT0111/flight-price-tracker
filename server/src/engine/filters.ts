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
 * 時間窗套用於「去程」：出發時刻、抵達時刻；直飛與託運行李為硬性條件。
 */
export function offerMatches(offer: FlightOffer, search: TrackedSearch): boolean {
  // 直飛
  if (search.nonStop) {
    if (offer.outbound.stops !== 0) return false;
    if (offer.inbound && offer.inbound.stops !== 0) return false;
  }

  // 出發時間窗（去程第一段起飛）
  if (search.departureWindow) {
    if (!withinWindow(offer.outbound.segments[0].departAt, search.departureWindow)) return false;
  }

  // 抵達時間窗（去程最後一段抵達）
  if (search.arrivalWindow) {
    if (!withinWindow(lastSegmentArrive(offer.outbound), search.arrivalWindow)) return false;
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
