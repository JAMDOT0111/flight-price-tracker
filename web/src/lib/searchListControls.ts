import type { TrackedSearchWithLatest } from "../api.js";

export type SearchFilter = "all" | "active" | "paused" | "has-quote" | "no-quote";

export type SearchSort =
  | "price-asc"
  | "price-desc"
  | "date-asc"
  | "date-desc"
  | "route"
  | "active-first";

export const FILTER_OPTIONS: { value: SearchFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "active", label: "追蹤中" },
  { value: "paused", label: "已暫停" },
  { value: "has-quote", label: "有報價" },
  { value: "no-quote", label: "尚無報價" },
];

export const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: "price-asc", label: "價格由低到高" },
  { value: "price-desc", label: "價格由高到低" },
  { value: "date-asc", label: "出發區間由早到晚" },
  { value: "date-desc", label: "出發區間由晚到早" },
  { value: "route", label: "航線 A→Z" },
  { value: "active-first", label: "追蹤中優先" },
];

function priceForSort(s: TrackedSearchWithLatest): number {
  return s.latestSnapshot?.lowestPrice ?? Number.POSITIVE_INFINITY;
}

function matchesFilter(s: TrackedSearchWithLatest, filter: SearchFilter): boolean {
  switch (filter) {
    case "active":
      return s.active;
    case "paused":
      return !s.active;
    case "has-quote":
      return s.latestSnapshot !== null;
    case "no-quote":
      return s.latestSnapshot === null;
    default:
      return true;
  }
}

export function filterAndSortSearches(
  searches: TrackedSearchWithLatest[],
  filter: SearchFilter,
  sort: SearchSort,
): TrackedSearchWithLatest[] {
  const filtered = searches.filter((s) => matchesFilter(s, filter));
  const sorted = [...filtered];

  sorted.sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return priceForSort(a) - priceForSort(b);
      case "price-desc":
        return priceForSort(b) - priceForSort(a);
      case "date-asc":
        return a.dateRangeStart.localeCompare(b.dateRangeStart);
      case "date-desc":
        return b.dateRangeStart.localeCompare(a.dateRangeStart);
      case "route": {
        const ra = `${a.origin}${a.destination}`;
        const rb = `${b.origin}${b.destination}`;
        return ra.localeCompare(rb);
      }
      case "active-first":
        if (a.active !== b.active) return a.active ? -1 : 1;
        return priceForSort(a) - priceForSort(b);
      default:
        return 0;
    }
  });

  return sorted;
}
