import type { FlightProvider } from "@flight-tracker/shared";
import { MockProvider } from "./mock/MockProvider.js";

/**
 * 依環境變數 FLIGHT_PROVIDER 選擇資料來源（adapter）。
 * 目前支援 mock；duffel 將於後續步驟加入。
 */
export function createFlightProvider(): FlightProvider {
  const name = (process.env.FLIGHT_PROVIDER ?? "mock").toLowerCase();
  switch (name) {
    case "mock":
      return new MockProvider();
    case "duffel":
      throw new Error("DuffelProvider 尚未實作（將於後續步驟加入）");
    default:
      throw new Error(`未知的 FLIGHT_PROVIDER: ${name}`);
  }
}

export { MockProvider } from "./mock/MockProvider.js";
