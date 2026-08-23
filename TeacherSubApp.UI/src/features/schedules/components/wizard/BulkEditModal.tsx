import { useState } from "react";
import { Plus } from "lucide-react";
import { ModalShell } from "../../../../components/modals/ModalShell";
import {
  ModalHeader,
  ModalBody,
  ModalErrorBanner,
} from "../../../../components/modals/ModalParts";
import { getErrorMessage } from "../../../../lib/apiErrors";
import { useScheduleDraftStore, type DraftOperation } from "../../draftStore";
import {
  useClassSelectorOptions,
  useTeacherSelectorOptions,
  useSubmitBulkEdit,
} from "../../hooks";
import { useEventSelectorOptions } from "../../useEventOptions";
import { StepIndicator } from "./StepIndicator";
import { OperationChooser } from "./OperationChooser";
import { AddForm } from "./AddForm";
import { EditForm } from "./EditForm";
import { SwapForm } from "./SwapForm";
import { DeleteForm } from "./DeleteForm";
import { ReviewStep } from "./ReviewStep";

const STYLES = {
  footer:
    "flex items-center justify-between gap-2 px-6 py-4 border-t border-neutral-200/60 bg-neutral-50/50 shrink-0 rounded-b-3xl",
  cancelButton:
    "px-4 py-2.5 min-h-[44px] text-sm font-medium text-neutral-600 bg-transparent hover:bg-neutral-100 rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] outline-none disabled:opacity-50",
  addAnotherButton:
    "flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] outline-none",
  saveButton:
    "px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] outline-none",
};

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkEditModal({ isOpen, onClose }: BulkEditModalProps) {
  const {
    step,
    activeOperation,
    editingDraftId,
    operations,
    goToStep1,
    chooseOperation,
    commitOperation,
    editStagedOperation,
    removeStagedOperation,
    toRequest,
    reset,
    close,
  } = useScheduleDraftStore();

  const [commitError, setCommitError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { options: teacherOptions } = useTeacherSelectorOptions();
  const { options: classOptions } = useClassSelectorOptions();
  const { options: eventOptions } = useEventSelectorOptions();

  const { submit, isPending } = useSubmitBulkEdit();

  const editingOp = editingDraftId
    ? operations.find((o) => o.draftId === editingDraftId)
    : undefined;

  const handleClose = () => {
    if (isPending) return;
    reset();
    close();
    onClose();
  };

  const handleCommit = (op: DraftOperation) => {
    const result = commitOperation(op);
    if (!result.success) {
      setCommitError(result.reason ?? "تعذّر إضافة هذه العملية.");
      return;
    }
    setCommitError(null);
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      await submit(toRequest());
      reset();
      close();
      onClose();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onOpenChange={handleClose}
      size="2xl"
      isBusy={isPending}
    >
      <ModalHeader
        title="محرر الجدول المركزي"
        isBusy={isPending}
        onClose={handleClose}
      />
      <StepIndicator current={step} />

      <ModalBody allowBodyOverflow={true}>
        {step === 1 && <OperationChooser onChoose={chooseOperation} />}

        {step === 2 && (
          <>
            {commitError && <ModalErrorBanner message={commitError} />}
            {activeOperation === "add" && (
              <AddForm
                teacherOptions={teacherOptions}
                classOptions={classOptions}
                eventOptions={eventOptions}
                initial={editingOp?.kind === "add" ? editingOp : undefined}
                onSubmit={handleCommit}
              />
            )}
            {activeOperation === "edit" && (
              <EditForm
                teacherOptions={teacherOptions}
                classOptions={classOptions}
                eventOptions={eventOptions}
                initial={editingOp?.kind === "edit" ? editingOp : undefined}
                onSubmit={handleCommit}
              />
            )}
            {activeOperation === "swap" && (
              <SwapForm
                teacherOptions={teacherOptions}
                initial={editingOp?.kind === "swap" ? editingOp : undefined}
                onSubmit={handleCommit}
              />
            )}
            {activeOperation === "delete" && (
              <DeleteForm
                teacherOptions={teacherOptions}
                initial={editingOp?.kind === "delete" ? editingOp : undefined}
                onSubmit={handleCommit}
              />
            )}
          </>
        )}

        {step === 3 && (
          <>
            {saveError && <ModalErrorBanner message={saveError} />}
            <ReviewStep
              operations={operations}
              onEdit={editStagedOperation}
              onRemove={removeStagedOperation}
            />
          </>
        )}
      </ModalBody>

      <div className={STYLES.footer}>
        <button></button>

        {step === 3 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToStep1}
              disabled={isPending}
              className={STYLES.addAnotherButton}
            >
              <Plus size={16} strokeWidth={2.5} />
              إضافة عملية أخرى
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || operations.length === 0}
              className={STYLES.saveButton}
            >
              {isPending ? "جارٍ الحفظ..." : "تأكيد وحفظ"}
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
