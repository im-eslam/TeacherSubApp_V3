import { useMemo, useState } from "react";
import { ArrowRightLeft, Trash2 } from "lucide-react";
import { EntityCreateModal } from "../../../components/modals/EntityCreateModal";
import { SearchableSelect } from "../../../components/controls/SearchableSelect";
import { Select, type SelectOption } from "../../../components/controls/Select";
import type { EventKeyReadDto } from "../../events/types";
import type { SchoolClassReadDto } from "../../classes/types";
import type { TeacherReadDto } from "../../teachers/types";
import { contentLabel, DAYS, dayName, PERIODS, slotLabel } from "../lib/labels";
import type {
  SlotCoordinate,
  WeeklyScheduleBulkEditRequest,
  WeeklyScheduleReadDto,
} from "../types";

type EditorMode = "create" | "update" | "delete" | "swap";

interface ScheduleEditorModalProps {
  isOpen: boolean;
  initialCoordinate: SlotCoordinate | null;
  initialSlot: WeeklyScheduleReadDto | null;
  baseSlots: WeeklyScheduleReadDto[];
  teachers: TeacherReadDto[];
  classes: SchoolClassReadDto[];
  events: EventKeyReadDto[];
  onClose: () => void;
  onSubmit: (request: WeeklyScheduleBulkEditRequest) => Promise<void>;
}

export function ScheduleEditorModal({
  isOpen,
  initialCoordinate,
  initialSlot,
  baseSlots,
  teachers,
  classes,
  events,
  onClose,
  onSubmit,
}: ScheduleEditorModalProps) {
  const initialMode: EditorMode = initialSlot ? "update" : "create";
  const [mode, setMode] = useState<EditorMode>(initialMode);
  const [slotId, setSlotId] = useState(initialSlot ? String(initialSlot.id) : "");
  const [teacherId, setTeacherId] = useState(
    initialSlot?.teacherId || initialCoordinate?.teacherId
      ? String(initialSlot?.teacherId ?? initialCoordinate?.teacherId)
      : "",
  );
  const [dayOfWeek, setDayOfWeek] = useState(
    String(initialSlot?.dayOfWeek ?? initialCoordinate?.dayOfWeek ?? 1),
  );
  const [periodNumber, setPeriodNumber] = useState(
    String(initialSlot?.periodNumber ?? initialCoordinate?.periodNumber ?? 1),
  );
  const [classId, setClassId] = useState(
    initialSlot?.classId === null || initialSlot?.classId === undefined
      ? "none"
      : String(initialSlot.classId),
  );
  const [eventId, setEventId] = useState(
    initialSlot?.eventId === null || initialSlot?.eventId === undefined
      ? "none"
      : String(initialSlot.eventId),
  );
  const [targetTeacherId, setTargetTeacherId] = useState(teacherId);
  const [targetDayOfWeek, setTargetDayOfWeek] = useState(dayOfWeek);
  const [targetPeriodNumber, setTargetPeriodNumber] = useState(periodNumber);

  const teacherOptions = useMemo<SelectOption[]>(
    () =>
      teachers
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "ar"))
        .map((teacher) => ({
          value: String(teacher.id),
          label: teacher.subjectName
            ? `${teacher.name} — ${teacher.subjectName}`
            : teacher.name,
        })),
    [teachers],
  );
  const classOptions = useMemo<SelectOption[]>(
    () => [
      { value: "none", label: "بدون فصل" },
      ...classes
        .slice()
        .sort((a, b) => a.displayName.localeCompare(b.displayName, "ar"))
        .map((schoolClass) => ({
          value: String(schoolClass.id),
          label: schoolClass.displayName,
        })),
    ],
    [classes],
  );
  const eventOptions = useMemo<SelectOption[]>(
    () => [
      { value: "none", label: "بدون حدث" },
      ...events
        .slice()
        .sort((a, b) => a.eventName.localeCompare(b.eventName, "ar"))
        .map((event) => ({
          value: String(event.id),
          label: event.eventName,
        })),
    ],
    [events],
  );
  const modeOptions: SelectOption[] = [
    { value: "create", label: "إضافة تعيين" },
    { value: "update", label: "تعديل تعيين" },
    { value: "delete", label: "حذف تعيين" },
    { value: "swap", label: "تبديل موضعين" },
  ];
  const dayOptions: SelectOption[] = DAYS.map((day) => ({
    value: String(day.value),
    label: day.label,
  }));
  const periodOptions: SelectOption[] = PERIODS.map((period) => ({
    value: String(period),
    label: `الحصة ${period}`,
  }));

  const selectedSlot = useMemo(
    () =>
      baseSlots.find((slot) => String(slot.id) === slotId) ?? initialSlot,
    [baseSlots, initialSlot, slotId],
  );
  const contentIsValid = classId !== "none" || eventId !== "none";
  const coordinateIsValid =
    Number(teacherId) > 0 &&
    Number(dayOfWeek) >= 1 &&
    Number(dayOfWeek) <= 5 &&
    Number(periodNumber) >= 1 &&
    Number(periodNumber) <= 7;
  const targetCoordinateIsValid =
    Number(targetTeacherId) > 0 &&
    Number(targetDayOfWeek) >= 1 &&
    Number(targetDayOfWeek) <= 5 &&
    Number(targetPeriodNumber) >= 1 &&
    Number(targetPeriodNumber) <= 7;

  const canSubmit =
    mode === "create"
      ? coordinateIsValid && contentIsValid
      : mode === "update"
        ? Boolean(selectedSlot) && coordinateIsValid && contentIsValid
        : mode === "delete"
          ? Boolean(selectedSlot)
          : Boolean(selectedSlot) && targetCoordinateIsValid;

  const title =
    mode === "create"
      ? "إضافة تعيين للجدول"
      : mode === "update"
        ? "تعديل تعيين الجدول"
        : mode === "delete"
          ? "حذف تعيين الجدول"
          : "تبديل تعيينين";

  const submitLabel =
    mode === "delete" ? "حذف" : mode === "swap" ? "تبديل" : "حفظ";

  const handleSubmit = async () => {
    const request = buildRequest({
      mode,
      selectedSlot,
      teacherId,
      dayOfWeek,
      periodNumber,
      classId,
      eventId,
      targetTeacherId,
      targetDayOfWeek,
      targetPeriodNumber,
    });
    await onSubmit(request);
  };

  return (
    <EntityCreateModal
      isOpen={isOpen}
      title={title}
      submitLabel={submitLabel}
      submittingLabel="جارٍ الحفظ..."
      submitDisabled={!canSubmit}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-4">
        <Select
          value={mode}
          onChange={(value) => setMode(value as EditorMode)}
          options={modeOptions}
          placeholder="نوع العملية"
          aria-label="نوع العملية"
        />

        {mode === "swap" ? (
          <SwapFields
            selectedSlot={selectedSlot}
            teacherOptions={teacherOptions}
            dayOptions={dayOptions}
            periodOptions={periodOptions}
            targetTeacherId={targetTeacherId}
            targetDayOfWeek={targetDayOfWeek}
            targetPeriodNumber={targetPeriodNumber}
            onSlotChange={setSlotId}
            onTargetTeacherChange={setTargetTeacherId}
            onTargetDayChange={setTargetDayOfWeek}
            onTargetPeriodChange={setTargetPeriodNumber}
            slots={baseSlots}
          />
        ) : (
          <ScheduleContentFields
            mode={mode}
            selectedSlot={selectedSlot}
            slotId={slotId}
            teacherId={teacherId}
            dayOfWeek={dayOfWeek}
            periodNumber={periodNumber}
            classId={classId}
            eventId={eventId}
            teacherOptions={teacherOptions}
            classOptions={classOptions}
            eventOptions={eventOptions}
            dayOptions={dayOptions}
            periodOptions={periodOptions}
            onSlotChange={setSlotId}
            onTeacherChange={setTeacherId}
            onDayChange={setDayOfWeek}
            onPeriodChange={setPeriodNumber}
            onClassChange={setClassId}
            onEventChange={setEventId}
            slots={baseSlots}
          />
        )}
      </div>
    </EntityCreateModal>
  );
}

