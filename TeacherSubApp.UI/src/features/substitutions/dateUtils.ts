const BACKEND_DAY_BY_JAVASCRIPT_DAY: Record<number, number> = {
  0: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
};

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayIsoDate(): string {
  return toIsoDate(new Date());
}

/**
 * The API represents Sunday through Thursday as 1 through 5.
 * Friday and Saturday are outside the school week and are rejected explicitly.
 */
export function toBackendDayOfWeek(date: Date): number {
  const backendDay = BACKEND_DAY_BY_JAVASCRIPT_DAY[date.getDay()];
  if (!backendDay) {
    throw new Error("لا توجد حصص مدرسية مجدولة في عطلة نهاية الأسبوع");
  }
  return backendDay;
}

export function getBackendDayOfWeekOrNull(date: Date): number | null {
  return BACKEND_DAY_BY_JAVASCRIPT_DAY[date.getDay()] ?? null;
}

export function isWeekendIsoDate(serviceDate: string): boolean {
  const day = new Date(`${serviceDate}T12:00:00`).getDay();
  return day === 5 || day === 6;
}

export function formatLongArabicDate(serviceDate: string): string {
  return new Date(`${serviceDate}T12:00:00`).toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
