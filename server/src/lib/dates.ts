/** 以 UTC 為基底處理 "YYYY-MM-DD"，避免時區造成的偏移。 */

function toUtc(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function addDays(dateStr: string, days: number): string {
  const dt = new Date(toUtc(dateStr) + days * 86_400_000);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function diffDays(start: string, end: string): number {
  return Math.round((toUtc(end) - toUtc(start)) / 86_400_000);
}

export function eachDateInclusive(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

/** 取出 "YYYY-MM-DDTHH:mm:00" 的 "HH:mm" */
export function timeOf(localDateTime: string): string {
  return localDateTime.slice(11, 16);
}
