import { useCallback, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ModalErrorBanner } from "../../../../components/modals/ModalParts";
import { dayLabel } from "../../constants";
import type { DraftDelete } from "../../draftStore";
import { nextDraftId } from "../../draftStore";
import type { SelectorOption } from "../../hooks";
import type { WeeklyScheduleReadDto } from "../../types";
import { SlotPicker, EMPTY_SLOT_PICKER, type SlotPickerValue } from "./SlotPicker";

interface DeleteFormProps {
  teacherOptions: SelectorOption[];
  initial?: DraftDelete;
  onSubmit: (op: DraftDelete) => void;
}

function slotLabel(slot: WeeklyScheduleReadDto): string {
  const occupant = slot.classDisplayName ?? slot.eventName ?? "—";
  return `${slot.teacherName} · ${dayLabel(slot.dayOfWeek)} · حصة ${slot.periodNumber} (${occupant})`;
}

export function DeleteForm({ teacherOptions, initial, onSubmit }: DeleteFormProps) {
  const [picker, setPicker] = useState<SlotPickerValue>(EMPTY_SLOT_PICKER);
  const [resolvedSlot, setResolvedSlot] = useState<WeeklyScheduleReadDto | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleResolved = useCallback((slot: WeeklyScheduleReadDto | null) => {
    setResolvedSlot(slot);
  }, []);

  const targetId = resolvedSlot?.id ?? initial?.targetId ?? null;
  const summaryLabel = resolvedSlot ? slotLabel(resolvedSlot) : initial?.summaryLabel;

  const handleSubmit = () => {
    if (targetId === null || !summaryLabel) {
      setError("يجب اختيار حصة موجودة لحذفها.");
      return;
    }

    onSubmit({
      kind: "delete",
      draftId: initial?.draftId ?? nextDraftId(),
      targetId,
      summaryLabel,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <ModalErrorBanner message={error} />}

      <SlotPicker
        label="الحصة المراد حذفها"
        value={picker}
        onChange={setPicker}
        teacherOptions={teacherOptions}
        onResolved={handleResolved}
      />

      {summaryLabel && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 leading-relaxed">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>
            سيتم حذف هذا التعيين نهائيًا عند الحفظ:
            <br />
            <span className="font-semibold">{summaryLabel}</span>
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={targetId === null}
        className="mt-1 w-full px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-red-500 rounded-full hover:bg-red-600 disabled:opacity-50 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] outline-none"
      >
        إضافة إلى المسودة
      </button>
    </div>
  );
}
