import { describe, expect, it } from "vitest";
import { buildScheduleQueryString, toScheduleUpdateEntry } from "./api";
import { indexSlotsByCoordinate, scheduleCoordinateKey } from "./lib/grid";
import { isScheduleDraftValid } from "./lib/validation";
import { draftsToBulkRequest, findDraftConflict } from "./store";
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
  it("serializes all supported backend query parameters", () => {
    expect(
      buildScheduleQueryString({
        teacherId: 2,
        classId: 4,
        eventId: 7,
        dayOfWeek: 3,
        periodNumber: 5,
      }),
    ).toBe("?teacherId=2&classId=4&eventId=7&dayOfWeek=3&periodNumber=5");
  });

  it("uses the exact C# update entry member names", () => {
    expect(
      toScheduleUpdateEntry(11, {
        TeacherId: 2,
        DayOfWeek: 1,
        PeriodNumber: 2,
        ClassId: 4,
        EventId: null,
      }),
    ).toEqual({
      Id: 11,
      Payload: {
        TeacherId: 2,
        DayOfWeek: 1,
        PeriodNumber: 2,
        ClassId: 4,
        EventId: null,
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
        slotA: { TeacherId: 2, DayOfWeek: 1, PeriodNumber: 2 },
        slotB: { TeacherId: 3, DayOfWeek: 4, PeriodNumber: 6 },
      },
    ];

    expect(draftsToBulkRequest(drafts)).toEqual({
      Creates: [
        {
          TeacherId: 2,
          DayOfWeek: 2,
          PeriodNumber: 4,
          ClassId: 4,
          EventId: null,
        },
      ],
      Updates: [
        {
          Id: 11,
          Payload: {
            TeacherId: 2,
            DayOfWeek: 1,
            PeriodNumber: 2,
            ClassId: null,
            EventId: 7,
          },
        },
      ],
      Deletes: [12],
      Swaps: [
        {
          SlotA: { TeacherId: 2, DayOfWeek: 1, PeriodNumber: 2 },
          SlotB: { TeacherId: 3, DayOfWeek: 4, PeriodNumber: 6 },
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

  it("indexes occupied records by day and period while preserving empty coordinates", () => {
    const indexed = indexSlotsByCoordinate(slots);
    expect(indexed.get(scheduleCoordinateKey(1, 2))).toEqual([slots[0]]);
    expect(indexed.get(scheduleCoordinateKey(3, 5))).toEqual([slots[1]]);
    expect(indexed.has(scheduleCoordinateKey(5, 7))).toBe(false);
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

    const firstCoordinate = { TeacherId: 2, DayOfWeek: 1, PeriodNumber: 2 };
    const secondCoordinate = { TeacherId: 2, DayOfWeek: 3, PeriodNumber: 5 };
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
