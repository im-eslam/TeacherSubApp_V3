import { useMemo, useState } from "react";
import { SearchableSelect } from "../../../../components/controls/SearchableSelect";
import { Select } from "../../../../components/controls/Select";
import { ModalErrorBanner } from "../../../../components/modals/ModalParts";
import { DAYS, PERIODS } from "../../constants";
import type { DraftAdd } from "../../draftStore";
import { nextDraftId } from "../../draftStore";
import type { SelectorOption } from "../../hooks";

const DAY_OPTIONS = DAYS.map((d) => ({ value: String(d.value), label: d.label }));
const PERIOD_OPTIONS = PERIODS.map((p) => ({
  value: String(p),
  label: `الحصة ${p}`,
}));

interface AddFormProps {
  teacherOptions: SelectorOption[];
  classOptions: SelectorOption[];
  eventOptions: SelectorOption[];
  initial?: DraftAdd;
  onSubmit: (op: DraftAdd) => void;
}

export function AddForm({
  teacherOptions,
  classOptions,
  eventOptions,
  initial,
  onSubmit,
}: AddFormProps) {
  const [teacherId, setTeacherId] = useState(
    initial ? String(initial.teacherId) : "",
  );
  const [dayOfWeek, setDayOfWeek] = useState(
    initial ? String(initial.dayOfWeek) : "",
  );
  const [periodNumber, setPeriodNumber] = useState(
    initial ? String(initial.periodNumber) : "",
  );
  const [classId, setClassId] = useState(
    initial?.classId ? String(initial.classId) : "",
  );
  const [eventId, setEventId] = useState(
    initial?.eventId ? String(initial.eventId) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () =>
      teacherId !== "" &&
      dayOfWeek !== "" &&
      periodNumber !== "" &&
      (classId !== "" || eventId !== ""),
    [teacherId, dayOfWeek, periodNumber, classId, eventId],
  );

  const handleSubmit = () => {
    if (!teacherId || !dayOfWeek || !periodNumber) {
      setError("يجب تحديد المعلم واليوم والحصة.");
      return;
    }
    if (!classId && !eventId) {
      setError("يجب تحديد صف دراسي أو حدث على الأقل.");
      return;
    }

    const teacherName =
      teacherOptions.find((t) => t.value === teacherId)?.label ?? "";
    const className = classId
      ? (classOptions.find((c) => c.value === classId)?.label ?? null)
      : null;
    const eventName = eventId
      ? (eventOptions.find((e) => e.value === eventId)?.label ?? null)
      : null;

    onSubmit({
      kind: "add",
      draftId: initial?.draftId ?? nextDraftId(),
      teacherId: Number(teacherId),
      teacherName,
      dayOfWeek: Number(dayOfWeek),
      periodNumber: Number(periodNumber),
      classId: classId ? Number(classId) : null,
      className,
      eventId: eventId ? Number(eventId) : null,
      eventName,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <ModalErrorBanner message={error} />}

      <Field label="المعلم">
        <SearchableSelect
          value={teacherId}
          onChange={setTeacherId}
          options={teacherOptions}
          placeholder="اختر معلمًا..."
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="اليوم">
          <Select
            value={dayOfWeek}
            onChange={setDayOfWeek}
            options={DAY_OPTIONS}
            placeholder="اختر اليوم..."
          />
        </Field>
        <Field label="الحصة">
          <Select
            value={periodNumber}
            onChange={setPeriodNumber}
            options={PERIOD_OPTIONS}
            placeholder="اختر الحصة..."
          />
        </Field>
      </div>

      <Field label="الصف الدراسي (اختياري)">
        <SearchableSelect
          value={classId}
          onChange={setClassId}
          options={classOptions}
          placeholder="بدون صف"
          clearable
          clearLabel="بدون صف"
        />
      </Field>

      <Field label="الحدث (اختياري)">
        <SearchableSelect
          value={eventId}
          onChange={setEventId}
          options={eventOptions}
          placeholder="بدون حدث"
          clearable
          clearLabel="بدون حدث"
        />
      </Field>

      <FormSubmitRow disabled={!canSubmit} onSubmit={handleSubmit} />
    </div>
  );
}

// ── Small shared helpers used across all step-2 forms ──

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-neutral-600">{label}</label>
      {children}
    </div>
  );
}

export function FormSubmitRow({
  disabled,
  onSubmit,
  label = "إضافة إلى المسودة",
}: {
  disabled: boolean;
  onSubmit: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={disabled}
      className="mt-1 w-full px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] outline-none"
    >
      {label}
    </button>
  );
}
