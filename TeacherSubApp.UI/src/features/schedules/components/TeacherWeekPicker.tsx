import { useMemo, useState } from "react";
import {
  ToggleButtonGroup,
  ToggleButton,
  composeRenderProps,
} from "react-aria-components";
import { SearchableSelect } from "../../../components/controls/SearchableSelect";
import { dayName } from "../lib/labels";
import type { TeacherReadDto } from "../../teachers/types";
import type { WeeklyScheduleReadDto } from "../types";

const STYLES = {
  wrap: "flex flex-col gap-4",
  sectionLabel:
    "block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2",
  dayGroup: "flex flex-wrap items-center gap-2",
  dayButton: [
    "flex items-center justify-center px-5 py-3 min-h-[48px] min-w-[80px]",
    "text-sm font-semibold rounded-2xl border outline-none transition-colors",
    "focus-visible:ring-2 focus-visible:ring-blue-500/30",
  ].join(" "),
  periodGrid: "grid grid-cols-1 sm:grid-cols-2 gap-2",
  periodButton: [
    "flex items-center gap-3 px-4 py-3 min-h-[56px] w-full text-start",
    "text-sm rounded-2xl border outline-none transition-colors",
    "focus-visible:ring-2 focus-visible:ring-blue-500/30",
  ].join(" "),
  periodNumber:
    "flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold shrink-0",
  periodTextWrap: "flex flex-col gap-0.5 min-w-0",
  periodPrimaryFree: "text-sm font-medium text-emerald-700",
  periodPrimaryBusy: "text-sm font-medium text-neutral-700 truncate",
  periodSecondary: "text-xs text-neutral-400 truncate",
  idle: "text-neutral-600 bg-white border-neutral-200/80 hover:bg-neutral-50 hover:border-blue-300",
  selected: "text-blue-700 border-blue-400 bg-blue-50 shadow-sm",
  busyIdle: "bg-neutral-50/70 border-neutral-200/80 hover:border-blue-300",
  numFree: "bg-emerald-50 text-emerald-600",
  numBusy: "bg-neutral-200 text-neutral-500",
  numSelected: "bg-blue-100 text-blue-700",
};

const DAYS = [1, 2, 3, 4, 5];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export interface PickedCell {
  teacherId: number;
  teacherName: string;
  dayOfWeek: number;
  periodNumber: number;
  /** The existing slot at this coordinate, or null if the cell is free. */
  existing: WeeklyScheduleReadDto | null;
}

export interface TeacherWeekPickerProps {
  teachers: TeacherReadDto[];
  getTeacherSlots: (teacherId: number) => WeeklyScheduleReadDto[];
  /** When true, only occupied cells are selectable (used for swap targets). */
  requireOccupied?: boolean;
  /** Teacher to exclude from the picker (used for swap targets, to stop
   *  picking the same teacher+slot as side A). */
  excludeSlotId?: number;
  onPick: (cell: PickedCell) => void;
}

export function TeacherWeekPicker({
  teachers,
  getTeacherSlots,
  requireOccupied = false,
  excludeSlotId,
  onPick,
}: TeacherWeekPickerProps) {
  const [teacherId, setTeacherId] = useState<string>("");
  const [day, setDay] = useState<number>(1);

  const teacherOptions = useMemo(
    () =>
      [...teachers]
        .sort((a, b) => a.name.localeCompare(b.name, "ar"))
        .map((t) => ({
          value: String(t.id),
          label: t.subjectName ? `${t.name} — ${t.subjectName}` : t.name,
        })),
    [teachers],
  );

  const slots = useMemo(() => {
    if (!teacherId) return [];
    return getTeacherSlots(Number(teacherId));
  }, [teacherId, getTeacherSlots]);

  const slotsByPeriod = useMemo(() => {
    const map = new Map<number, WeeklyScheduleReadDto>();
    for (const s of slots) {
      if (s.dayOfWeek === day) map.set(s.periodNumber, s);
    }
    return map;
  }, [slots, day]);

  const selectedTeacher = teachers.find((t) => t.id === Number(teacherId));

  return (
    <div className={STYLES.wrap}>
      <div>
        <span className={STYLES.sectionLabel}>المعلم</span>
        <SearchableSelect
          value={teacherId}
          onChange={(v) => setTeacherId(v)}
          options={teacherOptions}
          placeholder="ابحث واختر معلماً..."
        />
      </div>

      {teacherId !== "" && (
        <>
          <div>
            <span className={STYLES.sectionLabel}>اليوم</span>
            <ToggleButtonGroup
              aria-label="اختيار اليوم"
              selectionMode="single"
              selectedKeys={[String(day)]}
              onSelectionChange={(keys) => {
                const next = [...keys][0];
                if (next != null) setDay(Number(next));
              }}
              className={STYLES.dayGroup}
            >
              {DAYS.map((d) => (
                <ToggleButton
                  key={d}
                  id={String(d)}
                  className={composeRenderProps("", (_, { isSelected }) =>
                    [
                      STYLES.dayButton,
                      isSelected ? STYLES.selected : STYLES.idle,
                    ].join(" "),
                  )}
                >
                  {dayName(d)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>

          <div>
            <span className={STYLES.sectionLabel}>الحصة</span>
            <div className={STYLES.periodGrid}>
              {PERIODS.map((p) => {
                const existing = slotsByPeriod.get(p) ?? null;
                const isReal = existing !== null && !existing.isEmpty;
                const isExcluded = isReal && existing.id === excludeSlotId;
                const isDisabled = isExcluded || (requireOccupied && !isReal);

                const primaryText = isReal ? contentSummary(existing) : "متاحة";
                const secondaryText = isReal
                  ? existing.eventIsSupport
                    ? "حدث دعم"
                    : existing.eventIsStandby
                      ? "حدث احتياطي"
                      : null
                  : null;

                return (
                  <button
                    key={p}
                    type="button"
                    disabled={isDisabled}
                    onClick={() =>
                      onPick({
                        teacherId: Number(teacherId),
                        teacherName: selectedTeacher?.name ?? "",
                        dayOfWeek: day,
                        periodNumber: p,
                        existing: isReal ? existing : null,
                      })
                    }
                    className={[
                      STYLES.periodButton,
                      isReal ? STYLES.busyIdle : STYLES.idle,
                      isDisabled ? "opacity-40 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        STYLES.periodNumber,
                        isReal ? STYLES.numBusy : STYLES.numFree,
                      ].join(" ")}
                    >
                      {p}
                    </span>
                    <span className={STYLES.periodTextWrap}>
                      <span
                        className={
                          isReal
                            ? STYLES.periodPrimaryBusy
                            : STYLES.periodPrimaryFree
                        }
                      >
                        {primaryText}
                      </span>
                      {secondaryText && (
                        <span className={STYLES.periodSecondary}>
                          {secondaryText}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function contentSummary(slot: WeeklyScheduleReadDto): string {
  const parts: string[] = [];
  if (slot.classDisplayName) parts.push(slot.classDisplayName);
  if (slot.eventName) parts.push(slot.eventName);
  return parts.length > 0 ? parts.join(" + ") : "مشغولة";
}
