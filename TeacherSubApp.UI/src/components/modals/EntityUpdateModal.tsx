import { useState } from "react";
import type { ReactNode } from "react";
import { Form } from "react-aria-components";
import { ModalShell } from "./ModalShell";
import {
  ModalHeader,
  ModalBody,
  ModalErrorBanner,
  ModalFooter,
} from "./ModalParts";
import { getErrorMessage } from "../../lib/apiErrors";

// ════════════════════════════════════════════════════════════
// UpdateModal
// ════════════════════════════════════════════════════════════
// Usage (inside a feature, e.g. SubjectEditModal):
//
//   <UpdateModal
//     isOpen={isOpen}
//     title="تعديل المادة"
//     submitLabel="حفظ التعديلات"
//     submittingLabel="جارٍ الحفظ..."
//     submitDisabled={!name.trim()}
//     onClose={onClose}
//     onSubmit={() => onSubmit(subject.id, { name: name.trim() })}
//   >
//     <TextField label="اسم المادة" value={name} onChange={setName} />
//   </UpdateModal>
//
// The feature owns its own form state (e.g. useState(subject?.name)) —
// this component only owns the shell, the submit lifecycle, and errors.
// ════════════════════════════════════════════════════════════

interface UpdateModalProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  submittingLabel: string;
  submitDisabled?: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  children: ReactNode;
}

export function EntityUpdateModal({
  isOpen,
  title,
  submitLabel,
  submittingLabel,
  submitDisabled = false,
  onClose,
  onSubmit,
  children,
}: UpdateModalProps) {
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
      await onSubmit();
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

        <fieldset
          disabled={isSubmitting}
          className="contents"
          onChange={() => error && setError(null)}
        >
          <ModalBody>
            {error != null && (
              <ModalErrorBanner message={getErrorMessage(error)} />
            )}
            {children}
          </ModalBody>
        </fieldset>

        <ModalFooter
          isBusy={isSubmitting}
          onCancel={handleClose}
          submitLabel={submitLabel}
          busyLabel={submittingLabel}
          submitDisabled={submitDisabled}
        />
      </Form>
    </ModalShell>
  );
}
