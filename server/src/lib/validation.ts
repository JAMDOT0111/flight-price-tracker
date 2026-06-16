import { z } from "zod";
import type { TrackedSearchInput } from "@flight-tracker/shared";

const iata = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "需為 3 碼 IATA 機場/城市代碼");

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期需為 YYYY-MM-DD")
  .refine((s) => !Number.isNaN(Date.parse(s)), "日期無效");

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "時刻需為 HH:mm");

const timeWindow = z
  .object({ start: hhmm, end: hhmm })
  .refine((w) => w.start <= w.end, { message: "時間窗起需早於迄" });

const checkedBaggage = z.object({
  required: z.boolean(),
  minKg: z.number().int().positive().max(100).nullable(),
});

export const trackedSearchInputSchema = z
  .object({
    origin: iata,
    destination: iata,
    tripType: z.enum(["oneway", "roundtrip"]),
    dateRangeStart: dateStr,
    dateRangeEnd: dateStr,
    durationMode: z.enum(["fixed", "range"]),
    durationMin: z.number().int().min(1).max(60),
    durationMax: z.number().int().min(1).max(60),
    departureWindow: timeWindow.nullable().default(null),
    arrivalWindow: timeWindow.nullable().default(null),
    passengers: z.number().int().min(1).max(9),
    nonStop: z.boolean(),
    checkedBaggage,
    currency: z.string().trim().toUpperCase().length(3),
    tag: z.string().max(20).default(""),
  })
  .refine((v) => v.dateRangeStart <= v.dateRangeEnd, {
    message: "區間起需早於或等於迄",
    path: ["dateRangeEnd"],
  })
  .refine((v) => v.durationMin <= v.durationMax, {
    message: "最小天數需小於或等於最大天數",
    path: ["durationMax"],
  })
  .refine((v) => v.origin !== v.destination, {
    message: "出發地與目的地不可相同",
    path: ["destination"],
  });

export type ValidatedTrackedSearchInput = z.infer<typeof trackedSearchInputSchema>;

// 確保 zod 輸出與共用型別相容（編譯期檢查）
const _typecheck: TrackedSearchInput = {} as ValidatedTrackedSearchInput;
void _typecheck;
