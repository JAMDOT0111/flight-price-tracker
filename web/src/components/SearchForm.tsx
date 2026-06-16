import { useState } from "react";
import type { TrackedSearchInput, TripType, DurationMode } from "@flight-tracker/shared";
import Icon from "./Icon.js";
import AirportInput from "./AirportInput.js";

const CURRENCIES = ["TWD", "JPY", "USD", "EUR", "HKD", "SGD", "KRW", "VND"];

interface Props {
  onCreate: (input: TrackedSearchInput) => Promise<void>;
}

const labelCls = "mb-2 block text-label-md text-on-surface-variant";
const inputCls =
  "w-full min-w-0 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20";
const pickerCls = `${inputCls} native-picker-input text-[13px] leading-tight`;
const datePickerCls = `${pickerCls} native-date-input`;
const timePickerCls = `${pickerCls} native-time-input`;

function FormDivider() {
  return <div className="border-t border-outline-variant/30" aria-hidden />;
}

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
    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-card-padding shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Icon name="add_circle" className="text-primary" />
        <h2 className="text-title-md">新增追蹤</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>出發地</label>
            <AirportInput
              value={origin}
              onChange={setOrigin}
              placeholder="TPE 或 台北"
            />
          </div>
          <div>
            <label className={labelCls}>目的地</label>
            <AirportInput
              value={destination}
              onChange={setDestination}
              placeholder="SGN 或 胡志明"
            />
          </div>
        </div>

        <FormDivider />

        <div>
          <label className={labelCls}>行程類型</label>
          <div className="grid grid-cols-2 rounded-xl bg-surface-container-low p-1">
            {(["roundtrip", "oneway"] as TripType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTripType(t)}
                className={`rounded-lg py-2 text-label-md transition-all ${
                  tripType === t
                    ? "bg-surface-container-lowest font-bold text-primary shadow-sm"
                    : "font-medium text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {t === "roundtrip" ? "來回" : "單程"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className={labelCls}>區間起</label>
            <input
              type="date"
              className={datePickerCls}
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
            />
          </div>
          <div className="min-w-0">
            <label className={labelCls}>區間迄</label>
            <input
              type="date"
              className={datePickerCls}
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
            />
          </div>
        </div>

        {isRoundtrip && (
          <div>
            <label className={labelCls}>行程天數</label>
            <div className="mb-3 flex flex-wrap gap-4">
              {(["fixed", "range"] as DurationMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMode(m)}
                  className={`rounded-xl border px-4 py-2 text-label-md transition-all ${
                    durationMode === m
                      ? "border-primary/20 bg-primary-container/10 font-bold text-primary"
                      : "border-outline-variant font-medium text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {m === "fixed" ? "固定天數" : "天數區間"}
                </button>
              ))}
            </div>
            {durationMode === "fixed" ? (
              <input
                type="number"
                min={1}
                max={60}
                className={inputCls}
                value={fixedDays}
                onChange={(e) => setFixedDays(Number(e.target.value))}
              />
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={60}
                  className={inputCls}
                  value={rangeMin}
                  onChange={(e) => setRangeMin(Number(e.target.value))}
                />
                <span className="text-on-surface-variant">~</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  className={inputCls}
                  value={rangeMax}
                  onChange={(e) => setRangeMax(Number(e.target.value))}
                />
                <span className="text-label-md text-on-surface-variant">天</span>
              </div>
            )}
          </div>
        )}

        <FormDivider />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="departure_time"
              className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
              checked={useDeparture}
              onChange={(e) => setUseDeparture(e.target.checked)}
            />
            <label htmlFor="departure_time" className="text-label-md text-on-surface">
              去程出發時間
            </label>
          </div>
          <div className="space-y-3">
            <div className="min-w-0">
              <label className="mb-1 block text-label-sm text-on-surface-variant">從</label>
              <input
                type="time"
                className={timePickerCls}
                value={depStart}
                disabled={!useDeparture}
                onChange={(e) => setDepStart(e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-label-sm text-on-surface-variant">至</label>
              <input
                type="time"
                className={timePickerCls}
                value={depEnd}
                disabled={!useDeparture}
                onChange={(e) => setDepEnd(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="arrival_time"
              className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
              checked={useArrival}
              onChange={(e) => setUseArrival(e.target.checked)}
            />
            <label htmlFor="arrival_time" className="text-label-md text-on-surface">
              返程出發時間
            </label>
          </div>
          <div className="space-y-3">
            <div className="min-w-0">
              <label className="mb-1 block text-label-sm text-on-surface-variant">從</label>
              <input
                type="time"
                className={timePickerCls}
                value={arrStart}
                disabled={!useArrival}
                onChange={(e) => setArrStart(e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-label-sm text-on-surface-variant">至</label>
              <input
                type="time"
                className={timePickerCls}
                value={arrEnd}
                disabled={!useArrival}
                onChange={(e) => setArrEnd(e.target.value)}
              />
            </div>
          </div>
        </div>

        <FormDivider />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>人數</label>
            <input
              type="number"
              min={1}
              max={9}
              className={inputCls}
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>幣別</label>
            <select className={`${inputCls} appearance-none`} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
              checked={nonStop}
              onChange={(e) => setNonStop(e.target.checked)}
            />
            <span className="text-label-md text-on-surface">僅直飛</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
              checked={bagRequired}
              onChange={(e) => setBagRequired(e.target.checked)}
            />
            <span className="text-label-md text-on-surface">含託運行李</span>
          </label>
        </div>

        {bagRequired && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              className={inputCls}
              value={bagKg}
              onChange={(e) => setBagKg(Number(e.target.value))}
            />
            <span className="text-label-md text-on-surface-variant">公斤（以上）</span>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-error-container px-4 py-3 text-label-md text-on-error-container">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-body-lg font-bold text-on-primary shadow-primary transition-all hover:shadow-primary/40 active:scale-95 disabled:opacity-50"
        >
          <Icon name="rocket_launch" className="text-xl" />
          {submitting ? "建立中…" : "開始追蹤"}
        </button>
      </form>
    </div>
  );
}
