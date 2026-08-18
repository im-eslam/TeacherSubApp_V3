import { useState } from "react";
import { UserX } from "lucide-react";
import { EntityCreateModal } from "../../../components/modals/EntityCreateModal";
import { EntityUpdateModal } from "../../../components/modals/EntityUpdateModal";
import { EntityDeleteModal } from "../../../components/modals/EntityDeleteModal";
import { TextField } from "../../../components/controls/TextField";
import type { SubjectReadDto, SubjectWriteDto } from "../types";

// ════════════════════════════════════════════════════════════
// 1. CREATE MODAL
// ════════════════════════════════════════════════════════════

interface SubjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubjectWriteDto) => Promise<void>;
}

export function SubjectCreateModal({
  isOpen,
  onClose,
  onSubmit,
}: SubjectCreateModalProps) {
  const [name, setName] = useState("");

  return (
    <EntityCreateModal
      isOpen={isOpen}
      title="إضافة مادة جديدة"
      submitDisabled={!name.trim()}
      submitLabel="إضافة"
      submittingLabel="جارٍ الإضافة..."
      onClose={onClose}
      onSubmit={() => onSubmit({ name: name.trim() })}
    >
      <TextField
        label="اسم المادة"
        value={name}
        onChange={setName}
        placeholder="مثال: الرياضيات"
        autoFocus
      />
    </EntityCreateModal>
  );
}

// ════════════════════════════════════════════════════════════
// 2. EDIT MODAL
// ════════════════════════════════════════════════════════════

interface SubjectEditModalProps {
  isOpen: boolean;
  subject: SubjectReadDto | null;
  onClose: () => void;
  onSubmit: (id: number, data: SubjectWriteDto) => Promise<void>;
}

export function SubjectEditModal({
  isOpen,
  subject,
  onClose,
  onSubmit,
}: SubjectEditModalProps) {
  const [name, setName] = useState(subject?.name ?? "");

  return (
    <EntityUpdateModal
      isOpen={isOpen}
      title="تعديل المادة"
      submitDisabled={!name.trim() || !subject}
      submitLabel="حفظ التعديلات"
      submittingLabel="جارٍ الحفظ..."
      onClose={onClose}
      onSubmit={() => onSubmit(subject!.id, { name: name.trim() })}
    >
      <TextField
        label="اسم المادة"
        value={name}
        onChange={setName}
        placeholder="مثال: الرياضيات"
        autoFocus
      />
    </EntityUpdateModal>
  );
}

// ════════════════════════════════════════════════════════════
// 3. DELETE MODAL
// ════════════════════════════════════════════════════════════

interface SubjectDeleteModalProps {
  isOpen: boolean;
  subject: SubjectReadDto | null;
  onClose: () => void;
  onSubmit: (id: number) => Promise<void>;
}

export function SubjectDeleteModal({
  isOpen,
  subject,
  onClose,
  onSubmit,
}: SubjectDeleteModalProps) {
  if (!subject) return null;

  return (
    <EntityDeleteModal
      isOpen={isOpen}
      title="حذف المادة"
      entityName={subject.name}
      descriptionPrefix="سيتم حذف مادة"
      descriptionSuffix="نهائياً."
      warningIcon={<UserX size={16} className="text-amber-600" />}
      warningStart="سيفقد أي معلم مرتبط بهذه المادة حالياً تعيينه لها، ويصبح"
      warningHighlight="بلا مادة"
      warningEnd="حتى تُسند له مادة جديدة."
      safeText="سجلات الرواتب وتاريخ البدلاء السابقة لن تتأثر وستبقى محفوظة كما هي."
      onClose={onClose}
      onConfirm={() => onSubmit(subject.id)}
    />
  );
}