function ScheduleContentFields({
  mode,
  selectedSlot,
  slotId,
  teacherId,
  dayOfWeek,
  periodNumber,
  classId,
  eventId,
  teacherOptions,
  classOptions,
  eventOptions,
  dayOptions,
  periodOptions,
  onSlotChange,
  onTeacherChange,
  onDayChange,
  onPeriodChange,
  onClassChange,
  onEventChange,
  slots,
}: {
  mode: EditorMode;
  selectedSlot: WeeklyScheduleReadDto | null;
  slotId: string;
  teacherId: string;
  dayOfWeek: string;
  periodNumber: string;
  classId: string;
  eventId: string;
  teacherOptions: SelectOption[];
  classOptions: SelectOption[];
  eventOptions: SelectOption[];
  dayOptions: SelectOption[];
  periodOptions: SelectOption[];
  onSlotChange: (value: string) => void;
  onTeacherChange: (value: string) => void;
  onDayChange: (value: string) => void;
  onPeriodChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onEventChange: (value: string) => void;
  slots: WeeklyScheduleReadDto[];
}) {
  return (
    <>
      {mode !== "create" && (
        <Select
          value={slotId}
          onChange={onSlotChange}
          options={slots.map((slot) => ({
            value: String(slot.id),
            label: slotLabel(slot.teacherName, slot.dayOfWeek, slot.periodNumber),
          }))}
          placeholder="اختر التعيين"
          aria-label="التعيين"
        />
      )}
      {mode !== "delete" && (
        <>
          <SearchableSelect
            value={teacherId}
            onChange={onTeacherChange}
            options={teacherOptions}
            placeholder="اختر معلماً"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={dayOfWeek}
              onChange={onDayChange}
              options={dayOptions}
              placeholder="اليوم"
              aria-label="اليوم"
            />
            <Select
              value={periodNumber}
              onChange={onPeriodChange}
              options={periodOptions}
              placeholder="الحصة"
              aria-label="الحصة"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={classId}
              onChange={onClassChange}
              options={classOptions}
              placeholder="الفصل"
              aria-label="الفصل"
            />
            <Select
              value={eventId}
              onChange={onEventChange}
              options={eventOptions}
              placeholder="الحدث"
              aria-label="الحدث"
            />
          </div>
          {!selectedSlot && (
            <p className="text-xs text-neutral-400">
              يجب تعيين فصل أو حدث واحد على الأقل.
            </p>
          )}
        </>
      )}
      {mode === "delete" && selectedSlot && (
        <DeletePreview slot={selectedSlot} />
      )}
    </>
  );
}

