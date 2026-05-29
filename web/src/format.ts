export function formatPrice(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("zh-Hant", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

/** "2026-09-20T14:22:00" -> "09/20 14:22" */
export function formatDateTime(localDateTime: string): string {
  const [date, time] = localDateTime.split("T");
  const [, m, d] = date.split("-");
  return `${m}/${d} ${time?.slice(0, 5) ?? ""}`;
}

/** "2026-09-20" -> "9/20" */
export function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}
