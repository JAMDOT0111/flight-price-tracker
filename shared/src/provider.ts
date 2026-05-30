import type { FlightOffer } from "./types.js";

/** 解析後的訂票連結；來回票可能去/回各一條 URL。 */
export interface ResolvedBookingLinks {
  outbound: string | null;
  inbound: string | null;
}

/**
 * 單次「特定日期」的航班查詢參數。
 * Provider 只負責「給定明確去/回日期，回傳當日報價」；
 * 區間最低價的滑動視窗邏輯由上層 Tracker 引擎負責（SRP）。
 */
export interface FlightSearchQuery {
  origin: string;
  destination: string;
  /** 去程日期 "YYYY-MM-DD" */
  departureDate: string;
  /** 回程日期 "YYYY-MM-DD"；單程為 null */
  returnDate: string | null;
  passengers: number;
  nonStop: boolean;
  currency: string;
  /** 限制回傳筆數，控制資料量 */
  maxResults?: number;
}

/**
 * 機票資料來源的抽象介面（adapter）。
 * 實作：MockProvider（開發）、DuffelProvider（正式）。
 */
export interface FlightProvider {
  readonly name: string;
  search(query: FlightSearchQuery): Promise<FlightOffer[]>;
  /**
   * 選用：解析單筆報價的訂票連結（優先航空公司官網）。
   * 來回票可能回傳去程、回程各一 URL；若為合一來回連結，outbound 與 inbound 相同。
   */
  resolveBookingLink?(offer: FlightOffer): Promise<ResolvedBookingLinks | null>;
}
