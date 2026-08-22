import { useCallback, useMemo, useState } from "react";
import { SearchableSelect } from "../../../../components/controls/SearchableSelect";
import { ModalErrorBanner } from "../../../../components/modals/ModalParts";
import type { DraftEdit } from "../../draftStore";
import { nextDraftId } from "../../draftStore";
import type { SelectorOption } from "../../hooks";
import type { WeeklyScheduleReadDto } from "../../types";
import { SlotPicker, EMPTY_SLOT_PICKER, type SlotPickerValue } from "./SlotPicker";

interface EditFormProps {
  teacherOptions: SelectorOption[];
  classOptions: SelectorOption[];
  eventOptions: SelectorOption[];
  initial?: DraftEdit;
  onSubmit: (op: DraftEdit) => void;
}

export function EditForm({
  teacherOptions,
  classOptions,
  eventOptions,
  initial,
  onSubmit,
}: EditFormProps) {
  const [picker, setPicker] = useState<SlotPickerValue>(
    initial
      ? {
          teacherId: String(initial.teacherId),
          dayOfWeek: String(initial.dayOfWeek),
          periodNumber: String(initial.periodNumber),
        }
      : EMPTY_SLOT_PICKER,
  );
  const [resolvedSlot, setResolvedSlot] = useState<WeeklyScheduleReadDto | null>(
    null,
  );
  const [classId, setClassId] = useState(
    initial?.classId ? String(initial.classId) : "",
  );
  const [eventId, setEventId] = useState(
    initial?.eventId ? String(initial.eventId) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const handleResolved = useCallback(
    (slot: WeeklyScheduleReadDto | null) => {
      setResolvedSlot(slot);
      if (slot && !initial) {
        setClassId(slot.classId ? String(slot.classId) : "");
        setEventId(slot.eventId ? String(slot.eventId) : "");
      }
    },
    [initial],
  );

  const resolvedTargetId = resolvedSlot?.id ?? initial?.targetId ?? null;

  const canSubmit = useMemo(
    () => resolvedTargetId !== null && (classId !== "" || eventId !== ""),
    [resolvedTargetId, classId, eventId],
  );

  const handleSubmit = () => {
    if (!picker.teacherId || !picker.dayOfWeek || !picker.periodNumber) {
      setError("يجب تحديد المعلم واليوم والحصة لتحديد الحصة المستهدفة.");
      return;
    }
    if (resolvedTargetId === null) {
      setError("لا يوجد تعيين حالي على هذه الإحداثية لتعديله.");
      return;
    }
    if (!classId && !eventId) {
      setError("يجب تحديد صف دراسي أو حدث على الأقل.");
      return;
    }

    const teacherName =
      teacherOptions.find((t) => t.value === picker.teacherId)?.label ?? "";
    const className = classId
      ? (classOptions.find((c) => c.value === classId)?.label ?? null)
      : null;
    const eventName = eventId
      ? (eventOptions.find((e) => e.value === eventId)?.label ?? null)
      : null;

    onSubmit({
      kind: "edit",
      draftId: initial?.draftId ?? nextDraftId(),
      targetId: resolvedTargetId,
      teacherId: Number(picker.teacherId),
      teacherName,
      dayOfWeek: Number(picker.dayOfWeek),
      periodNumber: Number(picker.periodNumber),
      classId: classId ? Number(classId) : null,
      className,
      eventId: eventId ? Number(eventId) : null,
      eventName,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <ModalErrorBanner message={error} />}

      <SlotPicker
        label="الحصة المستهدفة"
        value={picker}
        onChange={setPicker}
        teacherOptions={teacherOptions}
        onResolved={handleResolved}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-neutral-600">
          الصف الدراسي الجديد
        </label>
        <SearchableSelect
          value={classId}
          onChange={setClassId}
          options={classOptions}
          placeholder="بدون صف"
          clearable
          clearLabel="بدون صف"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-neutral-600">
          الحدث الجديد
        </label>
        <SearchableSelect
          value={eventId}
          onChange={setEventId}
          options={eventOptions}
          placeholder="بدون حدث"
          clearable
          clearLabel="بدون حدث"
        />
      </div>

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
