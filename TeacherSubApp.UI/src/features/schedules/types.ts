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
  teacherId: number;
  dayOfWeek: number;
  periodNumber: number;
  classId: number | null;
  eventId: number | null;
}

export interface WeeklyScheduleUpdateEntry {
  id: number;
  payload: WeeklyScheduleWriteDto;
}

export interface SlotCoordinate {
  teacherId: number;
  dayOfWeek: number;
  periodNumber: number;
}

export interface WeeklyScheduleSwapEntry {
  slotA: SlotCoordinate;
  slotB: SlotCoordinate;
}

export interface WeeklyScheduleBulkEditRequest {
  creates: WeeklyScheduleWriteDto[];
  updates: WeeklyScheduleUpdateEntry[];
  deletes: number[];
  swaps: WeeklyScheduleSwapEntry[];
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
