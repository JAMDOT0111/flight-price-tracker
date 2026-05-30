import { useState } from "react";
import { buildGoogleFlightsUrlForTrackedSearch, type PriceSnapshot, type ProviderName } from "@flight-tracker/shared";
import { api, type TrackedSearchWithLatest } from "../api.js";
import { formatDate, formatDateTime, formatPrice } from "../format.js";
import PriceChart from "./PriceChart.js";
import Icon from "./Icon.js";

interface Props {
  search: TrackedSearchWithLatest;
  onChanged: () => void;
}

const PROVIDER_LABEL: Record<ProviderName, string> = {
  mock: "模擬資料",
  duffel: "Duffel",
  ignav: "Ignav",
};

function durationText(s: TrackedSearchWithLatest): string {
  if (s.tripType === "oneway") return "單程";
  if (s.durationMode === "fixed") return `${s.durationMin} 天來回`;
  return `${s.durationMin}~${s.durationMax} 天來回`;
}

function stopsText(stops: number): string {
  return stops === 0 ? "直飛" : `轉機 ${stops} 次`;
}

const bookingLinkClass =
  "rounded-xl border border-secondary/30 px-4 py-2 text-label-md font-medium text-on-secondary-container hover:bg-secondary-container/20 transition-colors";

const outlineBtnClass =
  "rounded-xl border border-outline-variant px-4 py-2 text-label-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50";

function BookingLinkButtons({
  outbound,
  inbound,
  oneWay,
}: {
  outbound: string | null;
  inbound: string | null;
  oneWay: boolean;
}) {
  if (!outbound && !inbound) return null;
  if (outbound && inbound && outbound === inbound) {
    return (
      <a href={outbound} target="_blank" rel="noreferrer" className={bookingLinkClass}>
        前往訂票
      </a>
    );
  }
  return (
    <>
      {outbound && (
        <a href={outbound} target="_blank" rel="noreferrer" className={bookingLinkClass}>
          {oneWay ? "前往訂票" : "訂去程"}
        </a>
      )}
      {inbound && inbound !== outbound && (
        <a href={inbound} target="_blank" rel="noreferrer" className={bookingLinkClass}>
          訂回程
        </a>
      )}
    </>
  );
}

