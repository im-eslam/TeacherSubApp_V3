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

export const EMPTY_WEEKLY_SCHEDULE_BULK_EDIT: WeeklyScheduleBulkEditRequest = {
  creates: [],
  updates: [],
  deletes: [],
  swaps: [],
};

export interface ScheduleCell {
  coordinate: SlotCoordinate;
  slot: WeeklyScheduleReadDto | null;
}

export interface ScheduleGridRow {
  teacherId: number;
  teacherName: string;
  cells: ScheduleCell[];
}

export type ScheduleEditorContent = Pick<
  WeeklyScheduleWriteDto,
  "classId" | "eventId"
>;

export interface ScheduleEditorState {
  coordinate: SlotCoordinate;
  slot: WeeklyScheduleReadDto | null;
  content: ScheduleEditorContent;
}

export type ScheduleEditMode = "create" | "update" | "delete" | "swap";

export interface ScheduleDraftRow {
  id: string;
  mode: ScheduleEditMode;
  slotId: string;
  teacherId: string;
  dayOfWeek: string;
  periodNumber: string;
  classId: string;
  eventId: string;
  targetTeacherId: string;
  targetDayOfWeek: string;
  targetPeriodNumber: string;
}
