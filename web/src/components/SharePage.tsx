import { useEffect, useState } from "react";
import { api, type SharedView } from "../api.js";
import { formatDate, formatPrice } from "../format.js";
import PriceChart from "./PriceChart.js";

interface Props {
  token: string;
}

export default function SharePage({ token }: Props) {
  const [data, setData] = useState<SharedView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getShared(token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "載入失敗"));
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-xl font-semibold">機票價格走勢（分享）</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {!error && !data && <p className="text-sm text-slate-400">載入中…</p>}
        {data && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">
                {data.search.origin} → {data.search.destination}
              </span>
              {data.snapshots.length > 0 && (
                <span className="text-xl font-bold text-sky-700">
                  {formatPrice(
                    Math.min(...data.snapshots.map((s) => s.lowestPrice)),
                    data.search.currency,
                  )}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {formatDate(data.search.dateRangeStart)}–{formatDate(data.search.dateRangeEnd)}
              {data.search.nonStop && " · 直飛"}
              {` · ${data.search.passengers} 人`}
            </p>
            <div className="mt-4">
              <PriceChart snapshots={data.snapshots} currency={data.search.currency} />
            </div>
            <a href="/" className="mt-4 inline-block text-sm text-sky-600 hover:underline">
              建立你自己的追蹤 →
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
