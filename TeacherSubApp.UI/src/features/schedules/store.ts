import { create } from "zustand";
import type {
  ScheduleDraft,
  ScheduleDraftAdd,
  ScheduleDraftDelete,
  ScheduleDraftEdit,
  ScheduleDraftSwap,
  ScheduleEditOperation,
  ScheduleWizardStep,
  SlotCoordinate,
  WeeklyScheduleBulkEditRequest,
  WeeklyScheduleReadDto,
} from "./types";

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function createDraft(operation: ScheduleEditOperation): ScheduleDraft {
  switch (operation) {
    case "add":
      return {
        id: createId(),
        operation,
        teacherId: null,
        dayOfWeek: null,
        periodNumber: null,
        classId: null,
        eventId: null,
      } satisfies ScheduleDraftAdd;
    case "edit":
      return {
        id: createId(),
        operation,
        targetSlotId: null,
        teacherId: null,
        dayOfWeek: null,
        periodNumber: null,
        classId: null,
        eventId: null,
      } satisfies ScheduleDraftEdit;
    case "swap":
      return { id: createId(), operation, slotA: null, slotB: null } satisfies ScheduleDraftSwap;
    case "delete":
      return { id: createId(), operation, targetSlotId: null } satisfies ScheduleDraftDelete;
  }
}

export function coordinateKey(coordinate: SlotCoordinate) {
  return `${coordinate.teacherId}:${coordinate.dayOfWeek}:${coordinate.periodNumber}`;
}

export function slotCoordinate(slot: WeeklyScheduleReadDto): SlotCoordinate {
  return {
    teacherId: slot.teacherId,
    dayOfWeek: slot.dayOfWeek,
    periodNumber: slot.periodNumber,
  };
}

function draftCoordinates(draft: ScheduleDraft): SlotCoordinate[] {
  if (draft.operation === "add" || draft.operation === "edit") {
    return draft.teacherId !== null &&
      draft.dayOfWeek !== null &&
      draft.periodNumber !== null
      ? [
          {
            teacherId: draft.teacherId,
            dayOfWeek: draft.dayOfWeek,
            periodNumber: draft.periodNumber,
          },
        ]
      : [];
  }
  if (draft.operation === "swap") {
    return [draft.slotA, draft.slotB].filter(
      (value): value is SlotCoordinate => value !== null,
    );
  }
  return [];
}

export function findDraftConflict(
  draft: ScheduleDraft,
  stagedEdits: ScheduleDraft[],
): string | null {
  const keys = draftCoordinates(draft).map(coordinateKey);
  if (new Set(keys).size !== keys.length) {
    return "لا يمكن استخدام الموضع نفسه أكثر من مرة في العملية نفسها.";
  }

  const existingKeys = new Set(
    stagedEdits
      .filter((existing) => existing.id !== draft.id)
      .flatMap(draftCoordinates)
      .map(coordinateKey),
  );
  return keys.find((key) => existingKeys.has(key)) ?? null;
}

export function draftsToBulkRequest(
  drafts: ScheduleDraft[],
): WeeklyScheduleBulkEditRequest {
  const request: WeeklyScheduleBulkEditRequest = {
    creates: [],
    updates: [],
    deletes: [],
    swaps: [],
  };

  for (const draft of drafts) {
    if (draft.operation === "add") {
      if (
        draft.teacherId !== null &&
        draft.dayOfWeek !== null &&
        draft.periodNumber !== null &&
        (draft.classId !== null || draft.eventId !== null)
      ) {
        request.creates.push({
          teacherId: draft.teacherId,
          dayOfWeek: draft.dayOfWeek,
          periodNumber: draft.periodNumber,
          classId: draft.classId,
          eventId: draft.eventId,
        });
      }
      continue;
    }

    if (draft.operation === "edit") {
      if (
        draft.targetSlotId !== null &&
        draft.teacherId !== null &&
        draft.dayOfWeek !== null &&
        draft.periodNumber !== null &&
        (draft.classId !== null || draft.eventId !== null)
      ) {
        request.updates.push({
          id: draft.targetSlotId,
          payload: {
            teacherId: draft.teacherId,
            dayOfWeek: draft.dayOfWeek,
            periodNumber: draft.periodNumber,
            classId: draft.classId,
            eventId: draft.eventId,
          },
        });
      }
      continue;
    }

    if (draft.operation === "delete") {
      if (draft.targetSlotId !== null) request.deletes.push(draft.targetSlotId);
      continue;
    }

    if (draft.slotA !== null && draft.slotB !== null) {
      request.swaps.push({ slotA: draft.slotA, slotB: draft.slotB });
    }
  }

  return request;
}

interface ScheduleDraftStore {
  currentOperation: ScheduleEditOperation | null;
  currentDraft: ScheduleDraft | null;
  currentStep: ScheduleWizardStep;
  stagedEdits: ScheduleDraft[];
  startOperation: (operation: ScheduleEditOperation) => void;
  updateCurrentDraft: (patch: Partial<ScheduleDraft>) => void;
  addCurrentToDraft: () => { ok: true } | { ok: false; reason: string };
  editStagedDraft: (id: string) => void;
  removeStagedEdit: (id: string) => void;
  setCurrentStep: (step: ScheduleWizardStep) => void;
  reset: () => void;
}

export const useScheduleDraftStore = create<ScheduleDraftStore>((set, get) => ({
  currentOperation: null,
  currentDraft: null,
  currentStep: "operation",
  stagedEdits: [],
  startOperation: (operation) =>
    set({
      currentOperation: operation,
      currentDraft: createDraft(operation),
      currentStep: "details",
    }),
  updateCurrentDraft: (patch) =>
    set((state) =>
      state.currentDraft
        ? { currentDraft: { ...state.currentDraft, ...patch } as ScheduleDraft }
        : state,
    ),
  addCurrentToDraft: () => {
    const { currentDraft, stagedEdits } = get();
    if (!currentDraft) return { ok: false, reason: "لا توجد عملية لإضافتها." };
    const conflict = findDraftConflict(currentDraft, stagedEdits);
    if (conflict) {
      return {
        ok: false,
        reason: "يوجد تعديل آخر يستخدم الموضع نفسه. غيّر الموضع قبل المتابعة.",
      };
    }
    set({
      stagedEdits: [...stagedEdits, currentDraft],
      currentOperation: null,
      currentDraft: null,
      currentStep: "review",
    });
    return { ok: true };
  },
  editStagedDraft: (id) => {
    const draft = get().stagedEdits.find((item) => item.id === id);
    if (!draft) return;
    set({
      currentOperation: draft.operation,
      currentDraft: draft,
      currentStep: "details",
      stagedEdits: get().stagedEdits.filter((item) => item.id !== id),
    });
  },
  removeStagedEdit: (id) =>
    set((state) => ({
      stagedEdits: state.stagedEdits.filter((item) => item.id !== id),
    })),
  setCurrentStep: (step) => set({ currentStep: step }),
  reset: () =>
    set({
      currentOperation: null,
      currentDraft: null,
      currentStep: "operation",
      stagedEdits: [],
    }),
}));
