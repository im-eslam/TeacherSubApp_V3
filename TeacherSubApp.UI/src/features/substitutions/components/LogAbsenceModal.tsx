import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  Input,
  Label,
  TextField as AriaTextField,
} from "react-aria-components";
import { Button } from "../../../components/controls/Button";
import { SearchableSelect } from "../../../components/controls/SearchableSelect";
import { ModalShell } from "../../../components/modals/ModalShell";
import { getErrorMessage } from "../../../lib/apiErrors";
import { useCreateAbsence } from "../hooks";
import { getTodayIsoDate } from "../dateUtils";
import type { TeacherReadDto } from "../types";

interface LogAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherReadDto[];
}

export function LogAbsenceModal({
  isOpen,
  onClose,
  teachers,
}: LogAbsenceModalProps) {
  const [teacherId, setTeacherId] = useState("");
  const [absenceDate, setAbsenceDate] = useState(getTodayIsoDate);
  const [reason, setReason] = useState("");
  const mutation = useCreateAbsence();

  const teacherOptions = teachers.map((teacher) => ({
    value: String(teacher.id),
    label: `${teacher.name} — ${teacher.subjectName ?? "بلا مادة"}`,
  }));

  const canSubmit = teacherId !== "" && absenceDate !== "" && !mutation.isPending;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      await mutation.mutateAsync({
        teacherId: Number(teacherId),
        absenceDate,
        reason: reason.trim() || null,
      });
      toast.success("تم تسجيل الغياب بنجاح");
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <ModalShell isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isBusy={mutation.isPending} size="md">
      <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">تسجيل غياب</h2>
          <p className="mt-1 text-xs text-neutral-500">أضف غياب المعلم ليظهر فوراً في مركز إدارة الاحتياط.</p>
        </div>
        <Button variant="quiet" aria-label="إغلاق" onPress={onClose} isDisabled={mutation.isPending}>
          <X size={18} />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto px-6 py-6">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-neutral-500">المعلم</Label>
          <SearchableSelect
            value={teacherId}
            onChange={setTeacherId}
            options={teacherOptions}
            placeholder="اختر المعلم الغائب"
            disabled={mutation.isPending}
          />
        </div>

        <AriaTextField
          value={absenceDate}
          onChange={setAbsenceDate}
          isRequired
          className="flex flex-col gap-1.5"
        >
          <Label className="text-xs font-medium text-neutral-500">التاريخ</Label>
          <div className="relative">
            <CalendarDays size={17} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <Input
              type="date"
              className="min-h-[44px] w-full rounded-full border border-neutral-200/80 bg-white ps-11 pe-4 text-sm text-neutral-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              disabled={mutation.isPending}
            />
          </div>
        </AriaTextField>

        <AriaTextField
          value={reason}
          onChange={setReason}
          className="flex flex-col gap-1.5"
        >
          <Label className="text-xs font-medium text-neutral-500">ملاحظات <span className="font-normal text-neutral-400">(اختياري)</span></Label>
          <Input
            maxLength={500}
            placeholder="مثال: إجازة مرضية أو حالة طارئة"
            className="min-h-[44px] w-full rounded-full border border-neutral-200/80 bg-white px-4 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            disabled={mutation.isPending}
          />
        </AriaTextField>

        <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
          <Button variant="quiet" type="button" onPress={onClose} isDisabled={mutation.isPending}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" isDisabled={!canSubmit}>
            {mutation.isPending ? "جارٍ الحفظ..." : "حفظ الغياب"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
