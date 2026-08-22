export interface WeeklyScheduleReadDto {
  id: number;
  teacherId: number;
  teacherName: string;
  dayOfWeek: number;
  periodNumber: number;
  classId: number | null;
  classDisplayName: string | null;
  eventId: number | null;
  eventName: string | null;
}

export interface WeeklyScheduleQuery {
  teacherId?: number;
  classId?: number;
  eventId?: number;
  dayOfWeek?: number;
  periodNumber?: number;
}

export interface WeeklyScheduleWriteDto {
  TeacherId: number;
  DayOfWeek: number;
  PeriodNumber: number;
  ClassId: number | null;
  EventId: number | null;
}

export interface WeeklyScheduleUpdateEntry {
  Id: number;
  Payload: WeeklyScheduleWriteDto;
}

export interface SlotCoordinate {
  TeacherId: number;
  DayOfWeek: number;
  PeriodNumber: number;
}

export interface WeeklyScheduleSwapEntry {
  SlotA: SlotCoordinate;
  SlotB: SlotCoordinate;
}

export interface WeeklyScheduleBulkEditRequest {
  Creates: WeeklyScheduleWriteDto[];
  Updates: WeeklyScheduleUpdateEntry[];
  Deletes: number[];
  Swaps: WeeklyScheduleSwapEntry[];
}

export type ScheduleEditOperation = "add" | "edit" | "swap" | "delete";

export type ScheduleWizardStep = "operation" | "details" | "review";

export interface ScheduleDraftAdd {
  id: string;
  operation: "add";
  teacherId: number | null;
  dayOfWeek: number | null;
  periodNumber: number | null;
  classId: number | null;
  eventId: number | null;
}

export interface ScheduleDraftEdit {
  id: string;
  operation: "edit";
  targetSlotId: number | null;
  teacherId: number | null;
  dayOfWeek: number | null;
  periodNumber: number | null;
  classId: number | null;
  eventId: number | null;
}

export interface ScheduleDraftSwap {
  id: string;
  operation: "swap";
  slotA: SlotCoordinate | null;
  slotB: SlotCoordinate | null;
}

export interface ScheduleDraftDelete {
  id: string;
  operation: "delete";
  targetSlotId: number | null;
}

export type ScheduleDraft =
  | ScheduleDraftAdd
  | ScheduleDraftEdit
  | ScheduleDraftSwap
  | ScheduleDraftDelete;
