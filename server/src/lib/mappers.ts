import type {
  PriceSnapshot as DbPriceSnapshot,
  Prisma,
  TrackedSearch as DbTrackedSearch,
} from "@prisma/client";
import type {
  FlightOfferSummary,
  PriceSnapshot,
  ProviderName,
  TimeWindow,
  TrackedSearch,
} from "@flight-tracker/shared";
import type { ValidatedTrackedSearchInput } from "./validation.js";

function windowFrom(start: string | null, end: string | null): TimeWindow | null {
  return start !== null && end !== null ? { start, end } : null;
}

export function trackedSearchToDomain(row: DbTrackedSearch): TrackedSearch {
  return {
    id: row.id,
    origin: row.origin,
    destination: row.destination,
    tripType: row.tripType as TrackedSearch["tripType"],
    dateRangeStart: row.dateRangeStart,
    dateRangeEnd: row.dateRangeEnd,
    durationMode: row.durationMode as TrackedSearch["durationMode"],
    durationMin: row.durationMin,
    durationMax: row.durationMax,
    departureWindow: windowFrom(row.departureWindowStart, row.departureWindowEnd),
    arrivalWindow: windowFrom(row.arrivalWindowStart, row.arrivalWindowEnd),
    passengers: row.passengers,
    nonStop: row.nonStop,
    checkedBaggage: { required: row.checkedBagRequired, minKg: row.checkedBagMinKg },
    currency: row.currency,
    tag: row.tag,
    active: row.active,
    shareToken: row.shareToken,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function trackedSearchToCreateData(
  input: ValidatedTrackedSearchInput,
  shareToken: string,
): Prisma.TrackedSearchUncheckedCreateInput {
  return {
    origin: input.origin,
    destination: input.destination,
    tripType: input.tripType,
    dateRangeStart: input.dateRangeStart,
    dateRangeEnd: input.dateRangeEnd,
    durationMode: input.durationMode,
    durationMin: input.durationMin,
    durationMax: input.durationMax,
    departureWindowStart: input.departureWindow?.start ?? null,
    departureWindowEnd: input.departureWindow?.end ?? null,
    arrivalWindowStart: input.arrivalWindow?.start ?? null,
    arrivalWindowEnd: input.arrivalWindow?.end ?? null,
    passengers: input.passengers,
    nonStop: input.nonStop,
    checkedBagRequired: input.checkedBaggage.required,
    checkedBagMinKg: input.checkedBaggage.minKg,
    currency: input.currency,
    tag: input.tag,
    shareToken,
  };
}

export function trackedSearchToUpdateData(
  input: ValidatedTrackedSearchInput,
): Prisma.TrackedSearchUncheckedUpdateInput {
  return {
    origin: input.origin,
    destination: input.destination,
    tripType: input.tripType,
    dateRangeStart: input.dateRangeStart,
    dateRangeEnd: input.dateRangeEnd,
    durationMode: input.durationMode,
    durationMin: input.durationMin,
    durationMax: input.durationMax,
    departureWindowStart: input.departureWindow?.start ?? null,
    departureWindowEnd: input.departureWindow?.end ?? null,
    arrivalWindowStart: input.arrivalWindow?.start ?? null,
    arrivalWindowEnd: input.arrivalWindow?.end ?? null,
    passengers: input.passengers,
    nonStop: input.nonStop,
    checkedBagRequired: input.checkedBaggage.required,
    checkedBagMinKg: input.checkedBaggage.minKg,
    currency: input.currency,
    tag: input.tag,
  };
}

export function priceSnapshotToDomain(row: DbPriceSnapshot): PriceSnapshot {
  return {
    id: row.id,
    trackedSearchId: row.trackedSearchId,
    capturedAt: row.capturedAt.toISOString(),
    lowestPrice: row.lowestPrice,
    currency: row.currency,
    bestOutboundDate: row.bestOutboundDate,
    bestReturnDate: row.bestReturnDate,
    bookingDeepLink: row.bookingDeepLink,
    bookingReturnDeepLink: row.bookingReturnDeepLink ?? null,
    offerSummary: (row.offerSummary as FlightOfferSummary | null) ?? null,
    source: (row.source as ProviderName | null) ?? null,
  };
}
