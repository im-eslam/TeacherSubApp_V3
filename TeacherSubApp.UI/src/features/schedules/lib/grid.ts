import type { WeeklyScheduleReadDto } from "../types";

export function scheduleCoordinateKey(dayOfWeek: number, periodNumber: number) {
  return `${dayOfWeek}-${periodNumber}`;
}

export function indexSlotsByCoordinate(slots: WeeklyScheduleReadDto[]) {
  const indexed = new Map<string, WeeklyScheduleReadDto[]>();
  for (const slot of slots) {
    const key = scheduleCoordinateKey(slot.dayOfWeek, slot.periodNumber);
    const current = indexed.get(key) ?? [];
    current.push(slot);
    indexed.set(key, current);
  }
  return indexed;
}
