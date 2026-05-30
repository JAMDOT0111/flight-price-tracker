/**
 * 領域型別：機票追蹤的核心資料結構。
 * 時間一律使用字串：日期為 "YYYY-MM-DD"，時刻為 "HH:mm"（當地時間）。
 */

export type TripType = "oneway" | "roundtrip";

/** 機票資料來源名稱 */
export type ProviderName = "mock" | "duffel" | "ignav";

/** 行程天數設定：固定天數或天數區間 */
export type DurationMode = "fixed" | "range";

/** 一天內的時刻範圍，例如出發 09:00–15:00 */
export interface TimeWindow {
  /** "HH:mm" */
  start: string;
  /** "HH:mm" */
  end: string;
}

/** 託運行李需求 */
export interface CheckedBaggage {
  required: boolean;
  /** 需求的最低公斤數；未指定則為 null */
  minKg: number | null;
}

/** 使用者建立追蹤時的輸入條件 */
export interface TrackedSearchInput {
  origin: string; // IATA，如 "TYO"
  destination: string; // IATA，如 "SGN"
  tripType: TripType;
  /** 區間起（含），"YYYY-MM-DD" */
  dateRangeStart: string;
  /** 區間迄（含），"YYYY-MM-DD" */
  dateRangeEnd: string;
  /** 來回才有意義；單程忽略 */
  durationMode: DurationMode;
  /** 固定模式＝天數；區間模式＝最小天數 */
  durationMin: number;
  /** 區間模式的最大天數；固定模式時等於 durationMin */
  durationMax: number;
  departureWindow: TimeWindow | null;
  arrivalWindow: TimeWindow | null;
  passengers: number;
  nonStop: boolean;
  checkedBaggage: CheckedBaggage;
  currency: string; // 如 "TWD"
}

/** 已儲存的追蹤項目 */
export interface TrackedSearch extends TrackedSearchInput {
  id: string;
  active: boolean;
  shareToken: string;
  createdAt: string;
  updatedAt: string;
}

/** 某次輪詢得到的最低價快照 */
export interface PriceSnapshot {
  id: string;
  trackedSearchId: string;
  capturedAt: string;
  lowestPrice: number;
  currency: string;
  bestOutboundDate: string;
  bestReturnDate: string | null;
  /** 去程（或合一來回）訂票連結 */
  bookingDeepLink: string | null;
  /** 回程訂票連結；與 bookingDeepLink 不同時前端顯示「訂回程」 */
  bookingReturnDeepLink: string | null;
  /** 該最低價對應航班的摘要（序列化保存） */
  offerSummary: FlightOfferSummary | null;
  /** 產生此價格的資料來源；舊資料可能為 null */
  source: ProviderName | null;
}

/** 航班單段資訊 */
export interface FlightSegment {
  carrierCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  /** ISO 8601 當地時間，如 "2026-09-01T09:30:00" */
  departAt: string;
  arriveAt: string;
}

/** 一個方向（去程或回程）的行程 */
export interface FlightItinerary {
  segments: FlightSegment[];
  stops: number;
}

/** 機票報價（Provider 的查詢結果） */
export interface FlightOffer {
  totalPrice: number;
  currency: string;
  outbound: FlightItinerary;
  inbound: FlightItinerary | null;
  /** 含託運行李件數（無資訊則為 null） */
  includedCheckedBags: number | null;
  /** 含託運行李公斤數（無資訊則為 null） */
  includedCheckedBagWeightKg: number | null;
  bookingDeepLink: string | null;
  /**
   * 來源端用以事後解析訂票連結的識別碼（如 Ignav 的 ignav_id）。
   * 由實作了 resolveBookingLink 的 provider 設定；其他來源可省略。
   */
  bookingToken?: string | null;
}

/** 寫入快照時用的精簡摘要 */
export interface FlightOfferSummary {
  carrierCodes: string[];
  outboundDepartAt: string;
  outboundArriveAt: string;
  inboundDepartAt: string | null;
  inboundArriveAt: string | null;
  outboundStops: number;
  inboundStops: number | null;
}
