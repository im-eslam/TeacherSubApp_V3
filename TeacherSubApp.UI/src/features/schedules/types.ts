import type { ApiError } from "../../lib/apiClient";

// ════════════════════════════════════════════════════════════
// Read models
// ════════════════════════════════════════════════════════════

export interface WeeklyScheduleReadDto {
  id: number;
  teacherId: number;
  teacherName: string;
  teacherSubjectId: number | null;
  teacherSubjectName: string | null;
  dayOfWeek: number;
  dayOfWeekName: string;
  periodNumber: number;
  classId: number | null;
  classDisplayName: string | null;
  eventId: number | null;
  eventName: string | null;
  eventIsSupport: boolean;
  eventIsStandby: boolean;
  isEmpty: boolean;
}

export interface WeeklyScheduleGridDto {
  filteredTeacherId: number | null;
  filteredClassId: number | null;
  slots: WeeklyScheduleReadDto[];
}

// ════════════════════════════════════════════════════════════
// Query
// ════════════════════════════════════════════════════════════

export interface WeeklyScheduleQuery {
  teacherId?: number;
  classId?: number;
  eventId?: number;
  dayOfWeek?: number;
  periodNumber?: number;
}

// ════════════════════════════════════════════════════════════
// Write models (wire shape sent to the backend)
// ════════════════════════════════════════════════════════════

export interface WeeklyScheduleAddDto {
  teacherId: number;
  dayOfWeek: number;
  periodNumber: number;
  classId: number | null;
  eventId: number | null;
}

export interface WeeklyScheduleEditDto {
  id: number;
  classId: number | null;
  eventId: number | null;
}

export interface WeeklyScheduleSwapDto {
  scheduleIdA: number;
  scheduleIdB: number;
}

export interface WeeklyScheduleBulkUpdateDto {
  adds: WeeklyScheduleAddDto[];
  edits: WeeklyScheduleEditDto[];
  deletes: number[];
  swaps: WeeklyScheduleSwapDto[];
}

export const EMPTY_BULK_UPDATE_DTO: WeeklyScheduleBulkUpdateDto = {
  adds: [],
  edits: [],
  deletes: [],
  swaps: [],
};

// ════════════════════════════════════════════════════════════
// Bulk error response 
// ════════════════════════════════════════════════════════════

export interface BulkErrorResponse extends ApiError {
  detailedErrors: ApiError[];
}

export const isBulkErrorResponse = (
  value: unknown,
): value is BulkErrorResponse => {
  return (
    typeof value === "object" &&
    value !== null &&
    "errorCode" in value &&
    "detailedErrors" in value &&
    Array.isArray((value as BulkErrorResponse).detailedErrors)
  );
};

// ════════════════════════════════════════════════════════════
// Draft rows — ONE self-contained shape per staged change.
// ════════════════════════════════════════════════════════════

export interface SlotContentInfo {
  classId: number | null;
  classDisplayName: string | null;
  eventId: number | null;
  eventName: string | null;
}

export interface SlotCoord {
  teacherId: number;
  teacherName: string;
  dayOfWeek: number;
  periodNumber: number;
}

export interface DraftRowAdd extends SlotCoord {
  key: string;
  type: "add";
  content: SlotContentInfo;
}

export interface DraftRowEdit extends SlotCoord {
  key: string;
  type: "edit";
  slotId: number;
  before: SlotContentInfo;
  content: SlotContentInfo;
}

export interface DraftRowDelete extends SlotCoord {
  key: string;
  type: "delete";
  slotId: number;
  before: SlotContentInfo;
}

export interface DraftRowSwap {
  key: string;
  type: "swap";
  slotIdA: number;
  slotIdB: number;
  a: SlotCoord & { content: SlotContentInfo };
  b: SlotCoord & { content: SlotContentInfo };
}

export type DraftRow =
  | DraftRowAdd
  | DraftRowEdit
  | DraftRowDelete
  | DraftRowSwap;

export type NewDraftRowAdd = Omit<DraftRowAdd, "key">;
export type NewDraftRowEdit = Omit<DraftRowEdit, "key">;
export type NewDraftRowDelete = Omit<DraftRowDelete, "key">;
export type NewDraftRowSwap = Omit<DraftRowSwap, "key">;
export type NewDraftRow =
  | NewDraftRowAdd
  | NewDraftRowEdit
  | NewDraftRowDelete
  | NewDraftRowSwap;

export type DraftRowMap = Record<string, DraftRow>;
