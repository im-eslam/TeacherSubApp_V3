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
// CreateModal
// ════════════════════════════════════════════════════════════
// Usage (inside a feature, e.g. SubjectCreateModal):
//
//   <CreateModal
//     isOpen={isOpen}
//     title="إضافة مادة جديدة"
//     submitLabel="إضافة"
//     submittingLabel="جارٍ الإضافة..."
//     submitDisabled={!name.trim()}
//     onClose={onClose}
//     onSubmit={() => onSubmit({ name: name.trim() })}
//   >
//     <TextField label="اسم المادة" value={name} onChange={setName} />
//   </CreateModal>
//
// `children` is entirely up to the feature — this component only
// owns the shell, the submit lifecycle, and error display.
// ════════════════════════════════════════════════════════════

interface CreateModalProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  submittingLabel: string;
  submitDisabled?: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  allowBodyOverflow?: boolean;
  children: ReactNode;
}

export function EntityCreateModal({
  isOpen,
  title,
  submitLabel,
  submittingLabel,
  submitDisabled = false,
  onClose,
  onSubmit,
  allowBodyOverflow = false,
  children,
}: CreateModalProps) {
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
          <ModalBody allowBodyOverflow={allowBodyOverflow}>
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
