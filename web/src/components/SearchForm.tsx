import { useState } from "react";
import type { TrackedSearchInput, TripType, DurationMode } from "@flight-tracker/shared";

const CURRENCIES = ["TWD", "JPY", "USD", "EUR", "HKD", "SGD", "KRW", "VND"];

interface Props {
  onCreate: (input: TrackedSearchInput) => Promise<void>;
}

const labelCls = "block text-sm font-medium text-slate-700 mb-1";
const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

export default function SearchForm({ onCreate }: Props) {
  const [origin, setOrigin] = useState("TYO");
  const [destination, setDestination] = useState("SGN");
  const [tripType, setTripType] = useState<TripType>("roundtrip");
  const [dateRangeStart, setDateRangeStart] = useState("2026-09-01");
  const [dateRangeEnd, setDateRangeEnd] = useState("2026-09-30");
  const [durationMode, setDurationMode] = useState<DurationMode>("fixed");
  const [fixedDays, setFixedDays] = useState(5);
  const [rangeMin, setRangeMin] = useState(4);
  const [rangeMax, setRangeMax] = useState(7);
  const [useDeparture, setUseDeparture] = useState(true);
  const [depStart, setDepStart] = useState("09:00");
  const [depEnd, setDepEnd] = useState("15:00");
  const [useArrival, setUseArrival] = useState(true);
  const [arrStart, setArrStart] = useState("17:00");
  const [arrEnd, setArrEnd] = useState("21:00");
  const [passengers, setPassengers] = useState(1);
  const [nonStop, setNonStop] = useState(true);
  const [bagRequired, setBagRequired] = useState(true);
  const [bagKg, setBagKg] = useState(20);
  const [currency, setCurrency] = useState("TWD");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRoundtrip = tripType === "roundtrip";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const input: TrackedSearchInput = {
        origin: origin.trim().toUpperCase(),
        destination: destination.trim().toUpperCase(),
        tripType,
        dateRangeStart,
        dateRangeEnd,
        durationMode: isRoundtrip ? durationMode : "fixed",
        durationMin: isRoundtrip ? (durationMode === "fixed" ? fixedDays : rangeMin) : 1,
        durationMax: isRoundtrip ? (durationMode === "fixed" ? fixedDays : rangeMax) : 1,
        departureWindow: useDeparture ? { start: depStart, end: depEnd } : null,
        arrivalWindow: useArrival ? { start: arrStart, end: arrEnd } : null,
        passengers,
        nonStop,
        checkedBaggage: { required: bagRequired, minKg: bagRequired ? bagKg : null },
        currency,
      };
      await onCreate(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立失敗");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">新增追蹤</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>出發地（IATA）</label>
          <input className={inputCls} value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="TYO" maxLength={3} />
        </div>
        <div>
          <label className={labelCls}>目的地（IATA）</label>
          <input className={inputCls} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="SGN" maxLength={3} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>行程類型</label>
          <div className="flex gap-2">
            {(["roundtrip", "oneway"] as TripType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTripType(t)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  tripType === t ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-300 text-slate-600"
                }`}
              >
                {t === "roundtrip" ? "來回" : "單程"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>區間起</label>
          <input type="date" className={inputCls} value={dateRangeStart} onChange={(e) => setDateRangeStart(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>區間迄</label>
          <input type="date" className={inputCls} value={dateRangeEnd} onChange={(e) => setDateRangeEnd(e.target.value)} />
        </div>

        {isRoundtrip && (
          <div className="sm:col-span-2">
            <label className={labelCls}>行程天數</label>
            <div className="mb-2 flex gap-2">
              {(["fixed", "range"] as DurationMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMode(m)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    durationMode === m ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-300 text-slate-600"
                  }`}
                >
                  {m === "fixed" ? "固定天數" : "天數區間"}
                </button>
              ))}
            </div>
            {durationMode === "fixed" ? (
              <input type="number" min={1} max={60} className={inputCls} value={fixedDays} onChange={(e) => setFixedDays(Number(e.target.value))} />
            ) : (
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={60} className={inputCls} value={rangeMin} onChange={(e) => setRangeMin(Number(e.target.value))} />
                <span className="text-slate-400">~</span>
                <input type="number" min={1} max={60} className={inputCls} value={rangeMax} onChange={(e) => setRangeMax(Number(e.target.value))} />
                <span className="text-sm text-slate-500">天</span>
              </div>
            )}
          </div>
        )}

        <div className="sm:col-span-2">
          <label className={labelCls}>
            <input type="checkbox" className="mr-2" checked={useDeparture} onChange={(e) => setUseDeparture(e.target.checked)} />
            出發時間窗
          </label>
          <div className="flex items-center gap-2">
            <input type="time" className={`${inputCls} min-w-0 flex-1`} value={depStart} disabled={!useDeparture} onChange={(e) => setDepStart(e.target.value)} />
            <span className="shrink-0 text-slate-400">~</span>
            <input type="time" className={`${inputCls} min-w-0 flex-1`} value={depEnd} disabled={!useDeparture} onChange={(e) => setDepEnd(e.target.value)} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>
            <input type="checkbox" className="mr-2" checked={useArrival} onChange={(e) => setUseArrival(e.target.checked)} />
            抵達時間窗
          </label>
          <div className="flex items-center gap-2">
            <input type="time" className={`${inputCls} min-w-0 flex-1`} value={arrStart} disabled={!useArrival} onChange={(e) => setArrStart(e.target.value)} />
            <span className="shrink-0 text-slate-400">~</span>
            <input type="time" className={`${inputCls} min-w-0 flex-1`} value={arrEnd} disabled={!useArrival} onChange={(e) => setArrEnd(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelCls}>人數</label>
          <input type="number" min={1} max={9} className={inputCls} value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>幣別</label>
          <select className={inputCls} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <label className="flex items-center text-sm text-slate-700">
            <input type="checkbox" className="mr-2" checked={nonStop} onChange={(e) => setNonStop(e.target.checked)} />
            僅直飛
          </label>
        </div>
        <div>
          <label className="mb-1 flex items-center text-sm font-medium text-slate-700">
            <input type="checkbox" className="mr-2" checked={bagRequired} onChange={(e) => setBagRequired(e.target.checked)} />
            含託運行李
          </label>
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={100} className={inputCls} value={bagKg} disabled={!bagRequired} onChange={(e) => setBagKg(Number(e.target.value))} />
            <span className="text-sm text-slate-500">公斤（以上）</span>
          </div>
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {submitting ? "建立中…" : "開始追蹤"}
      </button>
    </form>
  );
}
