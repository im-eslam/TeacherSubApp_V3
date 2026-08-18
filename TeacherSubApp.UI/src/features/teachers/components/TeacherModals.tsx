import { useState, useMemo } from "react";
import { CalendarX2, ShieldCheck } from "lucide-react";
import { EntityCreateModal } from "../../../components/modals/EntityCreateModal";
import { EntityUpdateModal } from "../../../components/modals/EntityUpdateModal";
import { EntityDeleteModal } from "../../../components/modals/EntityDeleteModal";
import { TextField } from "../../../components/controls/TextField";
import { SearchableSelect } from "../../../components/controls/SearchableSelect";
import { ToggleCard } from "../../../components/controls/ToggleCard";
import type { TeacherReadDto, TeacherWriteDto } from "../types";
import type { SubjectReadDto } from "../../subjects/types";

// ════════════════════════════════════════════════════════════
// Shared: Subject select + Supervisor toggle
// ════════════════════════════════════════════════════════════

const NO_SUBJECT_VALUE = "none";

interface SubjectAndSupervisorFieldsProps {
  subjects: SubjectReadDto[];
  subjectId: number | null;
  onSubjectChange: (id: number | null) => void;
  isSupervisor: boolean;
  onSupervisorChange: (value: boolean) => void;
  disabled?: boolean;
}

function SubjectAndSupervisorFields({
  subjects,
  subjectId,
  onSubjectChange,
  isSupervisor,
  onSupervisorChange,
  disabled = false,
}: SubjectAndSupervisorFieldsProps) {
  const subjectOptions = useMemo(
    () => [
      { value: NO_SUBJECT_VALUE, label: "— غير محدد —" },
      ...subjects.map((s) => ({ value: String(s.id), label: s.name })),
    ],
    [subjects],
  );

  return (
    <>
      <div>
        <label className="block text-xs font-medium text-neutral-500 mb-1.5">
          المادة الدراسية
        </label>

        <SearchableSelect
          value={subjectId === null ? NO_SUBJECT_VALUE : String(subjectId)}
          onChange={(val) =>
            onSubjectChange(val === NO_SUBJECT_VALUE ? null : Number(val))
          }
          options={subjectOptions}
          placeholder="— غير محدد —"
          disabled={disabled}
        />
      </div>

      <ToggleCard
        icon={<ShieldCheck size={16} />}
        tint="blue"
        title="مشرف مادة"
        description="هل هذا المعلم مشرف على قسم المادة؟"
        isSelected={isSupervisor}
        onChange={onSupervisorChange}
        isDisabled={disabled}
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════
// 1. CREATE MODAL
// ════════════════════════════════════════════════════════════

interface TeacherCreateModalProps {
  isOpen: boolean;
  subjects: SubjectReadDto[];
  onClose: () => void;
  onSubmit: (data: TeacherWriteDto) => Promise<void>;
}

export function TeacherCreateModal({
  isOpen,
  subjects,
  onClose,
  onSubmit,
}: TeacherCreateModalProps) {
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [isSupervisor, setIsSupervisor] = useState(false);

  return (
    <EntityCreateModal
      isOpen={isOpen}
      title="إضافة معلم جديد"
      submitDisabled={!name.trim()}
      submitLabel="إضافة"
      submittingLabel="جارٍ الإضافة..."
      onClose={onClose}
      onSubmit={() => onSubmit({ name: name.trim(), subjectId, isSupervisor })}
    >
      <TextField
        label="اسم المعلم"
        value={name}
        onChange={setName}
        placeholder="مثال: أحمد محمد"
        autoFocus
      />

      <SubjectAndSupervisorFields
        subjects={subjects}
        subjectId={subjectId}
        onSubjectChange={setSubjectId}
        isSupervisor={isSupervisor}
        onSupervisorChange={setIsSupervisor}
      />
    </EntityCreateModal>
  );
}

// ════════════════════════════════════════════════════════════
// 2. EDIT MODAL
// ════════════════════════════════════════════════════════════

interface TeacherEditModalProps {
  isOpen: boolean;
  teacher: TeacherReadDto | null;
  subjects: SubjectReadDto[];
  onClose: () => void;
  onSubmit: (id: number, data: TeacherWriteDto) => Promise<void>;
}

export function TeacherEditModal({
  isOpen,
  teacher,
  subjects,
  onClose,
  onSubmit,
}: TeacherEditModalProps) {
  const [name, setName] = useState(teacher?.name ?? "");
  const [subjectId, setSubjectId] = useState<number | null>(
    teacher?.subjectId ?? null,
  );
  const [isSupervisor, setIsSupervisor] = useState(
    teacher?.isSupervisor ?? false,
  );

  return (
    <EntityUpdateModal
      isOpen={isOpen}
      title="تعديل المعلم"
      submitDisabled={!name.trim() || !teacher}
      submitLabel="حفظ التعديلات"
      submittingLabel="جارٍ الحفظ..."
      onClose={onClose}
      onSubmit={() =>
        onSubmit(teacher!.id, { name: name.trim(), subjectId, isSupervisor })
      }
    >
      <TextField label="اسم المعلم" value={name} onChange={setName} autoFocus />

      <SubjectAndSupervisorFields
        subjects={subjects}
        subjectId={subjectId}
        onSubjectChange={setSubjectId}
        isSupervisor={isSupervisor}
        onSupervisorChange={setIsSupervisor}
      />
    </EntityUpdateModal>
  );
}

// ════════════════════════════════════════════════════════════
// 3. DELETE MODAL
// ════════════════════════════════════════════════════════════

interface TeacherDeleteModalProps {
  isOpen: boolean;
  teacher: TeacherReadDto | null;
  onClose: () => void;
  onSubmit: (id: number) => Promise<void>;
}

export function TeacherDeleteModal({
  isOpen,
  teacher,
  onClose,
  onSubmit,
}: TeacherDeleteModalProps) {
  if (!teacher) return null;

  return (
    <EntityDeleteModal
      isOpen={isOpen}
      title="حذف المعلم"
      entityName={teacher.name}
      descriptionPrefix="سيتم حذف حساب المعلم"
      descriptionSuffix="نهائياً."
      warningIcon={<CalendarX2 size={16} className="text-amber-600" />}
      warningStart="سيتم إزالة كافة الحصص المرتبطة بجدوله الأسبوعي، ولن يكون متاحاً للتعيين في"
      warningHighlight="حصص الانتظار"
      warningEnd="مستقبلاً."
      safeText="سجلات غياب المعلم السابقة وحصص الانتظار التي قام بتغطيتها لن تتأثر وستبقى محفوظة."
      onClose={onClose}
      onConfirm={() => onSubmit(teacher.id)}
    />
  );
}
