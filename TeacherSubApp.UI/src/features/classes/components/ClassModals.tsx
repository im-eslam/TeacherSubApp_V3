import { useState } from "react";
import { CalendarX, AlertCircle } from "lucide-react";
import { EntityCreateModal } from "../../../components/modals/EntityCreateModal";
import { EntityUpdateModal } from "../../../components/modals/EntityUpdateModal";
import { EntityDeleteModal } from "../../../components/modals/EntityDeleteModal";
import { TextField } from "../../../components/controls/TextField";
import type { SchoolClassReadDto, SchoolClassWriteDto } from "../types";

// ════════════════════════════════════════════════════════════
// Shared: Grade / Section fields (must be provided together, or both empty)
// ════════════════════════════════════════════════════════════

type NullableNumberInput = number | "";

interface GradeSectionFieldsProps {
  grade: NullableNumberInput;
  section: NullableNumberInput;
  onGradeChange: (v: NullableNumberInput) => void;
  onSectionChange: (v: NullableNumberInput) => void;
  disabled?: boolean;
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
  disabled = false,
}: GradeSectionFieldsProps) {
  const isPairInvalid = (grade === "") !== (section === "");

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="الصف"
          type="number"
          value={grade === "" ? "" : String(grade)}
          onChange={(v) => onGradeChange(parseNumericInput(v))}
          placeholder="مثال: 10"
          isDisabled={disabled}
        />
        <TextField
          label="الشعبة"
          type="number"
          value={section === "" ? "" : String(section)}
          onChange={(v) => onSectionChange(parseNumericInput(v))}
          placeholder="مثال: 1"
          isDisabled={disabled}
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
