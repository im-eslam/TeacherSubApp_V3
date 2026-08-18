import { useState } from "react";
import { CalendarX, ShieldCheck, RefreshCw } from "lucide-react";
import { EntityCreateModal } from "../../../components/modals/EntityCreateModal";
import { EntityUpdateModal } from "../../../components/modals/EntityUpdateModal";
import { EntityDeleteModal } from "../../../components/modals/EntityDeleteModal";
import { TextField } from "../../../components/controls/TextField";
import { ToggleCard } from "../../../components/controls/ToggleCard";
import type { EventKeyReadDto, EventKeyWriteDto } from "../types";

// ════════════════════════════════════════════════════════════
// Shared flag fields — the two mutually-exclusive event flags
// ════════════════════════════════════════════════════════════

interface EventKeyFlagsFieldProps {
  isSupport: boolean;
  isStandby: boolean;
  onChange: (next: { isSupport: boolean; isStandby: boolean }) => void;
}

function EventKeyFlagsField({
  isSupport,
  isStandby,
  onChange,
}: EventKeyFlagsFieldProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <label className="block text-xs font-medium text-neutral-500 mb-0.5">
        نوع الحدث (اختياري)
      </label>

      <ToggleCard
        icon={<ShieldCheck size={16} />}
        tint="emerald"
        title="حدث دعم"
        titleHint="(حدث نشط واحد فقط)"
        description="يسمح بدخول معلمَين لنفس الحصة في نفس الوقت، متجاوزاً القيد الافتراضي في قاعدة البيانات."
        isSelected={isSupport}
        onChange={(checked) =>
          onChange({ isSupport: checked, isStandby: false })
        }
      />

      <ToggleCard
        icon={<RefreshCw size={16} />}
        tint="amber"
        title="حدث احتياطي"
        titleHint="(حدث نشط واحد فقط)"
        description="يمنح المعلم صاحب هذه الحصة أولوية عند اختيار بديل لتغطية غياب."
        isSelected={isStandby}
        onChange={(checked) =>
          onChange({ isStandby: checked, isSupport: false })
        }
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 1. CREATE MODAL
// ════════════════════════════════════════════════════════════

interface EventKeyCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventKeyWriteDto) => Promise<void>;
}

export function EventKeyCreateModal({
  isOpen,
  onClose,
  onSubmit,
}: EventKeyCreateModalProps) {
  const [eventName, setEventName] = useState("");
  const [isSupport, setIsSupport] = useState(false);
  const [isStandby, setIsStandby] = useState(false);

  return (
    <EntityCreateModal
      isOpen={isOpen}
      title="إضافة حدث جديد"
      submitDisabled={!eventName.trim()}
      submitLabel="إضافة"
      submittingLabel="جارٍ الإضافة..."
      onClose={onClose}
      onSubmit={() =>
        onSubmit({ eventName: eventName.trim(), isSupport, isStandby })
      }
    >
      <TextField
        label="اسم الحدث"
        value={eventName}
        onChange={setEventName}
        placeholder="مثال: إجتماع مع المدير"
        autoFocus
      />

      <EventKeyFlagsField
        isSupport={isSupport}
        isStandby={isStandby}
        onChange={(next) => {
          setIsSupport(next.isSupport);
          setIsStandby(next.isStandby);
        }}
      />
    </EntityCreateModal>
  );
}

// ════════════════════════════════════════════════════════════
// 2. EDIT MODAL
// ════════════════════════════════════════════════════════════

interface EventKeyEditModalProps {
  isOpen: boolean;
  eventKey: EventKeyReadDto | null;
  onClose: () => void;
  onSubmit: (id: number, data: EventKeyWriteDto) => Promise<void>;
}

export function EventKeyEditModal({
  isOpen,
  eventKey,
  onClose,
  onSubmit,
}: EventKeyEditModalProps) {
  const [eventName, setEventName] = useState(eventKey?.eventName ?? "");
  const [isSupport, setIsSupport] = useState(eventKey?.isSupport ?? false);
  const [isStandby, setIsStandby] = useState(eventKey?.isStandby ?? false);

  return (
    <EntityUpdateModal
      isOpen={isOpen}
      title="تعديل الحدث"
      submitDisabled={!eventName.trim() || !eventKey}
      submitLabel="حفظ التعديلات"
      submittingLabel="جارٍ الحفظ..."
      onClose={onClose}
      onSubmit={() =>
        onSubmit(eventKey!.id, {
          eventName: eventName.trim(),
          isSupport,
          isStandby,
        })
      }
    >
      <TextField
        label="اسم الحدث"
        value={eventName}
        onChange={setEventName}
        placeholder="مثال: إجتماع مع المدير"
        autoFocus
      />

      <EventKeyFlagsField
        isSupport={isSupport}
        isStandby={isStandby}
        onChange={(next) => {
          setIsSupport(next.isSupport);
          setIsStandby(next.isStandby);
        }}
      />
    </EntityUpdateModal>
  );
}

// ════════════════════════════════════════════════════════════
// 3. DELETE MODAL
// ════════════════════════════════════════════════════════════

interface EventKeyDeleteModalProps {
  isOpen: boolean;
  eventKey: EventKeyReadDto | null;
  onClose: () => void;
  onSubmit: (id: number) => Promise<void>;
}

export function EventKeyDeleteModal({
  isOpen,
  eventKey,
  onClose,
  onSubmit,
}: EventKeyDeleteModalProps) {
  if (!eventKey) return null;

  return (
    <EntityDeleteModal
      isOpen={isOpen}
      title="حذف الحدث"
      entityName={eventKey.eventName}
      descriptionPrefix="سيتم حذف حدث"
      descriptionSuffix="نهائياً."
      warningIcon={<CalendarX size={16} className="text-amber-600" />}
      warningStart="ستفقد أي حصة في الجدول الأسبوعي مرتبطة بهذا الحدث تصنيفها، وتصبح"
      warningHighlight="بلا حدث"
      warningEnd="حتى يُسند لها حدث جديد."
      safeText="سجلات البدلاء السابقة لن تتأثر وستبقى محفوظة كما هي."
      onClose={onClose}
      onConfirm={() => onSubmit(eventKey.id)}
    />
  );
}
