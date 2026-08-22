import type { ScheduleDraft } from "../types";
import type { WeeklyScheduleReadDto } from "../types";

function coordinateKey(coordinate: {
  TeacherId: number;
  DayOfWeek: number;
  PeriodNumber: number;
}) {
  return `${coordinate.TeacherId}:${coordinate.DayOfWeek}:${coordinate.PeriodNumber}`;
}

function slotCoordinate(slot: WeeklyScheduleReadDto) {
  return {
    TeacherId: slot.teacherId,
    DayOfWeek: slot.dayOfWeek,
    PeriodNumber: slot.periodNumber,
  };
}

export function isScheduleDraftValid(
  draft: ScheduleDraft,
  slots: WeeklyScheduleReadDto[],
) {
  if (draft.operation === "add") {
    return (
      draft.teacherId !== null &&
      draft.dayOfWeek !== null &&
      draft.dayOfWeek >= 1 &&
      draft.dayOfWeek <= 5 &&
      draft.periodNumber !== null &&
      draft.periodNumber >= 1 &&
      draft.periodNumber <= 7 &&
      (draft.classId !== null || draft.eventId !== null)
    );
  }

  if (draft.operation === "edit") {
    return (
      draft.targetSlotId !== null &&
      slots.some((slot) => slot.id === draft.targetSlotId) &&
      draft.teacherId !== null &&
      draft.dayOfWeek !== null &&
      draft.dayOfWeek >= 1 &&
      draft.dayOfWeek <= 5 &&
      draft.periodNumber !== null &&
      draft.periodNumber >= 1 &&
      draft.periodNumber <= 7 &&
      (draft.classId !== null || draft.eventId !== null)
    );
  }

  if (draft.operation === "delete") {
    return draft.targetSlotId !== null && slots.some((slot) => slot.id === draft.targetSlotId);
  }

  const { slotA, slotB } = draft;
  if (slotA === null || slotB === null) return false;
  return (
    coordinateKey(slotA) !== coordinateKey(slotB) &&
    slots.some((slot) => coordinateKey(slotCoordinate(slot)) === coordinateKey(slotA)) &&
    slots.some((slot) => coordinateKey(slotCoordinate(slot)) === coordinateKey(slotB))
  );
}
