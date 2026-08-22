import { describe, expect, it } from "vitest";
import { buildQueryString, normalizeScheduleResponse } from "./api";
import { contentLabel, dayName } from "./lib/labels";

describe("weekly schedule backend contract", () => {
  it("serializes only the backend-supported query fields", () => {
    expect(
      buildQueryString({
        teacherId: 7,
        classId: 12,
        eventId: 3,
        dayOfWeek: 2,
        periodNumber: 5,
      }),
    ).toBe("?teacherId=7&classId=12&eventId=3&dayOfWeek=2&periodNumber=5");
  });

  it("omits undefined query fields", () => {
    expect(buildQueryString({ classId: 12 })).toBe("?classId=12");
    expect(buildQueryString({})).toBe("");
  });
});

describe("schedule response normalization", () => {
  it("normalizes the backend DTO list into grid-ready camelCase records", () => {
    expect(
      normalizeScheduleResponse([
        {
          Id: 4,
          TeacherId: 9,
          TeacherName: "المعلم",
          DayOfWeek: 2,
          PeriodNumber: 3,
          ClassId: 11,
          ClassDisplayName: "1/أ",
          EventId: null,
          EventName: null,
        },
      ]),
    ).toEqual([
      {
        id: 4,
        teacherId: 9,
        teacherName: "المعلم",
        dayOfWeek: 2,
        periodNumber: 3,
        classId: 11,
        classDisplayName: "1/أ",
        eventId: null,
        eventName: null,
      },
    ]);
  });

  it("supports a value envelope without treating the response as an empty list", () => {
    expect(
      normalizeScheduleResponse({
        value: [
          {
            id: 5,
            teacherId: 10,
            teacherName: "معلم آخر",
            dayOfWeek: 4,
            periodNumber: 6,
            classId: null,
            classDisplayName: null,
            eventId: 2,
            eventName: "مناوبة",
          },
        ],
      }),
    ).toHaveLength(1);
  });
});

describe("schedule labels", () => {
  it("maps the backend day range to Arabic labels", () => {
    expect(dayName(1)).toBe("الأحد");
    expect(dayName(5)).toBe("الخميس");
    expect(dayName(99)).toBe("يوم 99");
  });

  it("renders content from nullable class and event names", () => {
    expect(contentLabel({ classDisplayName: "1/أ", eventName: null })).toBe("1/أ");
    expect(contentLabel({ classDisplayName: null, eventName: "مناوبة" })).toBe(
      "مناوبة",
    );
    expect(contentLabel({ classDisplayName: null, eventName: null })).toBe(
      "— فارغة —",
    );
  });
});
