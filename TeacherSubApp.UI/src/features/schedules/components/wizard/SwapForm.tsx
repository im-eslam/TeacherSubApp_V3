import { useCallback, useMemo, useState } from "react";
import { ModalErrorBanner } from "../../../../components/modals/ModalParts";
import type { DraftSwap, DraftSwapSlotInfo } from "../../draftStore";
import { nextDraftId } from "../../draftStore";
import type { SelectorOption } from "../../hooks";
import type { WeeklyScheduleReadDto } from "../../types";
import { SlotPicker, EMPTY_SLOT_PICKER, type SlotPickerValue } from "./SlotPicker";

interface SwapFormProps {
  teacherOptions: SelectorOption[];
  initial?: DraftSwap;
  onSubmit: (op: DraftSwap) => void;
}

function buildSlotInfo(
  picker: SlotPickerValue,
  resolved: WeeklyScheduleReadDto | null,
  teacherOptions: SelectorOption[],
): DraftSwapSlotInfo {
  if (resolved) {
    return {
      teacherId: resolved.teacherId,
      teacherName: resolved.teacherName,
      dayOfWeek: resolved.dayOfWeek,
      periodNumber: resolved.periodNumber,
      classDisplayName: resolved.classDisplayName,
      eventName: resolved.eventName,
      eventId: resolved.eventId,
    };
  }

  const teacherName =
    teacherOptions.find((t) => t.value === picker.teacherId)?.label ?? "";

  return {
    teacherId: Number(picker.teacherId),
    teacherName,
    dayOfWeek: Number(picker.dayOfWeek),
    periodNumber: Number(picker.periodNumber),
    classDisplayName: null,
    eventName: null,
    eventId: null,
  };
}

export function SwapForm({ teacherOptions, initial, onSubmit }: SwapFormProps) {
  const [pickerA, setPickerA] = useState<SlotPickerValue>(
    initial
      ? {
          teacherId: String(initial.slotA.TeacherId),
          dayOfWeek: String(initial.slotA.DayOfWeek),
          periodNumber: String(initial.slotA.PeriodNumber),
        }
      : EMPTY_SLOT_PICKER,
  );
  const [pickerB, setPickerB] = useState<SlotPickerValue>(
    initial
      ? {
          teacherId: String(initial.slotB.TeacherId),
          dayOfWeek: String(initial.slotB.DayOfWeek),
          periodNumber: String(initial.slotB.PeriodNumber),
        }
      : EMPTY_SLOT_PICKER,
  );
  const [resolvedA, setResolvedA] = useState<WeeklyScheduleReadDto | null>(null);
  const [resolvedB, setResolvedB] = useState<WeeklyScheduleReadDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResolvedA = useCallback((slot: WeeklyScheduleReadDto | null) => {
    setResolvedA(slot);
  }, []);
  const handleResolvedB = useCallback((slot: WeeklyScheduleReadDto | null) => {
    setResolvedB(slot);
  }, []);

  const pickerAComplete =
    pickerA.teacherId !== "" && pickerA.dayOfWeek !== "" && pickerA.periodNumber !== "";
  const pickerBComplete =
    pickerB.teacherId !== "" && pickerB.dayOfWeek !== "" && pickerB.periodNumber !== "";

  const sameCoordinate =
    pickerA.teacherId !== "" &&
    pickerA.teacherId === pickerB.teacherId &&
    pickerA.dayOfWeek === pickerB.dayOfWeek &&
    pickerA.periodNumber === pickerB.periodNumber;

  const canSubmit = useMemo(
    () => pickerAComplete && pickerBComplete && !sameCoordinate,
    [pickerAComplete, pickerBComplete, sameCoordinate],
  );

  const handleSubmit = () => {
    if (!pickerAComplete || !pickerBComplete) {
      setError("يجب تحديد المعلم واليوم والحصة لكلا الجانبين.");
      return;
    }
    if (sameCoordinate) {
      setError("لا يمكن تبديل الحصة مع نفسها. اختر إحداثيتين مختلفتين.");
      return;
    }

    onSubmit({
      kind: "swap",
      draftId: initial?.draftId ?? nextDraftId(),
      slotA: {
        TeacherId: Number(pickerA.teacherId),
        DayOfWeek: Number(pickerA.dayOfWeek),
        PeriodNumber: Number(pickerA.periodNumber),
      },
      slotAInfo: buildSlotInfo(pickerA, resolvedA, teacherOptions),
      slotB: {
        TeacherId: Number(pickerB.teacherId),
        DayOfWeek: Number(pickerB.dayOfWeek),
        PeriodNumber: Number(pickerB.periodNumber),
      },
      slotBInfo: buildSlotInfo(pickerB, resolvedB, teacherOptions),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <ModalErrorBanner message={error} />}

      <SlotPicker
        label="الحصة الأولى"
        value={pickerA}
        onChange={setPickerA}
        teacherOptions={teacherOptions}
        onResolved={handleResolvedA}
      />

      <SlotPicker
        label="الحصة الثانية"
        value={pickerB}
        onChange={setPickerB}
        teacherOptions={teacherOptions}
        onResolved={handleResolvedB}
      />

      {sameCoordinate && (
        <div className="-mt-2 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-xs font-medium text-amber-700">
          الحصتان متطابقتان — اختر إحداثية مختلفة للحصة الثانية.
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-1 w-full px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] outline-none"
      >
        إضافة إلى المسودة
      </button>
    </div>
  );
}
