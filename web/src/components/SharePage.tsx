import { useEffect, useState } from "react";
import { api, type SharedView } from "../api.js";
import { formatDate, formatPrice } from "../format.js";
import PriceChart from "./PriceChart.js";
import Icon from "./Icon.js";

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
    <div className="min-h-screen bg-background text-on-surface">
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-margin-mobile py-4 md:px-margin-desktop">
          <Icon name="trending_up" className="text-2xl text-primary" />
          <h1 className="text-headline-lg-mobile font-bold md:text-headline-lg">機票價格走勢（分享）</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-margin-mobile py-6 md:px-margin-desktop">
        {error && (
          <p className="rounded-xl bg-error-container px-4 py-3 text-label-md text-on-error-container">{error}</p>
        )}
        {!error && !data && <p className="text-label-md text-on-surface-variant">載入中…</p>}
        {data && (
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-card-padding shadow-tracking-card">
            <div className="flex items-center justify-between gap-4">
              <span className="text-headline-lg-mobile font-bold md:text-headline-lg">
                {data.search.origin} → {data.search.destination}
              </span>
              {data.snapshots.length > 0 && (
                <span className="text-headline-lg-mobile font-extrabold text-primary md:text-headline-lg">
                  {formatPrice(Math.min(...data.snapshots.map((s) => s.lowestPrice)), data.search.currency)}
                </span>
              )}
            </div>
            <p className="mt-1 text-label-sm text-on-surface-variant">
              {formatDate(data.search.dateRangeStart)}–{formatDate(data.search.dateRangeEnd)}
              {data.search.nonStop && " · 直飛"}
              {` · ${data.search.passengers} 人`}
            </p>
            <div className="mt-4">
              <PriceChart snapshots={data.snapshots} currency={data.search.currency} />
            </div>
            <a href="/" className="mt-4 inline-block text-label-md text-primary hover:underline">
              建立你自己的追蹤 →
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
