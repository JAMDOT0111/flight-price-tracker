/**
 * 以「無時區的當地時間」處理日期時刻字串，避免被系統時區影響。
 * 內部用 UTC 方法當作計算基底，輸出不帶 Z。
 */

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** 由 "YYYY-MM-DD" + 分鐘數，建立基準時間（epoch 毫秒，UTC 視角） */
export function dateAtMinutes(dateStr: string, minutesOfDay: number): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d, 0, 0, 0) + minutesOfDay * 60_000;
}

/** 將 epoch 毫秒格式化為 "YYYY-MM-DDTHH:mm:00"（不帶時區） */
export function formatLocal(epochMs: number): string {
  const dt = new Date(epochMs);
  const y = dt.getUTCFullYear();
  const m = pad(dt.getUTCMonth() + 1);
  const d = pad(dt.getUTCDate());
  const hh = pad(dt.getUTCHours());
  const mm = pad(dt.getUTCMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}:00`;
}

export function addMinutes(epochMs: number, minutes: number): number {
  return epochMs + minutes * 60_000;
}

/** 取得星期幾（0=週日 ... 6=週六），用於價格波動 */
export function dayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** 一年中的第幾天（用於季節性價格波動） */
export function dayOfYear(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = Date.UTC(y, 0, 0);
  const cur = Date.UTC(y, m - 1, d);
  return Math.floor((cur - start) / 86_400_000);
}
