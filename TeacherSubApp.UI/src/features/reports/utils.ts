import {
  formatDateAsDayMonthYear,
  getTodayIsoDate,
  toIsoDate,
} from "../substitutions/dateUtils";
import type { ReportDateRange } from "./types";

export const MAX_REPORT_RANGE_DAYS = 366;

/** Maps JavaScript Sunday=0..Thursday=4 to the API's Sunday=1..Thursday=5. */
export function mapJavaScriptDayToBackendDay(date: Date): number | null {
  const day = date.getDay();
  return day >= 0 && day <= 4 ? day + 1 : null;
}

export function formatPercent(fraction: number): string {
  if (!Number.isFinite(fraction)) return "—";
  return `${(fraction * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

export function formatWeekRangeLabel(
  weekStart: string,
  weekEnd: string,
): string {
  return `${formatDateAsDayMonthYear(weekStart)} — ${formatDateAsDayMonthYear(weekEnd)}`;
}

export function getCurrentWeekRange(): ReportDateRange {
  const todayIso = getTodayIsoDate();
  const today = new Date(`${todayIso}T12:00:00`);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    from: toIsoDate(weekStart),
    to: toIsoDate(weekEnd),
  };
}

export function getDaySpanInclusive(from: string, to: string): number | null {
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function getRangeError(range: ReportDateRange): string | null {
  if (!range.from || !range.to) return "اختر تاريخ البداية والنهاية";
  const span = getDaySpanInclusive(range.from, range.to);
  if (span === null || span < 1) return "يجب أن يسبق تاريخ البداية تاريخ النهاية أو يساويه";
  if (span > MAX_REPORT_RANGE_DAYS) {
    return "لا يمكن أن يتجاوز النطاق الزمني 366 يومًا";
  }
  return null;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ar-EG").format(value);
}
