import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Button, Form } from "react-aria-components";
import { SearchableSelect } from "../../../components/controls/SearchableSelect";
import { Select, type SelectOption } from "../../../components/controls/Select";
import { ModalShell } from "../../../components/modals/ModalShell";
import {
  ModalBody,
  ModalErrorBanner,
  ModalFooter,
  ModalHeader,
} from "../../../components/modals/ModalParts";
import { getErrorMessage } from "../../../lib/apiErrors";
import type { EventKeyReadDto } from "../../events/types";
import type { SchoolClassReadDto } from "../../classes/types";
import type { TeacherReadDto } from "../../teachers/types";
import { useWeeklyScheduleEditDraft } from "../hooks";
import { DAYS, PERIODS, slotLabel } from "../lib/labels";
import type {
  ScheduleDraftRow,
  ScheduleEditMode,
  WeeklyScheduleBulkEditRequest,
  WeeklyScheduleReadDto,
} from "../types";

interface ScheduleEditWorkspaceProps {
  isOpen: boolean;
  baseSlots: WeeklyScheduleReadDto[];
  teachers: TeacherReadDto[];
  classes: SchoolClassReadDto[];
  events: EventKeyReadDto[];
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (request: WeeklyScheduleBulkEditRequest) => Promise<void>;
}

const MODE_OPTIONS: SelectOption[] = [
  { value: "create", label: "إضافة تعيين" },
  { value: "update", label: "تعديل تعيين" },
  { value: "delete", label: "حذف تعيين" },
  { value: "swap", label: "تبديل موضعين" },
];

const DAY_OPTIONS: SelectOption[] = DAYS.map((day) => ({
  value: String(day.value),
  label: day.label,
}));

const PERIOD_OPTIONS: SelectOption[] = PERIODS.map((period) => ({
  value: String(period),
  label: `الحصة ${period}`,
}));

export function ScheduleEditWorkspace({
  isOpen,
  baseSlots,
  teachers,
  classes,
  events,
  isLoading,
  onClose,
  onSubmit,
}: ScheduleEditWorkspaceProps) {
  const draft = useWeeklyScheduleEditDraft(baseSlots);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

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
      ...classes.map((schoolClass) => ({
        value: String(schoolClass.id),
        label: schoolClass.displayName,
      })),
    ],
    [classes],
  );
  const eventOptions = useMemo<SelectOption[]>(
    () => [
      { value: "none", label: "بدون حدث" },
      ...events.map((event) => ({
        value: String(event.id),
        label: event.eventName,
      })),
    ],
    [events],
  );
  const slotOptions = useMemo<SelectOption[]>(
    () => [
      { value: "none", label: "اختر تعييناً موجوداً" },
      ...baseSlots.map((slot) => ({
        value: String(slot.id),
        label: slotLabel(slot.teacherName, slot.dayOfWeek, slot.periodNumber),
      })),
    ],
    [baseSlots],
  );

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    draft.reset();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(draft.request);
      draft.reset();
      onClose();
    } catch (submitError) {
      setError(submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      size="xl"
      isBusy={isSubmitting}
      onOpenChange={(open) => !open && handleClose()}
    >
      <Form onSubmit={handleSubmit} className="contents">
        <ModalHeader
          title="تعديل الجدول الأسبوعي"
          isBusy={isSubmitting}
          onClose={handleClose}
        />
        <fieldset
          disabled={isSubmitting}
          className="contents"
          onChange={() => error && setError(null)}
        >
          <ModalBody>
            {error != null && <ModalErrorBanner message={getErrorMessage(error)} />}
            <WorkspaceIntro rowCount={draft.rows.length} />
            {isLoading ? (
              <WorkspaceLoading />
            ) : draft.rows.length === 0 ? (
              <WorkspaceEmpty onAdd={() => draft.addRow()} />
            ) : (
              <div className="flex flex-col gap-3">
                {draft.rows.map((row, index) => (
                  <ScheduleDraftRowEditor
                    key={row.id}
                    index={index}
                    row={row}
                    slots={baseSlots}
                    teacherOptions={teacherOptions}
                    classOptions={classOptions}
                    eventOptions={eventOptions}
                    slotOptions={slotOptions}
                    onPatch={(patch) => draft.updateRow(row.id, patch)}
                    onRemove={() => draft.removeRow(row.id)}
                  />
                ))}
                <Button
                  type="button"
                  onPress={() => draft.addRow()}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 px-4 text-sm font-medium text-blue-700 outline-none transition-colors hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500/30"
                >
                  <Plus size={16} />
                  إضافة تعديل آخر
                </Button>
              </div>
            )}
          </ModalBody>
        </fieldset>
        <ModalFooter
          isBusy={isSubmitting}
          onCancel={handleClose}
          submitLabel="حفظ كل التعديلات"
          busyLabel="جارٍ الحفظ..."
          submitDisabled={!draft.canSubmit || isLoading}
          icon={<Save size={16} />}
        />
      </Form>
    </ModalShell>
  );
}

