export interface WeeklyScheduleReadDto {
  id: number;
  teacherId: number;
  teacherName: string;
  subjectName: string | null;
  dayOfWeek: number; 
  periodNumber: number;
  classId: number | null;
  classDisplayName: string | null;
  eventId: number | null;
  eventName: string | null;
}

export interface WeeklyScheduleWriteDto {
  teacherId: number;
  dayOfWeek: number;
  periodNumber: number;
  classId: number | null;
  eventId: number | null;
}

export interface WeeklyScheduleQuery {
  teacherId?: number;
  classId?: number;
  eventId?: number;
  dayOfWeek?: number;
  periodNumber?: number;
}

// ── Bulk edit payload ──

export interface SlotCoordinate {
  TeacherId: number;
  DayOfWeek: number;
  PeriodNumber: number;
}

export interface WeeklyScheduleWritePayload {
  TeacherId: number;
  DayOfWeek: number;
  PeriodNumber: number;
  ClassId: number | null;
  EventId: number | null;
}

export interface WeeklyScheduleUpdateEntry {
  Id: number;
  Payload: WeeklyScheduleWritePayload;
}

export interface WeeklyScheduleSwapEntry {
  SlotA: SlotCoordinate;
  SlotB: SlotCoordinate;
}

export interface WeeklyScheduleBulkEditRequest {
  Creates: WeeklyScheduleWritePayload[];
  Updates: WeeklyScheduleUpdateEntry[];
  Deletes: number[];
  Swaps: WeeklyScheduleSwapEntry[];
}

// ── View mode ──

export type ScheduleViewMode = "teacher" | "class";
