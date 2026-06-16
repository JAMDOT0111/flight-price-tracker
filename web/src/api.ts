import type { PriceSnapshot, ProviderName, TrackedSearch, TrackedSearchInput } from "@flight-tracker/shared";

export type { ProviderName } from "@flight-tracker/shared";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3001";
const API_TOKEN = (import.meta.env.VITE_API_TOKEN as string | undefined) ?? "";

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

export interface ProviderUsageStatus {
  provider: ProviderName;
  used: number;
  limit: number | null;
  available: boolean;
}

export type FallbackReason = "unavailable" | "quota";

export interface AppConfig {
  primaryProvider: ProviderName;
  activeProvider: ProviderName;
  fallbackReason: FallbackReason | null;
  usage: ProviderUsageStatus[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };
  if (init?.body != null) headers["Content-Type"] = "application/json";
  if (API_TOKEN) headers["Authorization"] = `Bearer ${API_TOKEN}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
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

export interface FeedbackReport {
  id: string;
  message: string;
  status: "pending" | "resolved";
  createdAt: string;
}

export interface LoginResult {
  ok: boolean;
  tag?: string;
  isAdmin?: boolean;
  created?: boolean;
  message?: string;
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
  getConfig: () => request<AppConfig>("/api/config"),
  getPushPublicKey: () => request<{ publicKey: string; enabled: boolean }>("/api/push/public-key"),
  subscribePush: (sub: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    request<{ ok: boolean }>("/api/push/subscribe", { method: "POST", body: JSON.stringify(sub) }),
  submitFeedback: (message: string) =>
    request<{ id: string; ok: boolean }>("/api/feedback", { method: "POST", body: JSON.stringify({ message }) }),
  listFeedback: () => request<FeedbackReport[]>("/api/feedback"),
  updateFeedbackStatus: (id: string, status: "pending" | "resolved") =>
    request<{ ok: boolean }>(`/api/feedback/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteFeedback: (id: string) =>
    request<void>(`/api/feedback/${id}`, { method: "DELETE" }),
  login: (tag: string, password: string) =>
    fetch(`${BASE_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag, password }),
    }).then((r) => r.json() as Promise<LoginResult>),
};
