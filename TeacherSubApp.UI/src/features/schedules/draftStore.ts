import { create } from "zustand";
import type {
  SlotCoordinate,
  WeeklyScheduleBulkEditRequest,
  WeeklyScheduleReadDto,
} from "./types";

export type DraftOperationKind = "add" | "edit" | "swap" | "delete";

export interface DraftAdd {
  kind: "add";
  draftId: string;
  teacherId: number;
  teacherName: string;
  dayOfWeek: number;
  periodNumber: number;
  classId: number | null;
  className: string | null;
  eventId: number | null;
  eventName: string | null;
}

export interface DraftEdit {
  kind: "edit";
  draftId: string;
  targetId: number;
  teacherId: number;
  teacherName: string;
  dayOfWeek: number;
  periodNumber: number;
  classId: number | null;
  className: string | null;
  eventId: number | null;
  eventName: string | null;
}

export interface DraftSwapSlotInfo {
  teacherId: number;
  teacherName: string;
  dayOfWeek: number;
  periodNumber: number;
  classDisplayName: string | null;
  eventName: string | null;
  eventId: number | null;
}

export interface DraftSwap {
  kind: "swap";
  draftId: string;
  slotA: SlotCoordinate;
  slotAInfo: DraftSwapSlotInfo;
  slotB: SlotCoordinate;
  slotBInfo: DraftSwapSlotInfo;
}

export interface DraftDelete {
  kind: "delete";
  draftId: string;
  targetId: number;
  summaryLabel: string;
}

export type DraftOperation = DraftAdd | DraftEdit | DraftSwap | DraftDelete;

// ── Coordinate helpers ──

function coordKey(teacherId: number, dayOfWeek: number, periodNumber: number) {
  return `${teacherId}-${dayOfWeek}-${periodNumber}`;
}

function occupiedCoords(op: DraftOperation): string[] {
  switch (op.kind) {
    case "add":
      return [coordKey(op.teacherId, op.dayOfWeek, op.periodNumber)];
    case "edit":
      return [coordKey(op.teacherId, op.dayOfWeek, op.periodNumber)];
    case "swap":
      return [
        coordKey(op.slotA.TeacherId, op.slotA.DayOfWeek, op.slotA.PeriodNumber),
        coordKey(op.slotB.TeacherId, op.slotB.DayOfWeek, op.slotB.PeriodNumber),
      ];
    case "delete":
      return [];
  }
}

// ════════════════════════════════════════════════════════════
// Store
// ════════════════════════════════════════════════════════════

export type WizardStep = 1 | 2 | 3;

interface ScheduleDraftState {
  isOpen: boolean;
  step: WizardStep;
  activeOperation: DraftOperationKind | null;
  editingDraftId: string | null;
  operations: DraftOperation[];

  open: () => void;
  close: () => void;
  reset: () => void;

  goToStep1: () => void;
  chooseOperation: (kind: DraftOperationKind) => void;

  commitOperation: (op: DraftOperation) => { success: boolean; reason?: string };

  editStagedOperation: (draftId: string) => void;
  removeStagedOperation: (draftId: string) => void;

  toRequest: () => WeeklyScheduleBulkEditRequest;
}

const INITIAL_STATE = {
  isOpen: false,
  step: 1 as WizardStep,
  activeOperation: null,
  editingDraftId: null,
  operations: [] as DraftOperation[],
};

let draftIdCounter = 0;
export function nextDraftId(): string {
  draftIdCounter += 1;
  return `draft-${draftIdCounter}`;
}

export const useScheduleDraftStore = create<ScheduleDraftState>((set, get) => ({
  ...INITIAL_STATE,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  reset: () => set({ ...INITIAL_STATE }),

  goToStep1: () =>
    set({ step: 1, activeOperation: null, editingDraftId: null }),

  chooseOperation: (kind) => set({ step: 2, activeOperation: kind }),

  commitOperation: (op) => {
    const { operations, editingDraftId } = get();

    const others = editingDraftId
      ? operations.filter((o) => o.draftId !== editingDraftId)
      : operations;

    const newCoords = new Set(occupiedCoords(op));
    if (newCoords.size > 0) {
      const conflict = others.some((existing) =>
        occupiedCoords(existing).some((c) => newCoords.has(c)),
      );
      if (conflict) {
        return {
          success: false,
          reason:
            "توجد بالفعل عملية أخرى مسودة على نفس الحصة (نفس المعلم/اليوم/الحصة).",
        };
      }
    }

    set({
      operations: [...others, op],
      step: 3,
      activeOperation: null,
      editingDraftId: null,
    });
    return { success: true };
  },

  editStagedOperation: (draftId) => {
    const op = get().operations.find((o) => o.draftId === draftId);
    if (!op) return;
    set({ step: 2, activeOperation: op.kind, editingDraftId: draftId });
  },

  removeStagedOperation: (draftId) =>
    set((state) => ({
      operations: state.operations.filter((o) => o.draftId !== draftId),
    })),

  toRequest: () => {
    const { operations } = get();

    const request: WeeklyScheduleBulkEditRequest = {
      Creates: [],
      Updates: [],
      Deletes: [],
      Swaps: [],
    };

    for (const op of operations) {
      if (op.kind === "add") {
        request.Creates.push({
          TeacherId: op.teacherId,
          DayOfWeek: op.dayOfWeek,
          PeriodNumber: op.periodNumber,
          ClassId: op.classId,
          EventId: op.eventId,
        });
      } else if (op.kind === "edit") {
        request.Updates.push({
          Id: op.targetId,
          Payload: {
            TeacherId: op.teacherId,
            DayOfWeek: op.dayOfWeek,
            PeriodNumber: op.periodNumber,
            ClassId: op.classId,
            EventId: op.eventId,
          },
        });
      } else if (op.kind === "swap") {
        request.Swaps.push({ SlotA: op.slotA, SlotB: op.slotB });
      } else if (op.kind === "delete") {
        request.Deletes.push(op.targetId);
      }
    }

    return request;
  },
}));

export function slotToCoordinate(slot: WeeklyScheduleReadDto): SlotCoordinate {
  return {
    TeacherId: slot.teacherId,
    DayOfWeek: slot.dayOfWeek,
    PeriodNumber: slot.periodNumber,
  };
}
