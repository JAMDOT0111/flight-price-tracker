import { useCallback, useEffect, useState } from "react";
import type { TrackedSearchInput } from "@flight-tracker/shared";
import { api, type TrackedSearchWithLatest } from "./api.js";
import { enablePush } from "./push.js";
import SearchForm from "./components/SearchForm.js";
import SearchCard from "./components/SearchCard.js";
import SharePage from "./components/SharePage.js";

export default function App() {
  const shareMatch = window.location.pathname.match(/^\/s\/([^/]+)$/);
  if (shareMatch) {
    return <SharePage token={decodeURIComponent(shareMatch[1])} />;
  }
  return <Dashboard />;
}

function Dashboard() {
  const [searches, setSearches] = useState<TrackedSearchWithLatest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setSearches(await api.listSearches());
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(input: TrackedSearchInput) {
    await api.createSearch(input);
    await refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold">機票最低價追蹤</h1>
            <p className="text-sm text-slate-500">在日期區間內持續追蹤最便宜的來回機票</p>
          </div>
          <button
            onClick={async () => {
              try {
                alert(await enablePush());
              } catch (err) {
                alert(err instanceof Error ? err.message : "啟用通知失敗");
              }
            }}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            啟用通知
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-2">
        <section>
          <SearchForm onCreate={handleCreate} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">追蹤清單</h2>
          {loading && <p className="text-sm text-slate-400">載入中…</p>}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {!loading && !error && searches.length === 0 && (
            <p className="text-sm text-slate-400">還沒有追蹤項目，從左側新增一個吧。</p>
          )}
          <div className="flex flex-col gap-3">
            {searches.map((s) => (
              <SearchCard key={s.id} search={s} onChanged={refresh} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