function WorkspaceIntro({ rowCount }: { rowCount: number }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-blue-950">مساحة تعديلات مركزية</p>
        <p className="mt-1 text-xs leading-relaxed text-blue-800/80">
          أضف كل التغييرات المطلوبة هنا ثم احفظها دفعة واحدة. الجدول نفسه للعرض
          فقط حتى لا تتغير البيانات بالخطأ.
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
        {rowCount} تعديلات
      </span>
    </div>
  );
}

function WorkspaceEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-400 shadow-sm">
        <Plus size={22} />
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-800">لا توجد تعديلات بعد</p>
        <p className="mt-1 text-xs text-neutral-400">
          ابدأ بإضافة تعيين أو تعديل أو حذف أو تبديل.
        </p>
      </div>
      <Button
        type="button"
        onPress={onAdd}
        className="mt-1 flex min-h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-medium text-white outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500/30"
      >
        <Plus size={16} />
        إضافة أول تعديل
      </Button>
    </div>
  );
}

function WorkspaceLoading() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-2xl border border-neutral-100 bg-neutral-50"
        />
      ))}
    </div>
  );
}

function ScheduleDraftRowEditor({
  index,
  row,
  slots,
  teacherOptions,
  classOptions,
  eventOptions,
  slotOptions,
  onPatch,
  onRemove,
}: {
  index: number;
  row: ScheduleDraftRow;
  slots: WeeklyScheduleReadDto[];
  teacherOptions: SelectOption[];
  classOptions: SelectOption[];
  eventOptions: SelectOption[];
  slotOptions: SelectOption[];
  onPatch: (patch: Partial<Omit<ScheduleDraftRow, "id">>) => void;
  onRemove: () => void;
}) {
  const selectedSlot = slots.find((slot) => String(slot.id) === row.slotId);
  const isDestructive = row.mode === "delete";

  const handleModeChange = (value: string) => {
    onPatch({ mode: value as ScheduleEditMode });
  };

  const handleSlotChange = (value: string) => {
    if (value === "none") {
      onPatch({ slotId: "" });
      return;
    }
    const slot = slots.find((candidate) => String(candidate.id) === value);
    if (!slot) return;
    onPatch({
      slotId: value,
      teacherId: String(slot.teacherId),
      dayOfWeek: String(slot.dayOfWeek),
      periodNumber: String(slot.periodNumber),
      classId: slot.classId === null ? "none" : String(slot.classId),
      eventId: slot.eventId === null ? "none" : String(slot.eventId),
    });
  };

  return (
    <section
      className={`rounded-2xl border p-4 ${
        isDestructive
          ? "border-red-100 bg-red-50/30"
          : "border-neutral-200/80 bg-white"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500">
            {index + 1}
          </span>
          <h3 className="text-sm font-semibold text-neutral-800">تعديل مجدول</h3>
        </div>
        <Button
          type="button"
          onPress={onRemove}
          aria-label="إزالة التعديل"
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 outline-none transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-500/30"
        >
          <Trash2 size={16} />
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <Select
          value={row.mode}
          onChange={handleModeChange}
          options={MODE_OPTIONS}
          placeholder="نوع العملية"
          aria-label="نوع العملية"
        />

        {row.mode === "swap" ? (
          <SwapDraftFields
            row={row}
            selectedSlot={selectedSlot}
            teacherOptions={teacherOptions}
            dayOptions={DAY_OPTIONS}
            periodOptions={PERIOD_OPTIONS}
            slotOptions={slotOptions}
            onSlotChange={handleSlotChange}
            onPatch={onPatch}
          />
        ) : (
          <ContentDraftFields
            row={row}
            teacherOptions={teacherOptions}
            classOptions={classOptions}
            eventOptions={eventOptions}
            dayOptions={DAY_OPTIONS}
            periodOptions={PERIOD_OPTIONS}
            slotOptions={slotOptions}
            slots={slots}
            onSlotChange={handleSlotChange}
            onPatch={onPatch}
          />
        )}
      </div>
    </section>
  );
}

function ContentDraftFields({
  row,
  teacherOptions,
  classOptions,
  eventOptions,
  dayOptions,
  periodOptions,
  slotOptions,
  slots,
  onSlotChange,
  onPatch,
}: {
  row: ScheduleDraftRow;
  teacherOptions: SelectOption[];
  classOptions: SelectOption[];
  eventOptions: SelectOption[];
  dayOptions: SelectOption[];
  periodOptions: SelectOption[];
  slotOptions: SelectOption[];
  slots: WeeklyScheduleReadDto[];
  onSlotChange: (value: string) => void;
  onPatch: (patch: Partial<Omit<ScheduleDraftRow, "id">>) => void;
}) {
  return (
    <>
      {row.mode !== "create" && (
        <Select
          value={row.slotId || "none"}
          onChange={onSlotChange}
          options={slotOptions}
          placeholder="التعيين الحالي"
          aria-label="التعيين الحالي"
        />
      )}
      {row.mode !== "delete" && (
        <>
          <SearchableSelect
            value={row.teacherId}
            onChange={(value) => onPatch({ teacherId: value })}
            options={teacherOptions}
            placeholder="اختر معلماً"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={row.dayOfWeek}
              onChange={(value) => onPatch({ dayOfWeek: value })}
              options={dayOptions}
              placeholder="اليوم"
              aria-label="اليوم"
            />
            <Select
              value={row.periodNumber}
              onChange={(value) => onPatch({ periodNumber: value })}
              options={periodOptions}
              placeholder="الحصة"
              aria-label="الحصة"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={row.classId}
              onChange={(value) => onPatch({ classId: value })}
              options={classOptions}
              placeholder="الفصل"
              aria-label="الفصل"
            />
            <Select
              value={row.eventId}
              onChange={(value) => onPatch({ eventId: value })}
              options={eventOptions}
              placeholder="الحدث"
              aria-label="الحدث"
            />
          </div>
        </>
      )}
      {row.mode === "delete" && (
        <CurrentSlotPreview
          slot={slots.find((slot) => String(slot.id) === row.slotId)}
        />
      )}
    </>
  );
}

function SwapDraftFields({
  row,
  selectedSlot,
  teacherOptions,
  dayOptions,
  periodOptions,
  slotOptions,
  onSlotChange,
  onPatch,
}: {
  row: ScheduleDraftRow;
  selectedSlot: WeeklyScheduleReadDto | undefined;
  teacherOptions: SelectOption[];
  dayOptions: SelectOption[];
  periodOptions: SelectOption[];
  slotOptions: SelectOption[];
  onSlotChange: (value: string) => void;
  onPatch: (patch: Partial<Omit<ScheduleDraftRow, "id">>) => void;
}) {
  return (
    <>
      <Select
        value={row.slotId || "none"}
        onChange={onSlotChange}
        options={slotOptions}
        placeholder="الموضع الأول"
        aria-label="الموضع الأول"
      />
      {selectedSlot && (
        <p className="text-xs text-neutral-500">
          {selectedSlot.teacherName} — اليوم {selectedSlot.dayOfWeek}، الحصة {selectedSlot.periodNumber}
        </p>
      )}
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
        <ArrowRightLeft size={16} />
        الموضع الثاني
      </div>
      <SearchableSelect
        value={row.targetTeacherId}
        onChange={(value) => onPatch({ targetTeacherId: value })}
        options={teacherOptions}
        placeholder="اختر معلماً"
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          value={row.targetDayOfWeek}
          onChange={(value) => onPatch({ targetDayOfWeek: value })}
          options={dayOptions}
          placeholder="اليوم"
          aria-label="اليوم الثاني"
        />
        <Select
          value={row.targetPeriodNumber}
          onChange={(value) => onPatch({ targetPeriodNumber: value })}
          options={periodOptions}
          placeholder="الحصة"
          aria-label="الحصة الثانية"
        />
      </div>
    </>
  );
}

function CurrentSlotPreview({ slot }: { slot: WeeklyScheduleReadDto | undefined }) {
  if (!slot) {
    return (
      <p className="text-xs text-neutral-400">
        اختر تعييناً موجوداً لإتمام عملية الحذف.
      </p>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
      <Trash2 size={14} />
      {slotLabel(slot.teacherName, slot.dayOfWeek, slot.periodNumber)}
    </div>
  );
}
