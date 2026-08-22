import { describe, expect, it } from "vitest";
import {
  getBackendDayOfWeekOrNull,
  toBackendDayOfWeek,
  toIsoDate,
} from "./dateUtils";

describe("substitution date utilities", () => {
  it("maps Sunday through Thursday to backend values 1 through 5", () => {
    expect(toBackendDayOfWeek(new Date("2026-08-23T12:00:00"))).toBe(1);
    expect(toBackendDayOfWeek(new Date("2026-08-24T12:00:00"))).toBe(2);
    expect(toBackendDayOfWeek(new Date("2026-08-27T12:00:00"))).toBe(5);
  });

  it("returns null for Friday and Saturday", () => {
    expect(getBackendDayOfWeekOrNull(new Date("2026-08-28T12:00:00"))).toBeNull();
    expect(getBackendDayOfWeekOrNull(new Date("2026-08-29T12:00:00"))).toBeNull();
  });

  it("serializes a local date without UTC rollover", () => {
    expect(toIsoDate(new Date("2026-08-23T23:30:00"))).toBe("2026-08-23");
  });
});
