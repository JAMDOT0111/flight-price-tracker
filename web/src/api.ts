import type { PriceSnapshot, TrackedSearch, TrackedSearchInput } from "@flight-tracker/shared";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3001";

export interface TrackedSearchWithLatest extends TrackedSearch {
  latestSnapshot: PriceSnapshot | null;
}

export interface RunResult {
  trackedSearchId: string;
  evaluated: number;
  matched: number;
  snapshot: PriceSnapshot | null;
  isNewLow: boolean;
}

export interface SharedView {
  search: TrackedSearch;
  snapshots: PriceSnapshot[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = res.statusText;
    }
    throw new Error(`${res.status} ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listSearches: () => request<TrackedSearchWithLatest[]>("/api/searches"),
  createSearch: (input: TrackedSearchInput) =>
    request<TrackedSearch>("/api/searches", { method: "POST", body: JSON.stringify(input) }),
  deleteSearch: (id: string) => request<void>(`/api/searches/${id}`, { method: "DELETE" }),
  setActive: (id: string, active: boolean) =>
    request<TrackedSearch>(`/api/searches/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),
  runNow: (id: string) => request<RunResult>(`/api/searches/${id}/run-now`, { method: "POST" }),
  getSnapshots: (id: string) => request<PriceSnapshot[]>(`/api/searches/${id}/snapshots`),
  getShared: (token: string) => request<SharedView>(`/api/share/${token}`),
  getPushPublicKey: () => request<{ publicKey: string; enabled: boolean }>("/api/push/public-key"),
  subscribePush: (sub: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    request<{ ok: boolean }>("/api/push/subscribe", { method: "POST", body: JSON.stringify(sub) }),
};
