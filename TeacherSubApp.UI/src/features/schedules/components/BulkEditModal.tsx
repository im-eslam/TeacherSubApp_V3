import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowRightLeft,
  Check,
  ChevronLeft,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Button, Form } from "react-aria-components";
import { SearchableSelect } from "../../../components/controls/SearchableSelect";
import { ModalShell } from "../../../components/modals/ModalShell";
import {
  ModalBody,
  ModalErrorBanner,
  ModalFooter,
  ModalHeader,
} from "../../../components/modals/ModalParts";
import { getErrorMessage } from "../../../lib/apiErrors";
import { useScheduleEditor } from "../hooks";
import { draftsToBulkRequest } from "../store";
import { DAYS, PERIODS, contentLabel, dayName, slotLabel } from "../lib/labels";
import { isScheduleDraftValid } from "../lib/validation";
import type {
  ScheduleDraft,
  ScheduleDraftAdd,
  ScheduleDraftEdit,
  ScheduleDraftSwap,
  ScheduleEditOperation,
  SlotCoordinate,
  WeeklyScheduleReadDto,
} from "../types";

type SelectOption = { value: string; label: string };

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODE_OPTIONS: SelectOption[] = [
  { value: "add", label: "إضافة تعيين" },
  { value: "edit", label: "تعديل تعيين" },
  { value: "swap", label: "تبديل موضعين" },
  { value: "delete", label: "حذف تعيين" },
];

const DAY_OPTIONS: SelectOption[] = DAYS.map((day) => ({
  value: String(day.value),
  label: day.label,
}));

const PERIOD_OPTIONS: SelectOption[] = PERIODS.map((period) => ({
  value: String(period),
  label: `الحصة ${period}`,
}));

const OPERATIONS: {
  operation: ScheduleEditOperation;
  title: string;
  description: string;
  tone: string;
  icon: typeof Plus;
}[] = [
  {
    operation: "add",
    title: "إضافة تعيين",
    description: "أضف معلماً إلى موضع جديد في الجدول.",
    tone: "border-blue-100 bg-blue-50/70 text-blue-700",
    icon: Plus,
  },
  {
    operation: "edit",
    title: "تعديل تعيين",
    description: "غيّر محتوى تعيين موجود مع الحفاظ على السجل.",
    tone: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
    icon: Check,
  },
  {
    operation: "swap",
    title: "تبديل موضعين",
    description: "انقل محتوى موضعين موجودين بسهولة.",
    tone: "border-violet-100 bg-violet-50/70 text-violet-700",
    icon: ArrowRightLeft,
  },
  {
    operation: "delete",
    title: "حذف تعيين",
    description: "أزل تعييناً موجوداً بعد تأكيد العملية.",
    tone: "border-red-100 bg-red-50/70 text-red-700",
    icon: Trash2,
  },
];

