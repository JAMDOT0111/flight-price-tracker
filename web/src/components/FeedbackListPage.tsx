import { useCallback, useEffect, useState } from "react";
import { api, type FeedbackReport } from "../api.js";
import { formatDateTime } from "../format.js";
import Icon from "./Icon.js";

export default function FeedbackListPage() {
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "resolved">("all");

  const load = useCallback(async () => {
    setError(null);
    try {
      setReports(await api.listFeedback());
    } catch {
      setError("載入失敗（需要管理員權限）");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleStatus(report: FeedbackReport) {
    if (busyId) return;
    setBusyId(report.id);
    const next = report.status === "pending" ? "resolved" : "pending";
    try {
      await api.updateFeedbackStatus(report.id, next);
      setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, status: next } : r));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("確定刪除此回報？")) return;
    if (busyId) return;
    setBusyId(id);
    try {
      await api.deleteFeedback(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  const displayed = reports.filter((r) => filterStatus === "all" || r.status === filterStatus);
  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div>
      {/* 標題列 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-headline-lg-mobile font-bold md:text-headline-lg">問題彙總</h2>
          {pendingCount > 0 && (
            <span className="rounded-full bg-error px-2.5 py-0.5 text-label-sm font-bold text-on-error">
              {pendingCount} 未處理
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-2 text-label-md text-on-surface-variant hover:bg-surface-container-high"
        >
          <Icon name="refresh" className="text-lg" />
          重新整理
        </button>
      </div>

      {/* 篩選 */}
      <div className="mb-4 flex gap-2">
        {(["all", "pending", "resolved"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilterStatus(s)}
            className={`rounded-xl px-3 py-1.5 text-label-md transition-colors ${
              filterStatus === s
                ? "bg-primary text-on-primary font-bold"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {s === "all" ? "全部" : s === "pending" ? "未處理" : "已處理"}
          </button>
        ))}
      </div>

      {/* 狀態提示 */}
      {loading && <p className="text-label-md text-on-surface-variant">載入中…</p>}
      {error && (
        <p className="rounded-xl bg-error-container px-4 py-3 text-label-md text-on-error-container">{error}</p>
      )}
      {!loading && !error && reports.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Icon name="inbox" className="text-5xl text-on-surface-variant/30" />
          <p className="text-label-md text-on-surface-variant">目前沒有任何問題回報</p>
        </div>
      )}
      {!loading && !error && reports.length > 0 && displayed.length === 0 && (
        <p className="text-label-md text-on-surface-variant">此分類沒有回報</p>
      )}

      {/* 問題清單 */}
      <div className="space-y-3">
        {displayed.map((r) => (
          <div
            key={r.id}
            className={`rounded-2xl border p-4 transition-all ${
              r.status === "resolved"
                ? "border-outline-variant/20 bg-surface-container opacity-60"
                : "border-outline-variant/30 bg-surface-container-lowest shadow-sm"
            }`}
          >
            <div className="flex items-start gap-3">
              <Icon
                name={r.status === "resolved" ? "check_circle" : "report_problem"}
                filled={r.status === "resolved"}
                className={`mt-0.5 shrink-0 text-xl ${
                  r.status === "resolved" ? "text-primary/50" : "text-error"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className={`whitespace-pre-wrap break-words text-body-md ${
                  r.status === "resolved" ? "line-through text-on-surface-variant" : "text-on-surface"
                }`}>
                  {r.message}
                </p>
                <p className="mt-1 text-label-xs text-on-surface-variant/60">
                  {formatDateTime(r.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void toggleStatus(r)}
                  disabled={busyId === r.id}
                  className={`rounded-xl px-3 py-1.5 text-label-sm font-semibold transition-colors disabled:opacity-50 ${
                    r.status === "pending"
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {r.status === "pending" ? "標記已處理" : "還原未處理"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(r.id)}
                  disabled={busyId === r.id}
                  className="rounded-lg p-1.5 text-error transition-colors hover:bg-error-container/30 disabled:opacity-50"
                  aria-label="刪除"
                >
                  <Icon name="delete" className="text-lg" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
