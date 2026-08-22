import { DAYS, PERIODS } from "./labels";
import type { WeeklyScheduleReadDto } from "../types";

export type ScheduleGridMatrix = WeeklyScheduleReadDto[][][];

export function scheduleCoordinateKey(dayOfWeek: number, periodNumber: number) {
  return `${dayOfWeek}-${periodNumber}`;
}

export function buildScheduleMatrix(
  slots: WeeklyScheduleReadDto[],
): ScheduleGridMatrix {
  const matrix: ScheduleGridMatrix = DAYS.map(() =>
    PERIODS.map(() => [] as WeeklyScheduleReadDto[]),
  );

  for (const slot of slots) {
    const dayIndex = DAYS.findIndex((day) => day.value === slot.dayOfWeek);
    const periodIndex = PERIODS.findIndex((period) => period === slot.periodNumber);

    if (dayIndex < 0 || periodIndex < 0) continue;
    matrix[dayIndex][periodIndex].push(slot);
  }

  return matrix;
}
