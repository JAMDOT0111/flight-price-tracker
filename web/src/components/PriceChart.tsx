import type { PriceSnapshot } from "@flight-tracker/shared";
import { formatPrice } from "../format.js";

interface Props {
  snapshots: PriceSnapshot[];
  currency: string;
}

const W = 320;
const H = 120;
const PAD = 8;

export default function PriceChart({ snapshots, currency }: Props) {
  if (snapshots.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">尚無價格紀錄，按「立即追蹤」抓第一筆。</p>;
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
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>最高 {formatPrice(max, currency)}</span>
        <span>最低 {formatPrice(min, currency)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="價格走勢圖">
        {n > 1 && <polyline fill="none" stroke="#0284c7" strokeWidth={2} points={points} />}
        {snapshots.map((s, i) => (
          <circle
            key={s.id}
            cx={xOf(i)}
            cy={yOf(s.lowestPrice)}
            r={i === lowestIdx ? 4 : 2.5}
            fill={i === lowestIdx ? "#16a34a" : "#0284c7"}
          />
        ))}
      </svg>
    </div>
  );
}
