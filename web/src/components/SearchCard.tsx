import { useState } from "react";
import type { PriceSnapshot } from "@flight-tracker/shared";
import { api, type TrackedSearchWithLatest } from "../api.js";
import { formatDate, formatPrice } from "../format.js";
import PriceChart from "./PriceChart.js";

interface Props {
  search: TrackedSearchWithLatest;
  onChanged: () => void;
}

function durationText(s: TrackedSearchWithLatest): string {
  if (s.tripType === "oneway") return "單程";
  if (s.durationMode === "fixed") return `${s.durationMin} 天來回`;
  return `${s.durationMin}~${s.durationMax} 天來回`;
}

export default function SearchCard({ search, onChanged }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);
  const [busy, setBusy] = useState(false);

  const latest = search.latestSnapshot;

  async function loadSnapshots() {
    setSnapshots(await api.getSnapshots(search.id));
  }

  async function toggleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next) await loadSnapshots();
  }

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">
              {search.origin} → {search.destination}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{durationText(search)}</span>
            {!search.active && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">已暫停</span>}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {formatDate(search.dateRangeStart)}–{formatDate(search.dateRangeEnd)}
            {search.nonStop && " · 直飛"}
            {search.checkedBaggage.required &&
              ` · 行李${search.checkedBaggage.minKg ? ` ${search.checkedBaggage.minKg}kg` : ""}`}
            {search.departureWindow && ` · 出發 ${search.departureWindow.start}-${search.departureWindow.end}`}
            {search.arrivalWindow && ` · 抵達 ${search.arrivalWindow.start}-${search.arrivalWindow.end}`}
            {` · ${search.passengers} 人`}
          </p>
        </div>
        <div className="text-right">
          {latest ? (
            <>
              <div className="text-xl font-bold text-sky-700">{formatPrice(latest.lowestPrice, latest.currency)}</div>
              <div className="text-xs text-slate-500">
                {latest.bestOutboundDate ? formatDate(latest.bestOutboundDate) : "-"}
                {latest.bestReturnDate ? ` → ${formatDate(latest.bestReturnDate)}` : ""}
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-400">尚無報價</div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => withBusy(async () => { await api.runNow(search.id); onChanged(); if (expanded) await loadSnapshots(); })}
          disabled={busy}
          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          立即追蹤一次
        </button>
        <button
          onClick={() => withBusy(async () => { await api.setActive(search.id, !search.active); onChanged(); })}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {search.active ? "暫停" : "恢復"}
        </button>
        <button onClick={toggleExpand} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
          {expanded ? "收合走勢" : "價格走勢"}
        </button>
        <button
          onClick={() => {
            const url = `${window.location.origin}/s/${search.shareToken}`;
            void navigator.clipboard?.writeText(url);
            alert(`分享連結已複製：\n${url}`);
          }}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          分享
        </button>
        {latest?.bookingDeepLink && (
          <a
            href={latest.bookingDeepLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50"
          >
            前往訂票
          </a>
        )}
        <button
          onClick={() => {
            if (confirm("確定刪除此追蹤？")) void withBusy(async () => { await api.deleteSearch(search.id); onChanged(); });
          }}
          disabled={busy}
          className="ml-auto rounded-lg px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          刪除
        </button>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <PriceChart snapshots={snapshots} currency={search.currency} />
        </div>
      )}
    </div>
  );
}
