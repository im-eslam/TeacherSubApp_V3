import { describe, expect, it } from "vitest";
import { buildQueryString } from "./api";
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
