import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TrackedSearchInput } from "@flight-tracker/shared";
import { api, type AppConfig, type TrackedSearchWithLatest } from "./api.js";
import { enablePush } from "./push.js";
import SearchForm from "./components/SearchForm.js";
import SearchCard from "./components/SearchCard.js";
import SharePage from "./components/SharePage.js";
import FeedbackDialog from "./components/FeedbackDialog.js";
import FeedbackListPage from "./components/FeedbackListPage.js";
import LoginModal, { type CurrentUser } from "./components/LoginModal.js";
import Icon from "./components/Icon.js";
import {
  FILTER_OPTIONS,
  SORT_OPTIONS,
  filterAndSortSearches,
  type SearchFilter,
  type SearchSort,
} from "./lib/searchListControls.js";
import { applyTheme, getPreferredTheme, type ThemeMode } from "./lib/theme.js";

type NavSection = "home" | "list" | "feedback-list";

export default function App() {
  // BASE_URL 在 GitHub Pages 為 "/flight-price-tracker/"，本機為 "/"
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const shareMatch = window.location.pathname.match(
    new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/s\\/([^/]+)$`),
  );
  if (shareMatch) {
    return <SharePage token={decodeURIComponent(shareMatch[1])} />;
  }
  return <Dashboard />;
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Dashboard() {
  const [searches, setSearches] = useState<TrackedSearchWithLatest[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [sort, setSort] = useState<SearchSort>("active-first");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const raw = localStorage.getItem("flight-tracker-user");
      return raw ? (JSON.parse(raw) as CurrentUser) : null;
    } catch {
      return null;
    }
  });
  const [onlyMine, setOnlyMine] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeNav, setActiveNav] = useState<NavSection>("home");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => getPreferredTheme());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

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

  const refreshConfig = useCallback(() => {
    void api.getConfig().then(setConfig).catch(() => {});
  }, []);

  useEffect(() => {
    void refresh();
    refreshConfig();
  }, [refresh, refreshConfig]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
        setShowSortMenu(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function handleCreate(input: TrackedSearchInput) {
    await api.createSearch(input);
    await refresh();
  }

  const handleChanged = useCallback(() => {
    void refresh();
    refreshConfig();
  }, [refresh, refreshConfig]);

  const displayedSearches = useMemo(() => {
    let list = filterAndSortSearches(searches, filter, sort);
    // 非管理員：永遠只看自己的項目
    if (currentUser && !currentUser.isAdmin) {
      list = list.filter((s) => s.tag === currentUser.tag);
    } else if (currentUser?.isAdmin && onlyMine) {
      list = list.filter((s) => s.tag === currentUser.tag);
    }
    return list;
  }, [searches, filter, sort, currentUser, onlyMine]);

  function handleLogout() {
    localStorage.removeItem("flight-tracker-user");
    setCurrentUser(null);
  }

  function navigate(section: NavSection) {
    setActiveNav(section);
    if (section === "home") scrollToSection("search-form");
    else if (section === "list") scrollToSection("tracking-list");
  }

  const headerNav = (
    <div className="hidden items-center gap-8 md:flex">
      {(
        [
          { id: "home" as const, label: "首頁" },
          { id: "list" as const, label: "追蹤清單" },
          { id: "feedback-list" as const, label: "問題彙總" },
        ] as const
      ).map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => navigate(id)}
          className={`border-b-2 py-1 text-body-md transition-colors ${
            activeNav === id
              ? "border-primary font-bold text-primary"
              : "border-transparent font-medium text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const sidebarNavItems: { id: NavSection; label: string; icon: string }[] = [
    { id: "home", label: "首頁", icon: "home" },
    { id: "list", label: "追蹤清單", icon: "list_alt" },
    { id: "feedback-list", label: "問題彙總", icon: "task_alt" },
  ];

  const filterBtnClass =
    "flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high";

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {!currentUser && <LoginModal onLogin={setCurrentUser} />}

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-outline-variant bg-surface-container-lowest px-4 pb-6 pt-8 shadow-sm lg:flex">
        <div className="mb-4 px-4">
          <h2 className="text-title-md font-black text-primary">機票追蹤</h2>
          <p className="text-label-sm text-on-surface-variant">Premium Travel Concierge</p>
        </div>
        <nav className="flex flex-col gap-1">
          {sidebarNavItems.map(({ id, label, icon }) => {
            const active = activeNav === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-label-md transition-all ${
                  active
                    ? "bg-primary-container font-bold text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <Icon name={icon} filled={active} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* 底部：使用者資訊 + 問題回報 + 登出 */}
        <div className="mt-auto">
          <div className="mb-3 border-t border-outline-variant/30" />
          {currentUser && (
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-2.5">
              <Icon name="person" className="shrink-0 text-primary text-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-label-sm font-bold text-on-surface">{currentUser.tag}</p>
                {currentUser.isAdmin && (
                  <p className="text-label-xs text-primary">管理員</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="登出"
                className="rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-error"
              >
                <Icon name="logout" className="text-lg" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-label-md text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
          >
            <Icon name="bug_report" />
            問題回報
          </button>
        </div>
      </aside>

      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

      <div className="flex min-h-screen flex-col pb-20 lg:ml-64 md:pb-0">
        <header className="sticky top-0 z-50 border-b border-outline-variant bg-background">
          <div className="flex items-center justify-between gap-4 px-margin-mobile py-4 lg:px-gutter md:px-margin-desktop md:py-5">
            <div className="flex items-center gap-3">
              <Icon name="flight_takeoff" filled className="text-3xl text-primary" />
              <h1 className="text-headline-lg-mobile font-bold text-on-background md:text-headline-lg">
                機票最低價追蹤
              </h1>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              {headerNav}
              <button
                type="button"
                onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
                aria-pressed={theme === "dark"}
                aria-label={theme === "light" ? "切換至深色模式" : "切換至淺色模式"}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <Icon name={theme === "light" ? "light_mode" : "dark_mode"} />
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    alert(await enablePush());
                  } catch (err) {
                    alert(err instanceof Error ? err.message : "啟用通知失敗");
                  }
                }}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-label-md text-on-primary transition-all hover:opacity-80"
              >
                <Icon name="notifications" className="text-sm" />
                <span className="hidden sm:inline">啟用通知</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-margin-mobile py-6 lg:px-gutter md:px-margin-desktop">
          {activeNav === "feedback-list" ? (
            <FeedbackListPage />
          ) : (
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
            <section id="search-form" className="h-fit md:col-span-4 md:sticky md:top-24 lg:col-span-4">
              {currentUser && <SearchForm onCreate={handleCreate} currentUser={currentUser} />}
            </section>

            <section id="tracking-list" className="md:col-span-8 lg:col-span-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-headline-lg-mobile font-bold md:text-headline-lg">追蹤清單</h2>
                  {!loading && searches.length > 0 && (
                    <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-label-sm font-semibold text-on-surface-variant">
                      {displayedSearches.length} 件
                    </span>
                  )}
                  {currentUser?.isAdmin && (
                    <button
                      type="button"
                      onClick={() => setOnlyMine((v) => !v)}
                      className={`rounded-xl px-3 py-1.5 text-label-sm font-semibold transition-colors ${
                        onlyMine
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {onlyMine ? `只看「${currentUser.tag}」` : "全部 / 只看我的"}
                    </button>
                  )}
                </div>
                <div ref={menuRef} className="relative flex gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFilterMenu((v) => !v);
                        setShowSortMenu(false);
                      }}
                      className={filterBtnClass}
                    >
                      <Icon name="filter_list" className="text-lg" />
                      篩選
                    </button>
                    {showFilterMenu && (
                      <div className="absolute right-0 z-20 mt-2 min-w-[10rem] rounded-xl border border-outline-variant bg-surface-container-lowest py-1 shadow-lg shadow-black/10">
                        {FILTER_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setFilter(opt.value);
                              setShowFilterMenu(false);
                            }}
                            className={`block w-full px-4 py-2 text-left text-label-md transition-colors hover:bg-surface-container-low ${
                              filter === opt.value ? "font-bold text-primary" : "text-on-surface-variant"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSortMenu((v) => !v);
                        setShowFilterMenu(false);
                      }}
                      className={filterBtnClass}
                    >
                      <Icon name="sort" className="text-lg" />
                      排序
                    </button>
                    {showSortMenu && (
                      <div className="absolute right-0 z-20 mt-2 min-w-[12rem] rounded-xl border border-outline-variant bg-surface-container-lowest py-1 shadow-lg shadow-black/10">
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setSort(opt.value);
                              setShowSortMenu(false);
                            }}
                            className={`block w-full px-4 py-2 text-left text-label-md transition-colors hover:bg-surface-container-low ${
                              sort === opt.value ? "font-bold text-primary" : "text-on-surface-variant"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {config?.fallbackReason && (
                <p className="mb-4 rounded-xl border border-outline-variant/20 bg-error-container px-4 py-3 text-label-md text-on-error-container">
                  {config.fallbackReason === "quota"
                    ? `已達 ${config.primaryProvider} 額度上限，暫時改用「${config.activeProvider}」。`
                    : `${config.primaryProvider} 尚未設定（缺金鑰），暫時改用「${config.activeProvider}」。`}
                </p>
              )}
              {loading && <p className="text-label-md text-on-surface-variant">載入中…</p>}
              {error && (
                <p className="rounded-xl bg-error-container px-4 py-3 text-label-md text-on-error-container">{error}</p>
              )}
              {!loading && !error && searches.length === 0 && (
                <p className="text-label-md text-on-surface-variant">還沒有追蹤項目，從左側新增一個吧。</p>
              )}
              {!loading && !error && searches.length > 0 && displayedSearches.length === 0 && (
                <p className="text-label-md text-on-surface-variant">沒有符合篩選條件的項目。</p>
              )}
              <div className="space-y-gutter">
                {displayedSearches.map((s) => (
                  <SearchCard key={s.id} search={s} onChanged={handleChanged} />
                ))}
              </div>
            </section>
            </div>
          )}
          </main>

          <footer className="border-t border-outline-variant bg-surface-container-lowest px-margin-mobile py-8 lg:px-gutter md:px-margin-desktop">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex flex-col items-center md:items-start">
                <span className="mb-2 text-label-md font-bold text-on-surface">機票最低價追蹤</span>
                <p className="text-label-sm text-on-surface-variant">© 2026 機票最低價追蹤 — Premium Travel Logistics</p>
              </div>
              <div className="flex gap-8">
                {["隱私政策", "服務條款", "聯繫我們"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => alert(`${label}即將推出`)}
                    className="text-label-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </footer>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-outline-variant bg-surface-container px-2 py-3 lg:hidden">
        {(
          [
            { id: "home" as const, label: "首頁", icon: "home" },
            { id: "list" as const, label: "追蹤清單", icon: "list_alt" },
            { id: "feedback-list" as const, label: "問題彙總", icon: "task_alt" },
          ] as const
        ).map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => navigate(id)}
            className={`flex flex-col items-center gap-1 ${activeNav === id ? "text-primary" : "text-on-surface-variant"}`}
          >
            <Icon name={icon} filled={activeNav === id} />
            <span className={`text-[10px] ${activeNav === id ? "font-bold" : "font-medium"}`}>{label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="flex flex-col items-center gap-1 text-on-surface-variant"
        >
          <Icon name="bug_report" />
          <span className="text-[10px] font-medium">問題回報</span>
        </button>
      </nav>
    </div>
  );
}