function SwapFields({
  selectedSlot,
  teacherOptions,
  dayOptions,
  periodOptions,
  targetTeacherId,
  targetDayOfWeek,
  targetPeriodNumber,
  onSlotChange,
  onTargetTeacherChange,
  onTargetDayChange,
  onTargetPeriodChange,
  slots,
}: {
  selectedSlot: WeeklyScheduleReadDto | null;
  teacherOptions: SelectOption[];
  dayOptions: SelectOption[];
  periodOptions: SelectOption[];
  targetTeacherId: string;
  targetDayOfWeek: string;
  targetPeriodNumber: string;
  onSlotChange: (value: string) => void;
  onTargetTeacherChange: (value: string) => void;
  onTargetDayChange: (value: string) => void;
  onTargetPeriodChange: (value: string) => void;
  slots: WeeklyScheduleReadDto[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <Select
        value={selectedSlot ? String(selectedSlot.id) : ""}
        onChange={onSlotChange}
        options={slots.map((slot) => ({
          value: String(slot.id),
          label: slotLabel(slot.teacherName, slot.dayOfWeek, slot.periodNumber),
        }))}
        placeholder="التعيين الأول"
        aria-label="التعيين الأول"
      />
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
        <ArrowRightLeft size={16} />
        الموضع الثاني
      </div>
      <SearchableSelect
        value={targetTeacherId}
        onChange={onTargetTeacherChange}
        options={teacherOptions}
        placeholder="اختر معلماً"
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          value={targetDayOfWeek}
          onChange={onTargetDayChange}
          options={dayOptions}
          placeholder="اليوم"
          aria-label="اليوم الثاني"
        />
        <Select
          value={targetPeriodNumber}
          onChange={onTargetPeriodChange}
          options={periodOptions}
          placeholder="الحصة"
          aria-label="الحصة الثانية"
        />
      </div>
    </div>
  );
}

function DeletePreview({ slot }: { slot: WeeklyScheduleReadDto }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-800">
      <Trash2 size={16} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">سيتم حذف التعيين المحدد</p>
        <p className="mt-1 text-xs text-red-700">
          {dayName(slot.dayOfWeek)}، الحصة {slot.periodNumber} — {contentLabel(slot)}
        </p>
      </div>
    </div>
  );
}

function buildRequest({
  mode,
  selectedSlot,
  teacherId,
  dayOfWeek,
  periodNumber,
  classId,
  eventId,
  targetTeacherId,
  targetDayOfWeek,
  targetPeriodNumber,
}: {
  mode: EditorMode;
  selectedSlot: WeeklyScheduleReadDto | null;
  teacherId: string;
  dayOfWeek: string;
  periodNumber: string;
  classId: string;
  eventId: string;
  targetTeacherId: string;
  targetDayOfWeek: string;
  targetPeriodNumber: string;
}): WeeklyScheduleBulkEditRequest {
  const payload = {
    teacherId: Number(teacherId),
    dayOfWeek: Number(dayOfWeek),
    periodNumber: Number(periodNumber),
    classId: classId === "none" ? null : Number(classId),
    eventId: eventId === "none" ? null : Number(eventId),
  };

  if (mode === "create") {
    return { creates: [payload], updates: [], deletes: [], swaps: [] };
  }
  if (mode === "update") {
    return {
      creates: [],
      updates: [{ id: selectedSlot!.id, payload }],
      deletes: [],
      swaps: [],
    };
  }
  if (mode === "delete") {
    return {
      creates: [],
      updates: [],
      deletes: [selectedSlot!.id],
      swaps: [],
    };
  }

  return {
    creates: [],
    updates: [],
    deletes: [],
    swaps: [
      {
        slotA: {
          teacherId: selectedSlot!.teacherId,
          dayOfWeek: selectedSlot!.dayOfWeek,
          periodNumber: selectedSlot!.periodNumber,
        },
        slotB: {
          teacherId: Number(targetTeacherId),
          dayOfWeek: Number(targetDayOfWeek),
          periodNumber: Number(targetPeriodNumber),
        },
      },
    ],
  };
}
