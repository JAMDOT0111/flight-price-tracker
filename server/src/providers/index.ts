import type { FlightProvider } from "@flight-tracker/shared";
import { MockProvider } from "./mock/MockProvider.js";
import { DuffelProvider } from "./duffel/DuffelProvider.js";

/**
 * 依環境變數 FLIGHT_PROVIDER 選擇資料來源（adapter）。
 * - mock：開發/展示用假資料（免金鑰）
 * - duffel：真實機票資料（需 DUFFEL_API_TOKEN）
 */
export function createFlightProvider(): FlightProvider {
  const name = (process.env.FLIGHT_PROVIDER ?? "mock").toLowerCase();
  switch (name) {
    case "mock":
      return new MockProvider();
    case "duffel":
      return new DuffelProvider(process.env.DUFFEL_API_TOKEN ?? "");
    default:
      throw new Error(`未知的 FLIGHT_PROVIDER: ${name}`);
  }
}

export { MockProvider } from "./mock/MockProvider.js";
export { DuffelProvider } from "./duffel/DuffelProvider.js";
