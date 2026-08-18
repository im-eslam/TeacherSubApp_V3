import type { SlotContentInfo } from "../types";

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

export function contentLabel(content: SlotContentInfo): string {
  const parts: string[] = [];
  if (content.classId !== null) {
    parts.push(content.classDisplayName ?? `فصل #${content.classId}`);
  }
  if (content.eventId !== null) {
    parts.push(content.eventName ?? `حدث #${content.eventId}`);
  }
  return parts.length > 0 ? parts.join(" + ") : "— فارغة —";
}
