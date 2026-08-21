import type { WeeklyScheduleReadDto } from "../types";

const DAY_NAMES: Record<number, string> = {
  1: "الأحد",
  2: "الاثنين",
  3: "الثلاثاء",
  4: "الأربعاء",
  5: "الخميس",
};

export function dayName(day: number): string {
  return DAY_NAMES[day] ?? `يوم ${day}`;
}

export function slotLabel(
  teacherName: string,
  dayOfWeek: number,
  periodNumber: number,
): string {
  return `${teacherName} — ${dayName(dayOfWeek)}، الحصة ${periodNumber}`;
}

export function contentLabel(
  content: Pick<WeeklyScheduleReadDto, "classDisplayName" | "eventName">,
): string {
  const parts = [content.classDisplayName, content.eventName].filter(
    (value): value is string => value !== null && value.trim() !== "",
  );

  return parts.length > 0 ? parts.join(" + ") : "— فارغة —";
}

export const DAYS = [
  { value: 1, label: DAY_NAMES[1] },
  { value: 2, label: DAY_NAMES[2] },
  { value: 3, label: DAY_NAMES[3] },
  { value: 4, label: DAY_NAMES[4] },
  { value: 5, label: DAY_NAMES[5] },
] as const;

export const PERIODS = [1, 2, 3, 4, 5, 6, 7] as const;
