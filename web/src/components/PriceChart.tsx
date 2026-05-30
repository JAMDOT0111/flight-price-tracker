import type { PriceSnapshot } from "@flight-tracker/shared";
import { formatPrice } from "../format.js";

interface Props {
  snapshots: PriceSnapshot[];
  currency: string;
}

const W = 320;
const H = 120;
const PAD = 8;
const LINE_COLOR = "#004e9f";
const DOT_COLOR = "#0066cc";
const LOW_COLOR = "#006c49";

export default function PriceChart({ snapshots, currency }: Props) {
  if (snapshots.length === 0) {
    return (
      <p className="py-6 text-center text-label-md text-on-surface-variant">
        尚無價格紀錄，按「立即追蹤」抓第一筆。
      </p>
    );
  }

  const prices = snapshots.map((s) => s.lowestPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;

  const n = snapshots.length;
  const xOf = (i: number) => (n === 1 ? W / 2 : PAD + (i * (W - 2 * PAD)) / (n - 1));
  const yOf = (p: number) => PAD + (1 - (p - min) / span) * (H - 2 * PAD);

  const points = snapshots.map((s, i) => `${xOf(i)},${yOf(s.lowestPrice)}`).join(" ");
  const lowestIdx = prices.indexOf(min);

  return (
    <div>
      <div className="mb-1 flex justify-between text-label-sm text-on-surface-variant">
        <span>最高 {formatPrice(max, currency)}</span>
        <span>最低 {formatPrice(min, currency)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="價格走勢圖">
        {n > 1 && <polyline fill="none" stroke={LINE_COLOR} strokeWidth={2} points={points} />}
        {snapshots.map((s, i) => (
          <circle
            key={s.id}
            cx={xOf(i)}
            cy={yOf(s.lowestPrice)}
            r={i === lowestIdx ? 4 : 2.5}
            fill={i === lowestIdx ? LOW_COLOR : DOT_COLOR}
          />
        ))}
      </svg>
    </div>
  );
}
