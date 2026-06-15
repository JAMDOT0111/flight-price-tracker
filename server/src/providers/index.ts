import type { FlightProvider, ProviderName } from "@flight-tracker/shared";
import { MockProvider } from "./mock/MockProvider.js";
import { DuffelProvider } from "./duffel/DuffelProvider.js";
import { IgnavProvider } from "./ignav/IgnavProvider.js";
import { GoogleFlightsProvider } from "./googleflights/GoogleFlightsProvider.js";
import { SkyscannerProvider } from "./skyscanner/SkyscannerProvider.js";
import { TripProvider } from "./trip/TripProvider.js";

function isProviderName(name: string): name is ProviderName {
  return (
    name === "mock" ||
    name === "duffel" ||
    name === "ignav" ||
    name === "google-flights" ||
    name === "skyscanner" ||
    name === "trip"
  );
}

function parseName(raw: string): ProviderName {
  const name = raw.trim().toLowerCase();
  if (!isProviderName(name)) throw new Error(`未知的資料來源: ${raw}`);
  return name;
}

/**
 * 取得資料來源的優先序鏈。
 * 優先讀 PROVIDER_CHAIN（逗號分隔，如 "google-flights,ignav,mock"），
 * 未設定時沿用單一 FLIGHT_PROVIDER（預設 mock），向後相容。
 * mock 一律附加在最後當保底（去重）。
 */
export function getProviderChain(): ProviderName[] {
  const raw = process.env.PROVIDER_CHAIN?.trim() || process.env.FLIGHT_PROVIDER?.trim() || "mock";
  const chain = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseName);
  return [...new Set(chain)];
}

/** 鏈的首要（偏好）來源。 */
export function getPrimaryProviderName(): ProviderName {
  return getProviderChain()[0];
}

/**
 * 依名稱建立 provider。缺金鑰時會拋錯（代表「不可用」），
 * 由 tracker 捕捉後改用下一個。
 */
export function buildProviderByName(name: ProviderName): FlightProvider {
  switch (name) {
    case "mock":
      return new MockProvider();
    case "duffel":
      return new DuffelProvider(process.env.DUFFEL_API_TOKEN ?? "");
    case "ignav":
      return new IgnavProvider(process.env.IGNAV_API_KEY ?? "");
    case "google-flights":
      return new GoogleFlightsProvider();
    case "skyscanner":
      return new SkyscannerProvider(process.env.RAPIDAPI_KEY ?? "");
    case "trip":
      throw new Error("trip provider 需要住宅代理，目前停用（whaleguard 封鎖）");
  }
}

export { MockProvider } from "./mock/MockProvider.js";
export { DuffelProvider } from "./duffel/DuffelProvider.js";
export { IgnavProvider } from "./ignav/IgnavProvider.js";
export { GoogleFlightsProvider } from "./googleflights/GoogleFlightsProvider.js";
export { SkyscannerProvider } from "./skyscanner/SkyscannerProvider.js";
export { TripProvider } from "./trip/TripProvider.js";
