// ════════════════════════════════════════════════════════════
// Schedule matrix constants
// ════════════════════════════════════════════════════════════

export interface DayOption {
  value: number;
  label: string;
}

export const DAYS: DayOption[] = [
  { value: 1, label: "الأحد" },
  { value: 2, label: "الاثنين" },
  { value: 3, label: "الثلاثاء" },
  { value: 4, label: "الأربعاء" },
  { value: 5, label: "الخميس" },
];

export const PERIODS: number[] = [1, 2, 3, 4, 5, 6, 7];

export function dayLabel(day: number): string {
  return DAYS.find((d) => d.value === day)?.label ?? `يوم ${day}`;
}

// ════════════════════════════════════════════════════════════
// Event palette 
// ════════════════════════════════════════════════════════════

interface EventPaletteColor {
  bg: string;
  text: string;
  border: string;
}

const EVENT_PALETTE: EventPaletteColor[] = [
  { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  { bg: "bg-violet-50", text: "text-violet-800", border: "border-violet-200" },
  { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
  { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200" },
  { bg: "bg-fuchsia-50", text: "text-fuchsia-800", border: "border-fuchsia-200" },
  { bg: "bg-lime-50", text: "text-lime-800", border: "border-lime-200" },
  { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
  { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" },
  { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200" },
  { bg: "bg-pink-50", text: "text-pink-800", border: "border-pink-200" },
];

export function eventColor(eventId: number): EventPaletteColor {
  const index = ((eventId % EVENT_PALETTE.length) + EVENT_PALETTE.length) % EVENT_PALETTE.length;
  return EVENT_PALETTE[index];
}
