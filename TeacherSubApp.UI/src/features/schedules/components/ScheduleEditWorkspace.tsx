import { useMemo, useState, type FormEvent } from "react";
import { ArrowRightLeft, Check, ChevronLeft, Plus, Save, Trash2 } from "lucide-react";
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

type WorkspaceStep = "choose" | "configure" | "review";

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

const OPERATION_CARDS: {
  mode: ScheduleEditMode;
  title: string;
  description: string;
  icon: typeof Plus;
  tone: string;
}[] = [
  {
    mode: "create",
    title: "إضافة تعيين",
    description: "أضف معلماً إلى فصل أو حدث في موضع محدد.",
    icon: Plus,
    tone: "border-blue-100 bg-blue-50/60 text-blue-700",
  },
  {
    mode: "update",
    title: "تعديل تعيين",
    description: "غيّر المعلم أو الموضع أو محتوى تعيين موجود.",
    icon: Check,
    tone: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
  },
  {
    mode: "delete",
    title: "حذف تعيين",
    description: "أزل تعييناً موجوداً من الجدول بشكل آمن.",
    icon: Trash2,
    tone: "border-red-100 bg-red-50/60 text-red-700",
  },
  {
    mode: "swap",
    title: "تبديل موضعين",
    description: "بدّل محتوى موضعين بالاعتماد على إحداثيات الجدول.",
    icon: ArrowRightLeft,
    tone: "border-violet-100 bg-violet-50/60 text-violet-700",
  },
];

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
  const [step, setStep] = useState<WorkspaceStep>("choose");
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
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

  const activeRow = draft.rows.find((row) => row.id === activeRowId) ?? null;
  const activeRowIsValid = activeRow ? draft.isRowValid(activeRow) : false;

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    setStep("choose");
    setActiveRowId(null);
    draft.reset();
    onClose();
  };

  const handleChooseOperation = (mode: ScheduleEditMode) => {
    const rowId = draft.addRow(mode);
    setActiveRowId(rowId);
    setStep("configure");
    setError(null);
  };

  const handleRemoveRow = (rowId: string) => {
    draft.removeRow(rowId);
    if (rowId === activeRowId) {
      setActiveRowId(null);
      setStep("review");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (step === "choose") {
      setError("اختر نوع التعديل أولاً.");
      return;
    }
    if (step === "configure") {
      if (!activeRow || !activeRowIsValid) {
        setError("أكمل بيانات التعديل قبل إضافته إلى المراجعة.");
        return;
      }
      setActiveRowId(null);
      setStep("review");
      return;
    }
    if (!draft.canSubmit) {
      setError("راجع التعديلات غير المكتملة قبل الحفظ.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(draft.request);
      handleClose();
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
            {error != null && (
              <ModalErrorBanner
                message={typeof error === "string" ? error : getErrorMessage(error)}
              />
            )}
            <WorkspaceProgress step={step} rowCount={draft.rows.length} />
            {isLoading ? (
              <WorkspaceLoading />
            ) : step === "choose" ? (
              <OperationChooser onChoose={handleChooseOperation} />
            ) : step === "configure" && activeRow ? (
              <ScheduleDraftRowEditor
                row={activeRow}
                slots={baseSlots}
                teacherOptions={teacherOptions}
                classOptions={classOptions}
                eventOptions={eventOptions}
                slotOptions={slotOptions}
                onPatch={(patch) => draft.updateRow(activeRow.id, patch)}
                onRemove={() => handleRemoveRow(activeRow.id)}
                onBack={() => {
                  setActiveRowId(null);
                  setStep("choose");
                }}
              />
            ) : (
              <ReviewStep
                rows={draft.rows}
                slots={baseSlots}
                onEdit={(rowId) => {
                  setActiveRowId(rowId);
                  setStep("configure");
                }}
                onRemove={handleRemoveRow}
                onAdd={() => setStep("choose")}
              />
            )}
          </ModalBody>
        </fieldset>
        <ModalFooter
          isBusy={isSubmitting}
          onCancel={handleClose}
          submitLabel={step === "configure" ? "إضافة للمراجعة" : "حفظ كل التعديلات"}
          busyLabel="جارٍ الحفظ..."
          submitDisabled={
            isLoading ||
            (step === "choose" ? true : step === "configure" ? !activeRowIsValid : !draft.canSubmit)
          }
          icon={step === "review" ? <Save size={16} /> : undefined}
        />
      </Form>
    </ModalShell>
  );
}

function WorkspaceProgress({
  step,
  rowCount,
}: {
  step: WorkspaceStep;
  rowCount: number;
}) {
  const steps = [
    { id: "choose", label: "اختيار العملية" },
    { id: "configure", label: "إدخال التفاصيل" },
    { id: "review", label: "مراجعة وحفظ" },
  ] as const;
  const currentIndex = steps.findIndex((item) => item.id === step);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-950">محرر مركزي للجدول</p>
          <p className="mt-1 text-xs leading-relaxed text-blue-800/80">
            حضّر التعديلات على كامل الجدول، ثم راجعها واحفظها دفعة واحدة.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
          {rowCount} تعديلات
        </span>
      </div>
      <ol className="grid grid-cols-3 gap-2 text-[11px]">
        {steps.map((item, index) => (
          <li
            key={item.id}
            className={`rounded-full px-2 py-1.5 text-center ${
              index <= currentIndex
                ? "bg-blue-600 font-semibold text-white"
                : "bg-white/70 text-blue-700/60"
            }`}
          >
            {index + 1}. {item.label}
          </li>
        ))}
      </ol>
    </div>
  );
}

function OperationChooser({
  onChoose,
}: {
  onChoose: (mode: ScheduleEditMode) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {OPERATION_CARDS.map(({ mode, title, description, icon: Icon, tone }) => (
        <Button
          key={mode}
          type="button"
          onPress={() => onChoose(mode)}
          className={`flex min-h-32 flex-col items-start gap-3 rounded-2xl border p-4 text-start outline-none transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500/30 ${tone}`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80">
            <Icon size={18} />
          </span>
          <span>
            <span className="block text-sm font-semibold">{title}</span>
            <span className="mt-1 block text-xs leading-relaxed opacity-80">
              {description}
            </span>
          </span>
        </Button>
      ))}
    </div>
  );
}

function ReviewStep({
  rows,
  slots,
  onEdit,
  onRemove,
  onAdd,
}: {
  rows: ScheduleDraftRow[];
  slots: WeeklyScheduleReadDto[];
  onEdit: (rowId: string) => void;
  onRemove: (rowId: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">راجع التعديلات</h2>
          <p className="mt-1 text-xs text-neutral-500">
            لن يتم إرسال أي تغيير قبل الضغط على حفظ كل التعديلات.
          </p>
        </div>
        <Button
          type="button"
          onPress={onAdd}
          className="flex min-h-10 items-center gap-1.5 rounded-full bg-blue-50 px-4 text-xs font-semibold text-blue-700 outline-none hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-500/30"
        >
          <Plus size={14} />
          إضافة
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <ReviewRow
            key={row.id}
            index={index}
            row={row}
            slots={slots}
            onEdit={() => onEdit(row.id)}
            onRemove={() => onRemove(row.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewRow({
  index,
  row,
  slots,
  onEdit,
  onRemove,
}: {
  index: number;
  row: ScheduleDraftRow;
  slots: WeeklyScheduleReadDto[];
  onEdit: () => void;
  onRemove: () => void;
}) {
  const slot = slots.find((candidate) => String(candidate.id) === row.slotId);
  const title = MODE_OPTIONS.find((option) => option.value === row.mode)?.label;
  const details =
    row.mode === "delete"
      ? slot
        ? slotLabel(slot.teacherName, slot.dayOfWeek, slot.periodNumber)
        : "لم يتم اختيار التعيين"
      : row.mode === "swap"
        ? slot
          ? `${slotLabel(slot.teacherName, slot.dayOfWeek, slot.periodNumber)} ← الموضع الثاني`
          : "لم يتم اختيار الموضع الأول"
        : `${row.teacherId ? "معلم محدد" : "المعلم غير محدد"} — ${
            row.classId !== "none" || row.eventId !== "none"
              ? "محتوى محدد"
              : "المحتوى غير محدد"
          }`;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200/80 bg-white px-3 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-neutral-800">{title}</p>
        <p className="mt-1 truncate text-[11px] text-neutral-500">{details}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          onPress={onEdit}
          className="rounded-full px-3 py-2 text-xs font-medium text-blue-700 outline-none hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500/30"
        >
          تعديل
        </Button>
        <Button
          type="button"
          onPress={onRemove}
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 outline-none hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-500/30"
          aria-label="إزالة التعديل"
        >
          <Trash2 size={15} />
        </Button>
      </div>
    </div>
  );
}

function ScheduleDraftRowEditor({
  row,
  slots,
  teacherOptions,
  classOptions,
  eventOptions,
  slotOptions,
  onPatch,
  onRemove,
  onBack,
}: {
  row: ScheduleDraftRow;
  slots: WeeklyScheduleReadDto[];
  teacherOptions: SelectOption[];
  classOptions: SelectOption[];
  eventOptions: SelectOption[];
  slotOptions: SelectOption[];
  onPatch: (patch: Partial<Omit<ScheduleDraftRow, "id">>) => void;
  onRemove: () => void;
  onBack: () => void;
}) {
  const selectedSlot = slots.find((slot) => String(slot.id) === row.slotId);

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">إدخال تفاصيل العملية</h2>
          <p className="mt-1 text-xs text-neutral-500">
            أكمل هذا التعديل ثم أضفه إلى قائمة المراجعة.
          </p>
        </div>
        <Button
          type="button"
          onPress={onBack}
          className="flex min-h-10 items-center gap-1 rounded-full px-3 text-xs font-medium text-neutral-600 outline-none hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-500/30"
        >
          <ChevronLeft size={14} />
          رجوع
        </Button>
      </div>
      <Select
        value={row.mode}
        onChange={(value) => onPatch({ mode: value as ScheduleEditMode })}
        options={MODE_OPTIONS}
        placeholder="نوع العملية"
        aria-label="نوع العملية"
      />
      {row.mode !== "create" && (
        <Select
          value={row.slotId || "none"}
          onChange={handleSlotChange}
          options={slotOptions}
          placeholder="اختر التعيين الحالي"
          aria-label="التعيين الحالي"
        />
      )}
      {row.mode === "delete" ? (
        <DeletePreview slot={selectedSlot} />
      ) : row.mode === "swap" ? (
        <SwapFields
          row={row}
          selectedSlot={selectedSlot}
          teacherOptions={teacherOptions}
          onPatch={onPatch}
        />
      ) : (
        <ContentFields
          row={row}
          teacherOptions={teacherOptions}
          classOptions={classOptions}
          eventOptions={eventOptions}
          onPatch={onPatch}
        />
      )}
      <Button
        type="button"
        onPress={onRemove}
        className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50/50 text-xs font-medium text-red-700 outline-none hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500/30"
      >
        <Trash2 size={14} />
        إزالة هذه العملية
      </Button>
    </div>
  );
}

function ContentFields({
  row,
  teacherOptions,
  classOptions,
  eventOptions,
  onPatch,
}: {
  row: ScheduleDraftRow;
  teacherOptions: SelectOption[];
  classOptions: SelectOption[];
  eventOptions: SelectOption[];
  onPatch: (patch: Partial<Omit<ScheduleDraftRow, "id">>) => void;
}) {
  return (
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
          options={DAY_OPTIONS}
          placeholder="اليوم"
          aria-label="اليوم"
        />
        <Select
          value={row.periodNumber}
          onChange={(value) => onPatch({ periodNumber: value })}
          options={PERIOD_OPTIONS}
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
      <p className="text-xs leading-relaxed text-neutral-400">
        يجب تحديد معلم وموضع صحيح، وتعيين فصل أو حدث واحد على الأقل.
      </p>
    </>
  );
}

function SwapFields({
  row,
  selectedSlot,
  teacherOptions,
  onPatch,
}: {
  row: ScheduleDraftRow;
  selectedSlot: WeeklyScheduleReadDto | undefined;
  teacherOptions: SelectOption[];
  onPatch: (patch: Partial<Omit<ScheduleDraftRow, "id">>) => void;
}) {
  return (
    <>
      {selectedSlot && (
        <div className="rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2 text-xs text-violet-800">
          الموضع الأول: {slotLabel(selectedSlot.teacherName, selectedSlot.dayOfWeek, selectedSlot.periodNumber)}
        </div>
      )}
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
        <ArrowRightLeft size={16} />
        اختر الموضع الثاني
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
          options={DAY_OPTIONS}
          placeholder="اليوم"
          aria-label="اليوم الثاني"
        />
        <Select
          value={row.targetPeriodNumber}
          onChange={(value) => onPatch({ targetPeriodNumber: value })}
          options={PERIOD_OPTIONS}
          placeholder="الحصة"
          aria-label="الحصة الثانية"
        />
      </div>
    </>
  );
}

function DeletePreview({ slot }: { slot: WeeklyScheduleReadDto | undefined }) {
  return slot ? (
    <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-xs text-red-700">
      <Trash2 size={15} />
      <span>{slotLabel(slot.teacherName, slot.dayOfWeek, slot.periodNumber)}</span>
    </div>
  ) : (
    <p className="text-xs text-neutral-400">اختر تعييناً موجوداً لإتمام الحذف.</p>
  );
}

function WorkspaceLoading() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-2xl border border-neutral-100 bg-neutral-50"
        />
      ))}
    </div>
  );
}