export function BulkEditModal({ isOpen, onClose }: BulkEditModalProps) {
  const editor = useScheduleEditor();
  const [error, setError] = useState<unknown>(null);

  const teacherOptions = useMemo<SelectOption[]>(
    () =>
      editor.teachers
        .slice()
        .sort(
          (a, b) =>
            (a.subjectName ?? "").localeCompare(b.subjectName ?? "", "ar") ||
            a.name.localeCompare(b.name, "ar"),
        )
        .map((teacher) => ({
          value: String(teacher.id),
          label: teacher.subjectName
            ? `${teacher.name} — ${teacher.subjectName}`
            : teacher.name,
        })),
    [editor.teachers],
  );
  const classOptions = useMemo<SelectOption[]>(
    () => [
      { value: "none", label: "بدون فصل" },
      ...editor.classes.map((schoolClass) => ({
        value: String(schoolClass.id),
        label: schoolClass.displayName,
      })),
    ],
    [editor.classes],
  );
  const eventOptions = useMemo<SelectOption[]>(
    () => [
      { value: "none", label: "بدون حدث" },
      ...editor.events.map((event) => ({
        value: String(event.id),
        label: event.eventName,
      })),
    ],
    [editor.events],
  );
  const currentDraft = editor.draftStore.currentDraft;
  const currentStep = editor.draftStore.currentStep;
  const currentDraftIsValid = currentDraft
    ? isScheduleDraftValid(currentDraft, editor.slots)
    : false;

  const close = () => {
    if (editor.isSubmitting) return;
    editor.draftStore.reset();
    setError(null);
    onClose();
  };

  const handleChoose = (operation: ScheduleEditOperation) => {
    editor.draftStore.startOperation(operation);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (currentStep === "operation") {
      setError("اختر نوع العملية أولاً.");
      return;
    }

    if (currentStep === "details") {
      if (!currentDraft || !currentDraftIsValid) {
        setError("أكمل بيانات العملية قبل إضافتها إلى المسودة.");
        return;
      }
      const result = editor.draftStore.addCurrentToDraft();
      if (!result.ok) {
        setError(result.reason);
        return;
      }
      return;
    }

    if (editor.draftStore.stagedEdits.length === 0) {
      setError("أضف عملية واحدة على الأقل قبل الحفظ.");
      return;
    }

    try {
      await editor.submit(draftsToBulkRequest(editor.draftStore.stagedEdits));
      close();
    } catch (submitError) {
      setError(submitError);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      size="md"
      isBusy={editor.isSubmitting}
      onOpenChange={(open) => !open && close()}
    >
      <Form onSubmit={handleSubmit} className="contents">
        <ModalHeader
          title="محرر الجدول المركزي"
          isBusy={editor.isSubmitting}
          onClose={close}
        />
        <fieldset disabled={editor.isSubmitting} className="contents">
          <ModalBody>
            {error != null && (
              <ModalErrorBanner
                message={typeof error === "string" ? error : getErrorMessage(error)}
              />
            )}
            <WizardProgress step={currentStep} count={editor.draftStore.stagedEdits.length} />
            {editor.isLoading ? (
              <LoadingState />
            ) : currentStep === "operation" ? (
              <OperationChooser
                onChoose={handleChoose}
                hasDraft={editor.draftStore.stagedEdits.length > 0}
                onReview={() => editor.draftStore.setCurrentStep("review")}
              />
            ) : currentStep === "details" && currentDraft ? (
              <DetailsStep
                key={currentDraft.id}
                draft={currentDraft}
                slots={editor.slots}
                teacherOptions={teacherOptions}
                classOptions={classOptions}
                eventOptions={eventOptions}
                onPatch={editor.draftStore.updateCurrentDraft}
                onBack={() => editor.draftStore.setCurrentStep("operation")}
              />
            ) : (
              <ReviewStep
                stagedEdits={editor.draftStore.stagedEdits}
                slots={editor.slots}
                teachers={editor.teachers}
                classes={editor.classes}
                events={editor.events}
                onEdit={editor.draftStore.editStagedDraft}
                onRemove={editor.draftStore.removeStagedEdit}
                onAdd={() => editor.draftStore.setCurrentStep("operation")}
              />
            )}
          </ModalBody>
        </fieldset>
        <ModalFooter
          isBusy={editor.isSubmitting}
          onCancel={close}
          submitLabel={currentStep === "details" ? "إضافة إلى المسودة" : "تأكيد وحفظ"}
          busyLabel="جارٍ الحفظ..."
          submitDisabled={
            editor.isLoading ||
            (currentStep === "operation" ? true : currentStep === "details" ? !currentDraftIsValid : editor.draftStore.stagedEdits.length === 0)
          }
          icon={currentStep === "review" ? <Save size={16} /> : undefined}
        />
      </Form>
    </ModalShell>
  );
}

function WizardProgress({
  step,
  count,
}: {
  step: "operation" | "details" | "review";
  count: number;
}) {
  const steps = [
    { id: "operation", label: "العملية" },
    { id: "details", label: "التفاصيل" },
    { id: "review", label: "المراجعة" },
  ] as const;
  const currentIndex = steps.findIndex((item) => item.id === step);
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-950">تعديل كامل الجدول</p>
          <p className="mt-1 text-xs leading-relaxed text-blue-800/80">
            جهّز عدة تغييرات ثم احفظها في طلب واحد متسق.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
          {count} مسودة
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        {steps.map((item, index) => (
          <span
            key={item.id}
            className={`rounded-full px-2 py-1.5 text-center ${
              index <= currentIndex
                ? "bg-blue-600 font-semibold text-white"
                : "bg-white/70 text-blue-700/60"
            }`}
          >
            {index + 1}. {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function OperationChooser({
  onChoose,
  hasDraft,
  onReview,
}: {
  onChoose: (operation: ScheduleEditOperation) => void;
  hasDraft: boolean;
  onReview: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {OPERATIONS.map(({ operation, title, description, tone, icon: Icon }) => (
          <Button
            key={operation}
            type="button"
            onPress={() => onChoose(operation)}
            className={`flex min-h-36 flex-col items-start gap-3 rounded-2xl border p-5 text-start outline-none transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500/30 ${tone}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80">
              <Icon size={19} />
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
      {hasDraft && (
        <Button
          type="button"
          onPress={onReview}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold text-neutral-700 outline-none hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-500/30"
        >
          <Save size={16} />
          عرض ومراجعة المسودة قبل الحفظ
        </Button>
      )}
    </div>
  );
}

function DetailsStep({
  draft,
  slots,
  teacherOptions,
  classOptions,
  eventOptions,
  onPatch,
  onBack,
}: {
  draft: ScheduleDraft;
  slots: WeeklyScheduleReadDto[];
  teacherOptions: SelectOption[];
  classOptions: SelectOption[];
  eventOptions: SelectOption[];
  onPatch: (patch: Partial<ScheduleDraft>) => void;
  onBack: () => void;
}) {
  const operationLabel = MODE_OPTIONS.find(
    (option) => option.value === draft.operation,
  )?.label;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">{operationLabel}</p>
          <p className="mt-1 text-xs text-neutral-500">
            أدخل تفاصيل عملية واحدة، ثم أضفها إلى المسودة.
          </p>
        </div>
        <Button
          type="button"
          onPress={onBack}
          className="flex min-h-10 items-center gap-1 rounded-full px-3 text-xs font-medium text-neutral-600 outline-none hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-500/30"
        >
          <ChevronLeft size={14} />
          تغيير العملية
        </Button>
      </div>
      {draft.operation === "add" && (
        <AddFields
          draft={draft}
          teacherOptions={teacherOptions}
          classOptions={classOptions}
          eventOptions={eventOptions}
          onPatch={onPatch}
        />
      )}
      {draft.operation === "edit" && (
        <EditFields
          draft={draft}
          slots={slots}
          classOptions={classOptions}
          eventOptions={eventOptions}
          onPatch={onPatch}
        />
      )}
      {draft.operation === "delete" && (
        <DeleteFields
          draft={draft}
          slots={slots}
          onPatch={onPatch}
        />
      )}
      {draft.operation === "swap" && (
        <SwapFields
          draft={draft}
          slots={slots}
          onPatch={onPatch}
        />
      )}
    </div>
  );
}

function AddFields({
  draft,
  teacherOptions,
  classOptions,
  eventOptions,
  onPatch,
}: {
  draft: ScheduleDraftAdd;
  teacherOptions: SelectOption[];
  classOptions: SelectOption[];
  eventOptions: SelectOption[];
  onPatch: (patch: Partial<ScheduleDraftAdd>) => void;
}) {
  return (
    <>
      <SearchableSelect
        value={String(draft.teacherId ?? "")}
        onChange={(value) => onPatch({ teacherId: toNullableId(value) })}
        options={teacherOptions}
        placeholder="اختر معلماً"
      />
      <CoordinateFields
        dayOfWeek={draft.dayOfWeek}
        periodNumber={draft.periodNumber}
        onChange={(patch) => onPatch(patch)}
      />
      <ContentFields
        classId={draft.classId}
        eventId={draft.eventId}
        classOptions={classOptions}
        eventOptions={eventOptions}
        onChange={(patch) => onPatch(patch)}
      />
      <p className="rounded-xl bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-500">
        يجب تحديد فصل أو حدث واحد على الأقل.
      </p>
    </>
  );
}

function EditFields({
  draft,
  slots,
  classOptions,
  eventOptions,
  onPatch,
}: {
  draft: ScheduleDraftEdit;
  slots: WeeklyScheduleReadDto[];
  classOptions: SelectOption[];
  eventOptions: SelectOption[];
  onPatch: (patch: Partial<ScheduleDraftEdit>) => void;
}) {
  const selectedSlot = slots.find((slot) => slot.id === draft.targetSlotId);
  return (
    <>
      <ExistingSlotPicker
        value={draft.targetSlotId}
        slots={slots}
        onChange={(id) => {
          const slot = slots.find((candidate) => candidate.id === id);
          if (!slot) {
            onPatch({
              targetSlotId: null,
              teacherId: null,
              dayOfWeek: null,
              periodNumber: null,
              classId: null,
              eventId: null,
            });
            return;
          }
          onPatch({
            targetSlotId: slot.id,
            teacherId: slot.teacherId,
            dayOfWeek: slot.dayOfWeek,
            periodNumber: slot.periodNumber,
            classId: slot.classId,
            eventId: slot.eventId,
          });
        }}
        placeholder="اختر المعلم، اليوم، والحصة للتعيين المطلوب تعديله"
      />
      {selectedSlot && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          التعيين الحالي: {contentLabel(selectedSlot)} — {dayName(selectedSlot.dayOfWeek)}، الحصة {selectedSlot.periodNumber}
        </p>
      )}
      <ContentFields
        classId={draft.classId}
        eventId={draft.eventId}
        classOptions={classOptions}
        eventOptions={eventOptions}
        onChange={(patch) => onPatch(patch)}
      />
    </>
  );
}

function DeleteFields({
  draft,
  slots,
  onPatch,
}: {
  draft: { targetSlotId: number | null };
  slots: WeeklyScheduleReadDto[];
  onPatch: (patch: Partial<ScheduleDraft>) => void;
}) {
  const selectedSlot = slots.find((slot) => slot.id === draft.targetSlotId);
  return (
    <>
      <ExistingSlotPicker
        value={draft.targetSlotId}
        slots={slots}
        onChange={(id) => onPatch({ targetSlotId: id })}
        placeholder="اختر المعلم، اليوم، والحصة للتعيين المطلوب حذفه"
      />
      <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-xs leading-relaxed text-red-700">
        <Trash2 size={15} className="mt-0.5 shrink-0" />
        {selectedSlot
          ? `سيتم حذف ${slotLabel(selectedSlot.teacherName, selectedSlot.dayOfWeek, selectedSlot.periodNumber)} من الجدول. هذا الإجراء لا يمكن التراجع عنه من هذه المسودة.`
          : "اختر تعييناً موجوداً لعرض تحذير الحذف."}
      </div>
    </>
  );
}

function SwapFields({
  draft,
  slots,
  onPatch,
}: {
  draft: ScheduleDraftSwap;
  slots: WeeklyScheduleReadDto[];
  onPatch: (patch: Partial<ScheduleDraftSwap>) => void;
}) {
  return (
    <>
      <ExistingSlotPicker
        value={slotIdFromCoordinate(slots, draft.slotA)}
        slots={slots}
        onChange={(id) => onPatch({ slotA: coordinateFromId(slots, id) })}
        placeholder="الموضع الأول: اختر معلماً ثم اليوم والحصة"
      />
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
        <ArrowRightLeft size={16} />
        الموضع الثاني
      </div>
      <ExistingSlotPicker
        value={slotIdFromCoordinate(slots, draft.slotB)}
        slots={slots}
        onChange={(id) => onPatch({ slotB: coordinateFromId(slots, id) })}
        placeholder="الموضع الثاني: اختر معلماً ثم اليوم والحصة"
      />
      <p className="text-xs leading-relaxed text-neutral-400">
        التبديل يعتمد على موضعين موجودين في الجدول، ولا يسمح بتحديد الموضع نفسه مرتين.
      </p>
    </>
  );
}

function ExistingSlotPicker({
  value,
  slots,
  onChange,
  placeholder,
}: {
  value: number | null;
  slots: WeeklyScheduleReadDto[];
  onChange: (id: number | null) => void;
  placeholder: string;
}) {
  const selectedSlot = slots.find((slot) => slot.id === value);
  const [teacherId, setTeacherId] = useState<number | null>(selectedSlot?.teacherId ?? null);
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(selectedSlot?.dayOfWeek ?? null);

  const teacherOptions = Array.from(
    new Map(slots.map((slot) => [slot.teacherId, slot.teacherName])).entries(),
  )
    .sort((a, b) => a[1].localeCompare(b[1], "ar"))
    .map(([id, name]) => ({ value: String(id), label: name }));
  const dayOptions = Array.from(
    new Map(
      slots
        .filter((slot) => slot.teacherId === teacherId)
        .map((slot) => [slot.dayOfWeek, dayName(slot.dayOfWeek)]),
    ).entries(),
  )
    .sort(([a], [b]) => a - b)
    .map(([day, label]) => ({ value: String(day), label }));
  const periodOptions = Array.from(
    new Set(
      slots
        .filter(
          (slot) => slot.teacherId === teacherId && slot.dayOfWeek === dayOfWeek,
        )
        .map((slot) => slot.periodNumber),
    ),
  )
    .sort((a, b) => a - b)
    .map((period) => ({ value: String(period), label: `الحصة ${period}` }));

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <SearchableSelect
        value={teacherId === null ? "" : String(teacherId)}
        onChange={(nextValue) => {
          setTeacherId(Number(nextValue));
          setDayOfWeek(null);
          onChange(null);
        }}
        options={teacherOptions}
        placeholder="المعلم"
        disabled={slots.length === 0}
      />
      <SearchableSelect
        value={dayOfWeek === null ? "" : String(dayOfWeek)}
        onChange={(nextValue) => {
          setDayOfWeek(Number(nextValue));
          onChange(null);
        }}
        options={dayOptions}
        placeholder="اليوم"
        disabled={teacherId === null || dayOptions.length === 0}
      />
      <SearchableSelect
        value={value === null ? "" : String(value)}
        onChange={(nextValue) => {
          const slot = slots.find(
            (candidate) =>
              candidate.teacherId === teacherId &&
              candidate.dayOfWeek === dayOfWeek &&
              candidate.periodNumber === Number(nextValue),
          );
          onChange(slot?.id ?? null);
        }}
        options={periodOptions}
        placeholder="الحصة"
        disabled={dayOfWeek === null || periodOptions.length === 0}
      />
      <p className="sm:col-span-3 text-xs leading-relaxed text-neutral-400">
        {value === null ? placeholder : "تم اختيار موضع موجود في الجدول."}
      </p>
    </div>
  );
}

function CoordinateFields({
  dayOfWeek,
  periodNumber,
  onChange,
}: {
  dayOfWeek: number | null;
  periodNumber: number | null;
  onChange: (patch: { dayOfWeek: number; periodNumber: number }) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <SearchableSelect
        value={String(dayOfWeek ?? "")}
        onChange={(value) => onChange({ dayOfWeek: Number(value), periodNumber: periodNumber ?? 1 })}
        options={DAY_OPTIONS}
        placeholder="اليوم"
      />
      <SearchableSelect
        value={String(periodNumber ?? "")}
        onChange={(value) => onChange({ dayOfWeek: dayOfWeek ?? 1, periodNumber: Number(value) })}
        options={PERIOD_OPTIONS}
        placeholder="الحصة"
      />
    </div>
  );
}

function ContentFields({
  classId,
  eventId,
  classOptions,
  eventOptions,
  onChange,
}: {
  classId: number | null;
  eventId: number | null;
  classOptions: SelectOption[];
  eventOptions: SelectOption[];
  onChange: (patch: { classId: number | null; eventId: number | null }) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <SearchableSelect
        value={toNullableValue(classId)}
        onChange={(value) => onChange({ classId: toNullableId(value), eventId })}
        options={classOptions}
        placeholder="الفصل"
      />
      <SearchableSelect
        value={toNullableValue(eventId)}
        onChange={(value) => onChange({ classId, eventId: toNullableId(value) })}
        options={eventOptions}
        placeholder="الحدث"
      />
    </div>
  );
}

function ReviewStep({
  stagedEdits,
  slots,
  teachers,
  classes,
  events,
  onEdit,
  onRemove,
  onAdd,
}: {
  stagedEdits: ScheduleDraft[];
  slots: WeeklyScheduleReadDto[];
  teachers: { id: number; name: string }[];
  classes: { id: number; displayName: string }[];
  events: { id: number; eventName: string }[];
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">مراجعة التعديلات</h2>
          <p className="mt-1 text-xs text-neutral-500">
            لن يتم تغيير الجدول حتى تضغط على تأكيد وحفظ.
          </p>
        </div>
        <Button
          type="button"
          onPress={onAdd}
          className="flex min-h-10 items-center gap-1.5 rounded-full bg-blue-50 px-4 text-xs font-semibold text-blue-700 outline-none hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-500/30"
        >
          <Plus size={14} />
          إضافة عملية
        </Button>
      </div>
      {stagedEdits.map((draft, index) => (
        <ReviewRow
          key={draft.id}
          draft={draft}
          index={index}
          slots={slots}
          teachers={teachers}
          classes={classes}
          events={events}
          onEdit={() => onEdit(draft.id)}
          onRemove={() => onRemove(draft.id)}
        />
      ))}
    </div>
  );
}

function ReviewRow({
  draft,
  index,
  slots,
  teachers,
  classes,
  events,
  onEdit,
  onRemove,
}: {
  draft: ScheduleDraft;
  index: number;
  slots: WeeklyScheduleReadDto[];
  teachers: { id: number; name: string }[];
  classes: { id: number; displayName: string }[];
  events: { id: number; eventName: string }[];
  onEdit: () => void;
  onRemove: () => void;
}) {
  const title = MODE_OPTIONS.find((option) => option.value === draft.operation)?.label;
  const teacherName = (id: number | null) =>
    teachers.find((teacher) => teacher.id === id)?.name ?? "معلم غير محدد";
  const className = (id: number | null) =>
    classes.find((schoolClass) => schoolClass.id === id)?.displayName;
  const eventName = (id: number | null) =>
    events.find((event) => event.id === id)?.eventName;
  let details: string;
  if (draft.operation === "add" || draft.operation === "edit") {
    const target = draft.operation === "edit" ? ` — تعديل رقم ${draft.targetSlotId ?? "؟"}` : "";
    details = `${teacherName(draft.teacherId)} — ${dayName(draft.dayOfWeek ?? 0)}، الحصة ${draft.periodNumber ?? "؟"}${target} (${contentText(className(draft.classId), eventName(draft.eventId))})`;
  } else if (draft.operation === "delete") {
    const slot = slots.find((candidate) => candidate.id === draft.targetSlotId);
    details = slot ? slotLabel(slot.teacherName, slot.dayOfWeek, slot.periodNumber) : "تعيين غير محدد";
  } else {
    details = draft.slotA && draft.slotB
      ? `${coordinateText(draft.slotA)} ← ${coordinateText(draft.slotB)}`
      : "موضعان غير مكتملين";
  }

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
          aria-label="إزالة العملية"
        >
          <Trash2 size={15} />
        </Button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-2xl border border-neutral-100 bg-neutral-50" />
      ))}
    </div>
  );
}

function coordinateFromId(
  slots: WeeklyScheduleReadDto[],
  value: number | null,
): SlotCoordinate | null {
  const slot = slots.find((candidate) => candidate.id === value);
  return slot ? slotCoordinate(slot) : null;
}

function slotIdFromCoordinate(
  slots: WeeklyScheduleReadDto[],
  coordinate: SlotCoordinate | null,
): number | null {
  if (coordinate === null) return null;
  return slots.find(
    (slot) => coordinateKey(slotCoordinate(slot)) === coordinateKey(coordinate),
  )?.id ?? null;
}

function slotCoordinate(slot: WeeklyScheduleReadDto): SlotCoordinate {
  return {
    teacherId: slot.teacherId,
    dayOfWeek: slot.dayOfWeek,
    periodNumber: slot.periodNumber,
  };
}

function coordinateKey(coordinate: SlotCoordinate) {
  return `${coordinate.teacherId}:${coordinate.dayOfWeek}:${coordinate.periodNumber}`;
}

function coordinateText(coordinate: SlotCoordinate) {
  return `${coordinate.teacherId} — ${dayName(coordinate.dayOfWeek)}، الحصة ${coordinate.periodNumber}`;
}

function contentText(className: string | undefined, eventName: string | undefined) {
  return [className, eventName].filter(Boolean).join(" — ") || "بدون محتوى";
}

function toNullableValue(value: number | null) {
  return value === null ? "none" : String(value);
}

function toNullableId(value: string) {
  return value === "" || value === "none" ? null : Number(value);
}
