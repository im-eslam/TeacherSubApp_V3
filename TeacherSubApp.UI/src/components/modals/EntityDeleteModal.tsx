import { useState } from "react";
import type { ReactNode } from "react";
import { Form } from "react-aria-components";
import { ShieldCheck, Trash2 } from "lucide-react";
import { ModalShell } from "./ModalShell";
import {
  ModalHeader,
  ModalBody,
  ModalErrorBanner,
  ModalFooter,
} from "./ModalParts";
import { getErrorMessage } from "../../lib/apiErrors";

const STYLES = {
  description: "text-sm text-neutral-600 leading-relaxed",
  entityName: "font-semibold text-neutral-900",

  warningBox:
    "flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed",
  warningHighlight: "font-semibold",

  safeBox:
    "flex items-start gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 leading-relaxed",
};

// ════════════════════════════════════════════════════════════
// DeleteModal
// ════════════════════════════════════════════════════════════
// Usage (inside a feature, e.g. SubjectDeleteModal):
//
//   <DeleteModal
//     isOpen={isOpen}
//     title="حذف المادة"
//     entityName={subject.name}
//     descriptionPrefix="سيتم حذف مادة"
//     descriptionSuffix="نهائياً."
//     warningIcon={<UserX size={16} className="text-amber-600" />}
//     warningStart="سيفقد أي معلم مرتبط بهذه المادة حالياً تعيينه لها، ويصبح"
//     warningHighlight="بلا مادة"
//     warningEnd="حتى تُسند له مادة جديدة."
//     safeText="سجلات الرواتب وتاريخ البدلاء السابقة لن تتأثر."
//     onClose={onClose}
//     onConfirm={() => onSubmit(subject.id)}
//   />
// ════════════════════════════════════════════════════════════

interface DeleteModalProps {
  isOpen: boolean;
  title: string;
  entityName: string;
  descriptionPrefix: string;
  descriptionSuffix: string;
  warningIcon: ReactNode;
  warningStart: string;
  warningHighlight: string;
  warningEnd: string;
  safeText: string;
  submitLabel?: string;
  submittingLabel?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function EntityDeleteModal({
  isOpen,
  title,
  entityName,
  descriptionPrefix,
  descriptionSuffix,
  warningIcon,
  warningStart,
  warningHighlight,
  warningEnd,
  safeText,
  submitLabel = "تأكيد الحذف",
  submittingLabel = "جارٍ الحذف...",
  onClose,
  onConfirm,
}: DeleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      isBusy={isSubmitting}
    >
      <Form onSubmit={handleSubmit} className="contents">
        <ModalHeader
          title={title}
          isBusy={isSubmitting}
          onClose={handleClose}
        />

        <ModalBody>
          {error != null && (
            <ModalErrorBanner message={getErrorMessage(error)} />
          )}

          <p className={STYLES.description}>
            {descriptionPrefix}{" "}
            <span className={STYLES.entityName}>"{entityName}"</span>{" "}
            {descriptionSuffix}
          </p>

          <div className={STYLES.warningBox}>
            <span className="shrink-0 mt-0.5">{warningIcon}</span>
            <span>
              {warningStart}{" "}
              <span className={STYLES.warningHighlight}>
                {warningHighlight}
              </span>{" "}
              {warningEnd}
            </span>
          </div>

          <div className={STYLES.safeBox}>
            <ShieldCheck
              size={16}
              className="shrink-0 mt-0.5 text-emerald-600"
            />
            <span>{safeText}</span>
          </div>
        </ModalBody>

        <ModalFooter
          isBusy={isSubmitting}
          onCancel={handleClose}
          submitLabel={submitLabel}
          busyLabel={submittingLabel}
          variant="destructive"
          icon={<Trash2 size={16} />}
        />
      </Form>
    </ModalShell>
  );
}
