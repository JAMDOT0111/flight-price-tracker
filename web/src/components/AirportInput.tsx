import { useEffect, useRef, useState } from "react";
import { type Airport, searchAirports } from "../data/airports.js";

interface Props {
  value: string;
  onChange: (iata: string) => void;
  placeholder?: string;
  id?: string;
}

export default function AirportInput({ value, onChange, placeholder, id }: Props) {
  const [inputText, setInputText] = useState(value);
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 外部 value 變動時同步顯示文字
  useEffect(() => {
    setInputText(value);
  }, [value]);

  // 點擊外部關閉下拉
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // 失去焦點時：若非合法 IATA，重設回目前 value
        setInputText(value);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [value]);

  function handleChange(text: string) {
    setInputText(text);
    setActiveIdx(-1);
    const results = searchAirports(text);
    setSuggestions(results);
    setOpen(results.length > 0);

    // 直接輸入合法 3 碼 IATA 立即更新（大寫）
    const upper = text.trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(upper)) {
      onChange(upper);
    }
  }

  function selectAirport(airport: Airport) {
    onChange(airport.iata);
    setInputText(airport.iata);
    setSuggestions([]);
    setOpen(false);
    setActiveIdx(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        selectAirport(suggestions[activeIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setInputText(value);
    }
  }

  function handleFocus() {
    if (inputText === value && value.length === 3) {
      // 聚焦時若顯示 IATA，清空讓使用者重新輸入
      setInputText("");
    }
    const results = searchAirports(inputText);
    setSuggestions(results);
    if (results.length > 0) setOpen(true);
  }

  // 取得目前 IATA 對應的機場名稱（作為 hint）
  const matchedAirport = value.length === 3
    ? searchAirports(value, 1).find((a) => a.iata === value.toUpperCase())
    : null;

  const inputCls =
    "w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface outline-none ring-0 transition-all placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        className={inputCls}
        value={inputText}
        placeholder={placeholder ?? "TPE 或 台北"}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck={false}
      />

      {/* 目前選定機場提示 */}
      {matchedAirport && !open && (
        <p className="mt-0.5 truncate text-label-xs text-on-surface-variant/70">
          {matchedAirport.nameZh} · {matchedAirport.country}
        </p>
      )}

      {/* 下拉建議 */}
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest py-1 shadow-lg"
        >
          {suggestions.map((a, idx) => (
            <li
              key={a.iata}
              role="option"
              aria-selected={idx === activeIdx}
              onMouseDown={(e) => { e.preventDefault(); selectAirport(a); }}
              onMouseEnter={() => setActiveIdx(idx)}
              className={`flex cursor-pointer items-start gap-3 px-3 py-2 text-sm transition-colors ${
                idx === activeIdx ? "bg-primary/10 text-on-surface" : "text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="mt-0.5 shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-label-sm font-bold text-primary">
                {a.iata}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{a.nameZh}</span>
                <span className="block truncate text-on-surface-variant/70 text-label-xs">
                  {a.city} · {a.country}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
