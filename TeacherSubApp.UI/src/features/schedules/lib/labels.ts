import type { WeeklyScheduleReadDto } from "../types";

export const DAYS = [
  { value: 1, label: "الأحد" },
  { value: 2, label: "الاثنين" },
  { value: 3, label: "الثلاثاء" },
  { value: 4, label: "الأربعاء" },
  { value: 5, label: "الخميس" },
] as const;

export const PERIODS = [1, 2, 3, 4, 5, 6, 7] as const;

export function dayName(dayOfWeek: number) {
  return DAYS.find((day) => day.value === dayOfWeek)?.label ?? `يوم ${dayOfWeek}`;
}

export function slotLabel(
  teacherName: string,
  dayOfWeek: number,
  periodNumber: number,
) {
  return `${teacherName} — ${dayName(dayOfWeek)}، الحصة ${periodNumber}`;
}

export function contentLabel(
  slot: Pick<WeeklyScheduleReadDto, "classDisplayName" | "eventName">,
) {
  if (slot.classDisplayName && slot.eventName) {
    return `${slot.classDisplayName} — ${slot.eventName}`;
  }
  return slot.classDisplayName ?? slot.eventName ?? "بدون محتوى";
}
