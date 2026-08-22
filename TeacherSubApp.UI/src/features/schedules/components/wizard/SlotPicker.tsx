import { useEffect, useMemo, useRef } from "react";
import { Loader2, CircleCheck, CircleAlert } from "lucide-react";
import { SearchableSelect } from "../../../../components/controls/SearchableSelect";
import { Select } from "../../../../components/controls/Select";
import { DAYS, PERIODS } from "../../constants";
import { useTeacherSlotsLookup } from "../../hooks";
import type { SelectorOption } from "../../hooks";
import type { WeeklyScheduleReadDto } from "../../types";
import type { SlotPickerValue } from "./slotPickerTypes";

export { EMPTY_SLOT_PICKER, type SlotPickerValue } from "./slotPickerTypes";

const DAY_OPTIONS = DAYS.map((d) => ({ value: String(d.value), label: d.label }));
const PERIOD_OPTIONS = PERIODS.map((p) => ({
  value: String(p),
  label: `الحصة ${p}`,
}));

interface SlotPickerProps {
  label: string;
  value: SlotPickerValue;
  onChange: (value: SlotPickerValue) => void;
  teacherOptions: SelectorOption[];
  onResolved: (slot: WeeklyScheduleReadDto | null) => void;
}

export function SlotPicker({
  label,
  value,
  onChange,
  teacherOptions,
  onResolved,
}: SlotPickerProps) {
  const { data: teacherSlots = [], isFetching } = useTeacherSlotsLookup(
    value.teacherId ? Number(value.teacherId) : null,
  );

  const resolved = useMemo(() => {
    if (!value.teacherId || !value.dayOfWeek || !value.periodNumber) {
      return null;
    }
    return (
      teacherSlots.find(
        (s) =>
          s.dayOfWeek === Number(value.dayOfWeek) &&
          s.periodNumber === Number(value.periodNumber),
      ) ?? null
    );
  }, [teacherSlots, value.teacherId, value.dayOfWeek, value.periodNumber]);

  const lastResolvedId = useRef<number | null>(null);
  useEffect(() => {
    const currentId = resolved?.id ?? null;
    if (currentId !== lastResolvedId.current) {
      lastResolvedId.current = currentId;
      onResolved(resolved);
    }
  }, [resolved, onResolved]);

  const hasCoordinate =
    value.teacherId !== "" && value.dayOfWeek !== "" && value.periodNumber !== "";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-neutral-600">{label}</span>
      <div className="grid grid-cols-3 gap-2">
        <SearchableSelect
          value={value.teacherId}
          onChange={(teacherId) =>
            onChange({ teacherId, dayOfWeek: "", periodNumber: "" })
          }
          options={teacherOptions}
          placeholder="المعلم"
        />
        <Select
          value={value.dayOfWeek}
          onChange={(dayOfWeek) => onChange({ ...value, dayOfWeek })}
          options={DAY_OPTIONS}
          placeholder="اليوم"
        />
        <Select
          value={value.periodNumber}
          onChange={(periodNumber) => onChange({ ...value, periodNumber })}
          options={PERIOD_OPTIONS}
          placeholder="الحصة"
        />
      </div>

      {hasCoordinate && isFetching && (
        <p className="flex items-center gap-1.5 text-xs text-neutral-500 mt-1">
          <Loader2 size={13} className="animate-spin shrink-0" />
          جارٍ التحقق من الحصة...
        </p>
      )}
      {hasCoordinate && !isFetching && !resolved && (
        <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
          <CircleAlert size={15} className="shrink-0" />
          <span className="text-xs font-medium leading-snug">
            لا يوجد تعيين حالي على هذه الإحداثية (الحصة فارغة).
          </span>
        </div>
      )}
      {hasCoordinate && !isFetching && resolved && (
        <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
          <CircleCheck size={15} className="shrink-0" />
          <span className="text-xs font-medium leading-snug truncate">
            {resolved.classDisplayName ?? resolved.eventName ?? "تعيين موجود"}
          </span>
        </div>
      )}
    </div>
  );
}