export default function SearchCard({ search, onChanged }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);
  const [busy, setBusy] = useState(false);

  const latest = search.latestSnapshot;
  const googleFlightsUrl = buildGoogleFlightsUrlForTrackedSearch(search, latest);
  const dimmed = !latest;

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

  const metaLine = [
    `${formatDate(search.dateRangeStart)}–${formatDate(search.dateRangeEnd)}`,
    search.nonStop ? "直飛" : null,
    search.departureWindow ? `出發 ${search.departureWindow.start}-${search.departureWindow.end}` : null,
    search.arrivalWindow ? `抵達 ${search.arrivalWindow.start}-${search.arrivalWindow.end}` : null,
    `${search.passengers} 人`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={`rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-card-padding shadow-tracking-card transition-all hover:border-primary/30 ${
        dimmed ? "opacity-90" : ""
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-headline-lg-mobile font-bold text-on-surface md:text-headline-lg">
              {search.origin} → {search.destination}
            </h3>
            <span className="rounded-full bg-tertiary-fixed px-3 py-1 text-label-sm text-on-tertiary-fixed-variant">
              {durationText(search)}
            </span>
            {!search.active && (
              <span className="flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1 text-label-sm text-on-surface-variant">
                <Icon name="pause_circle" className="text-[14px]" />
                已暫停
              </span>
            )}
          </div>
          <p className="text-label-md text-on-surface-variant">{metaLine}</p>
        </div>

        <div className="shrink-0 text-right">
          {latest ? (
            <>
              <div className="text-title-md font-extrabold text-primary">
                {formatPrice(latest.lowestPrice, latest.currency)}
              </div>
              <div className="text-label-sm text-on-surface-variant">
                {latest.bestOutboundDate ? formatDate(latest.bestOutboundDate) : "-"}
                {latest.bestReturnDate ? ` → ${formatDate(latest.bestReturnDate)}` : ""}
              </div>
              {latest.source && (
                <span
                  className={`mt-1 inline-block rounded-md px-2 py-0.5 text-label-sm font-bold ${
                    latest.source === "mock"
                      ? "bg-surface-container-high text-on-surface-variant"
                      : "bg-secondary-container text-on-secondary-container"
                  }`}
                >
                  來源：{PROVIDER_LABEL[latest.source]}
                </span>
              )}
            </>
          ) : (
            <div className="rounded-xl bg-surface-container px-4 py-3 text-label-md font-semibold text-on-surface-variant">
              尚無報價
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm("確定刪除此追蹤？"))
              void withBusy(async () => {
                await api.deleteSearch(search.id);
                onChanged();
              });
          }}
          disabled={busy}
          className="shrink-0 rounded-lg p-2 text-error transition-colors hover:bg-error-container/30 disabled:opacity-50"
          title="刪除"
          aria-label="刪除"
        >
          <Icon name="delete" className="text-xl" />
        </button>
      </div>

      {latest?.offerSummary && (
        <div className="mb-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 px-4 py-5">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {latest.offerSummary.carrierCodes.slice(0, 3).map((code) => (
                <div
                  key={code}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-[10px] font-bold text-primary"
                >
                  {code}
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-label-md text-on-surface">
                <span className="shrink-0 font-bold">去程</span>
                <span>
                  {formatDateTime(latest.offerSummary.outboundDepartAt)} →{" "}
                  {formatDateTime(latest.offerSummary.outboundArriveAt)}
                </span>
                <span className="text-on-surface-variant">{stopsText(latest.offerSummary.outboundStops)}</span>
              </div>
              {latest.offerSummary.inboundDepartAt && latest.offerSummary.inboundArriveAt && (
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-label-md text-on-surface">
                  <span className="shrink-0 font-bold">回程</span>
                  <span>
                    {formatDateTime(latest.offerSummary.inboundDepartAt)} →{" "}
                    {formatDateTime(latest.offerSummary.inboundArriveAt)}
                  </span>
                  {latest.offerSummary.inboundStops !== null && (
                    <span className="text-on-surface-variant">{stopsText(latest.offerSummary.inboundStops)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            withBusy(async () => {
              await api.runNow(search.id);
              onChanged();
              if (expanded) await loadSnapshots();
            })
          }
          disabled={busy}
          className="rounded-xl bg-primary px-4 py-2 text-label-md font-bold text-on-primary transition-all hover:shadow-md disabled:opacity-50"
        >
          立即追蹤一次
        </button>
        <button
          type="button"
          onClick={() =>
            withBusy(async () => {
              await api.setActive(search.id, !search.active);
              onChanged();
            })
          }
          disabled={busy}
          className={outlineBtnClass}
        >
          {search.active ? "暫停" : "恢復"}
        </button>
        <button type="button" onClick={toggleExpand} className={`${outlineBtnClass} flex items-center gap-1`}>
          <Icon name="trending_up" className="text-[18px]" />
          {expanded ? "收合走勢" : "價格走勢"}
        </button>
        <button
          type="button"
          onClick={() => {
            const url = `${window.location.origin}/s/${search.shareToken}`;
            void navigator.clipboard?.writeText(url);
            alert(`分享連結已複製：\n${url}`);
          }}
          className={outlineBtnClass}
          title="分享"
        >
          <Icon name="share" className="text-[18px]" />
        </button>
        <a
          href={googleFlightsUrl}
          target="_blank"
          rel="noreferrer"
          className={outlineBtnClass}
          title="不耗 API 額度，至 Google Flights 手動查價"
        >
          Google Flights 搜尋
        </a>
        {latest && (
          <BookingLinkButtons
            outbound={latest.bookingDeepLink}
            inbound={latest.bookingReturnDeepLink}
            oneWay={search.tripType === "oneway"}
          />
        )}
      </div>

      {expanded && (
        <div className="mt-4 border-t border-outline-variant/20 pt-4">
          <PriceChart snapshots={snapshots} currency={search.currency} />
        </div>
      )}
    </div>
  );
}
