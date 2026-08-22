import { describe, expect, it } from "vitest";
import {
  buildScheduleQueryString,
  normalizeScheduleRecord,
  toScheduleUpdateEntry,
} from "./api";
import { buildScheduleMatrix } from "./lib/grid";
import { isScheduleDraftValid } from "./lib/validation";
import {
  draftsToBulkRequest,
  findDraftConflict,
  useScheduleDraftStore,
} from "./store";
import type { ScheduleDraft, WeeklyScheduleReadDto } from "./types";

const slots: WeeklyScheduleReadDto[] = [
  {
    id: 11,
    teacherId: 2,
    teacherName: "أحمد علي",
    dayOfWeek: 1,
    periodNumber: 2,
    classId: 4,
    classDisplayName: "الصف الأول",
    eventId: null,
    eventName: null,
  },
  {
    id: 12,
    teacherId: 2,
    teacherName: "أحمد علي",
    dayOfWeek: 3,
    periodNumber: 5,
    classId: null,
    classDisplayName: null,
    eventId: 7,
    eventName: "اجتماع",
  },
];

describe("Weekly Schedule contract helpers", () => {
  it("normalizes the backend response casing into the canonical read model", () => {
    expect(
      normalizeScheduleRecord({
        Id: 11,
        TeacherId: 2,
        TeacherName: "أحمد علي",
        DayOfWeek: 1,
        PeriodNumber: 2,
        ClassId: 4,
        ClassDisplayName: "الصف الأول",
        EventId: null,
        EventName: null,
      }),
    ).toEqual(slots[0]);
    expect(normalizeScheduleRecord(slots[1])).toEqual(slots[1]);
  });

  it("serializes all supported backend query parameters", () => {
    expect(
      buildScheduleQueryString({
        teacherId: 2,
        classId: 4,
        eventId: 7,
        dayOfWeek: 3,
        periodNumber: 5,
      }),
    ).toBe("?TeacherId=2&ClassId=4&EventId=7&DayOfWeek=3&PeriodNumber=5");
  });

  it("uses the exact Swagger update entry member names", () => {
    expect(
      toScheduleUpdateEntry(11, {
        teacherId: 2,
        dayOfWeek: 1,
        periodNumber: 2,
        classId: 4,
        eventId: null,
      }),
    ).toEqual({
      id: 11,
      payload: {
        teacherId: 2,
        dayOfWeek: 1,
        periodNumber: 2,
        classId: 4,
        eventId: null,
      },
    });
  });

  it("transforms UI drafts into the exact bulk request groups", () => {
    const drafts: ScheduleDraft[] = [
      {
        id: "create",
        operation: "add",
        teacherId: 2,
        dayOfWeek: 2,
        periodNumber: 4,
        classId: 4,
        eventId: null,
      },
      {
        id: "update",
        operation: "edit",
        targetSlotId: 11,
        teacherId: 2,
        dayOfWeek: 1,
        periodNumber: 2,
        classId: null,
        eventId: 7,
      },
      { id: "delete", operation: "delete", targetSlotId: 12 },
      {
        id: "swap",
        operation: "swap",
        slotA: { teacherId: 2, dayOfWeek: 1, periodNumber: 2 },
        slotB: { teacherId: 3, dayOfWeek: 4, periodNumber: 6 },
      },
    ];

    expect(draftsToBulkRequest(drafts)).toEqual({
      creates: [
        {
          teacherId: 2,
          dayOfWeek: 2,
          periodNumber: 4,
          classId: 4,
          eventId: null,
        },
      ],
      updates: [
        {
          id: 11,
          payload: {
            teacherId: 2,
            dayOfWeek: 1,
            periodNumber: 2,
            classId: null,
            eventId: 7,
          },
        },
      ],
      deletes: [12],
      swaps: [
        {
          slotA: { teacherId: 2, dayOfWeek: 1, periodNumber: 2 },
          slotB: { teacherId: 3, dayOfWeek: 4, periodNumber: 6 },
        },
      ],
    });
  });

  it("blocks duplicate staged coordinates", () => {
    const first: ScheduleDraft = {
      id: "first",
      operation: "add",
      teacherId: 2,
      dayOfWeek: 1,
      periodNumber: 2,
      classId: 4,
      eventId: null,
    };
    const second: ScheduleDraft = {
      ...first,
      id: "second",
      eventId: 7,
      classId: null,
    };

    expect(findDraftConflict(second, [first])).toBe("2:1:2");
  });

  it("maps one-based backend coordinates into the fixed five-by-seven matrix", () => {
    const matrix = buildScheduleMatrix(slots);
    expect(matrix).toHaveLength(5);
    expect(matrix[0]).toHaveLength(7);
    expect(matrix[0][1]).toEqual([slots[0]]);
    expect(matrix[2][4]).toEqual([slots[1]]);
    expect(matrix[4][6]).toEqual([]);
  });

  it("moves to review immediately after adding a valid operation", () => {
    useScheduleDraftStore.getState().reset();
    useScheduleDraftStore.getState().startOperation("add");
    useScheduleDraftStore.getState().updateCurrentDraft({
      teacherId: 2,
      dayOfWeek: 2,
      periodNumber: 4,
      classId: 4,
      eventId: null,
    });

    expect(useScheduleDraftStore.getState().currentStep).toBe("details");
    expect(useScheduleDraftStore.getState().addCurrentToDraft()).toEqual({ ok: true });
    expect(useScheduleDraftStore.getState().currentStep).toBe("review");
    expect(useScheduleDraftStore.getState().stagedEdits).toHaveLength(1);
    useScheduleDraftStore.getState().reset();
  });

  it("validates operation-specific content and occupied targets", () => {
    const addDraft: ScheduleDraft = {
      id: "add",
      operation: "add",
      teacherId: 2,
      dayOfWeek: 2,
      periodNumber: 4,
      classId: null,
      eventId: null,
    };
    expect(isScheduleDraftValid(addDraft, slots)).toBe(false);
    expect(isScheduleDraftValid({ ...addDraft, classId: 4 }, slots)).toBe(true);
    expect(isScheduleDraftValid({ ...addDraft, eventId: 7 }, slots)).toBe(true);

    expect(
      isScheduleDraftValid(
        {
          id: "edit",
          operation: "edit",
          targetSlotId: 999,
          teacherId: 2,
          dayOfWeek: 1,
          periodNumber: 2,
          classId: 4,
          eventId: null,
        },
        slots,
      ),
    ).toBe(false);
    expect(
      isScheduleDraftValid(
        {
          id: "edit-valid",
          operation: "edit",
          targetSlotId: 11,
          teacherId: 2,
          dayOfWeek: 1,
          periodNumber: 2,
          classId: 4,
          eventId: null,
        },
        slots,
      ),
    ).toBe(true);

    expect(
      isScheduleDraftValid({ id: "delete", operation: "delete", targetSlotId: 999 }, slots),
    ).toBe(false);
    expect(
      isScheduleDraftValid({ id: "delete-valid", operation: "delete", targetSlotId: 11 }, slots),
    ).toBe(true);

    const firstCoordinate = { teacherId: 2, dayOfWeek: 1, periodNumber: 2 };
    const secondCoordinate = { teacherId: 2, dayOfWeek: 3, periodNumber: 5 };
    expect(
      isScheduleDraftValid(
        { id: "same", operation: "swap", slotA: firstCoordinate, slotB: firstCoordinate },
        slots,
      ),
    ).toBe(false);
    expect(
      isScheduleDraftValid(
        { id: "swap", operation: "swap", slotA: firstCoordinate, slotB: secondCoordinate },
        slots,
      ),
    ).toBe(true);
  });
});
