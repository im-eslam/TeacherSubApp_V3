import { useState } from "react";
import { CalendarX, AlertCircle } from "lucide-react";
import {
  Input,
  Label,
  TextField as AriaTextField,
} from "react-aria-components";
import { EntityCreateModal } from "../../../components/modals/EntityCreateModal";
import { EntityUpdateModal } from "../../../components/modals/EntityUpdateModal";
import { EntityDeleteModal } from "../../../components/modals/EntityDeleteModal";
import { TextField } from "../../../components/controls/TextField";
import type { SchoolClassReadDto, SchoolClassWriteDto } from "../types";

const NUMBER_FIELD_STYLES = {
  root: "flex flex-col",
  label: "block text-xs font-medium text-neutral-500 mb-1.5",
  input:
    "w-full px-4 py-2.5 min-h-[44px] text-sm text-neutral-900 bg-white border border-neutral-200/80 rounded-full placeholder:text-neutral-400 outline-none transition-colors duration-150 hover:border-blue-300 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
};

// ════════════════════════════════════════════════════════════
// Shared: Grade / Section fields (must be provided together, or both empty)
// ════════════════════════════════════════════════════════════

type NullableNumberInput = number | "";

interface NumberFieldProps {
  label: string;
  value: NullableNumberInput;
  onChange: (value: string) => void;
}

function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <AriaTextField
      value={value === "" ? "" : String(value)}
      onChange={onChange}
      className={NUMBER_FIELD_STYLES.root}
    >
      <Label className={NUMBER_FIELD_STYLES.label}>{label}</Label>
      <Input
        type="number"
        step="1"
        inputMode="numeric"
        className={NUMBER_FIELD_STYLES.input}
      />
    </AriaTextField>
  );
}

interface GradeSectionFieldsProps {
  grade: NullableNumberInput;
  section: NullableNumberInput;
  onGradeChange: (v: NullableNumberInput) => void;
  onSectionChange: (v: NullableNumberInput) => void;
}

function parseNumericInput(raw: string): NullableNumberInput {
  if (raw === "") return "";
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? "" : parsed;
}

function GradeSectionFields({
  grade,
  section,
  onGradeChange,
  onSectionChange,
}: GradeSectionFieldsProps) {
  const isPairInvalid = (grade === "") !== (section === "");

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="الصف"
          value={grade}
          onChange={(value) => onGradeChange(parseNumericInput(value))}
        />
        <NumberField
          label="الشعبة"
          value={section}
          onChange={(value) => onSectionChange(parseNumericInput(value))}
        />
      </div>

      {isPairInvalid ? (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-700 mt-0.5">
          <AlertCircle size={12} strokeWidth={2.5} className="shrink-0" />
          يجب إدخال الصف والشعبة معًا، أو تركهما فارغين معًا.
        </p>
      ) : (
        <p className="text-[11px] text-neutral-400 mt-0.5">
          يجب إدخال الصف والشعبة معًا، أو تركهما فارغين معًا.
        </p>
      )}
    </div>
  );
}

function isPairValid(grade: NullableNumberInput, section: NullableNumberInput) {
  return (grade === "") === (section === "");
}

// ════════════════════════════════════════════════════════════
// 1. CREATE MODAL
// ════════════════════════════════════════════════════════════

interface SchoolClassCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SchoolClassWriteDto) => Promise<void>;
}

export function SchoolClassCreateModal({
  isOpen,
  onClose,
  onSubmit,
}: SchoolClassCreateModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [grade, setGrade] = useState<NullableNumberInput>("");
  const [section, setSection] = useState<NullableNumberInput>("");
  const canSubmit = displayName.trim() !== "" && isPairValid(grade, section);

  return (
    <EntityCreateModal
      isOpen={isOpen}
      title="إضافة فصل جديد"
      submitDisabled={!canSubmit}
      submitLabel="إضافة"
      submittingLabel="جارٍ الإضافة..."
      onClose={onClose}
      onSubmit={() =>
        onSubmit({
          displayName: displayName.trim(),
          grade: grade === "" ? null : grade,
          section: section === "" ? null : section,
        })
      }
    >
      <TextField
        label="اسم الفصل"
        value={displayName}
        onChange={setDisplayName}
        placeholder="مثال: العاشر أ"
        autoFocus
      />

      <GradeSectionFields
        grade={grade}
        section={section}
        onGradeChange={setGrade}
        onSectionChange={setSection}
      />
    </EntityCreateModal>
  );
}

// ════════════════════════════════════════════════════════════
// 2. EDIT MODAL
// ════════════════════════════════════════════════════════════

interface SchoolClassEditModalProps {
  isOpen: boolean;
  schoolClass: SchoolClassReadDto | null;
  onClose: () => void;
  onSubmit: (id: number, data: SchoolClassWriteDto) => Promise<void>;
}

export function SchoolClassEditModal({
  isOpen,
  schoolClass,
  onClose,
  onSubmit,
}: SchoolClassEditModalProps) {
  const [displayName, setDisplayName] = useState(
    schoolClass?.displayName ?? "",
  );
  const [grade, setGrade] = useState<NullableNumberInput>(
    schoolClass?.grade ?? "",
  );
  const [section, setSection] = useState<NullableNumberInput>(
    schoolClass?.section ?? "",
  );
  const canSubmit =
    displayName.trim() !== "" && isPairValid(grade, section) && !!schoolClass;

  return (
    <EntityUpdateModal
      isOpen={isOpen}
      title="تعديل الفصل"
      submitDisabled={!canSubmit}
      submitLabel="حفظ التعديلات"
      submittingLabel="جارٍ الحفظ..."
      onClose={onClose}
      onSubmit={() =>
        onSubmit(schoolClass!.id, {
          displayName: displayName.trim(),
          grade: grade === "" ? null : grade,
          section: section === "" ? null : section,
        })
      }
    >
      <TextField
        label="اسم الفصل"
        value={displayName}
        onChange={setDisplayName}
        autoFocus
      />

      <GradeSectionFields
        grade={grade}
        section={section}
        onGradeChange={setGrade}
        onSectionChange={setSection}
      />
    </EntityUpdateModal>
  );
}

// ════════════════════════════════════════════════════════════
// 3. DELETE MODAL
// ════════════════════════════════════════════════════════════

interface SchoolClassDeleteModalProps {
  isOpen: boolean;
  schoolClass: SchoolClassReadDto | null;
  onClose: () => void;
  onSubmit: (id: number) => Promise<void>;
}

export function SchoolClassDeleteModal({
  isOpen,
  schoolClass,
  onClose,
  onSubmit,
}: SchoolClassDeleteModalProps) {
  if (!schoolClass) return null;

  return (
    <EntityDeleteModal
      isOpen={isOpen}
      title="حذف الفصل"
      entityName={schoolClass.displayName}
      descriptionPrefix="سيتم حذف فصل"
      descriptionSuffix="نهائياً."
      warningIcon={<CalendarX size={16} className="text-amber-600" />}
      warningStart="ستفقد أي حصص في الجدول الأسبوعي مرتبطة بهذا الفصل تعيينها، وستصبح"
      warningHighlight="حصصاً فارغة"
      warningEnd="حتى يتم إسناد فصل جديد لها."
      safeText="سجلات الرواتب وتاريخ البدلاء السابقة لن تتأثر وستبقى محفوظة كما هي."
      onClose={onClose}
      onConfirm={() => onSubmit(schoolClass.id)}
    />
  );
}
