import { describe, expect, it } from "vitest";
import { buildQueryString as buildClassQueryString } from "./classes/api";
import { buildQueryString as buildEventQueryString } from "./events/api";
import { buildQueryString as buildSubjectQueryString } from "./subjects/api";
import { buildQueryString as buildTeacherQueryString } from "./teachers/api";

describe("backend query serialization", () => {
  it("serializes teacher filters using the exact backend field names", () => {
    expect(
      buildTeacherQueryString({
        name: "  أحمد ",
        subjectId: 4,
        isSupervisor: false,
      }),
    ).toBe("?name=%D8%A3%D8%AD%D9%85%D8%AF&subjectId=4&isSupervisor=false");
  });

  it("omits empty teacher filters", () => {
    expect(buildTeacherQueryString({ name: "  " })).toBe("");
  });

  it("serializes school-class filters without inventing sort parameters", () => {
    expect(
      buildClassQueryString({ displayName: "  أول ", grade: 3, section: 2 }),
    ).toBe(
      "?displayName=%D8%A3%D9%88%D9%84&grade=3&section=2",
    );
  });

  it("serializes subject search using the backend name field", () => {
    expect(buildSubjectQueryString({ name: "math" })).toBe("?name=math");
  });

  it("serializes event search and boolean flags", () => {
    expect(
      buildEventQueryString({
        eventName: "  assembly ",
        isSupport: true,
        isStandby: false,
      }),
    ).toBe("?eventName=assembly&isSupport=true&isStandby=false");
  });
});
