import { useState } from "react";
import toast from "react-hot-toast";
import {
  Label,
  TextArea,
  TextField as AriaTextField,
} from "react-aria-components";
import { DatePicker } from "../../../components/controls/DatePicker";
import { SearchableSelect } from "../../../components/controls/SearchableSelect";
import { EntityCreateModal } from "../../../components/modals/EntityCreateModal";
import { getTodayIsoDate } from "../dateUtils";
import { useCreateAbsence } from "../hooks";
import { useSubstitutionsPageStore } from "../store";
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
  const setActiveDate = useSubstitutionsPageStore((state) => state.setActiveDate);

  const teacherOptions = [...teachers]
    .sort((left, right) => {
      const leftSubject = left.subjectName ?? "\uffff";
      const rightSubject = right.subjectName ?? "\uffff";
      return (
        leftSubject.localeCompare(rightSubject, "ar") ||
        left.name.localeCompare(right.name, "ar")
      );
    })
    .map((teacher) => ({
      value: String(teacher.id),
      label: `${teacher.name} — ${teacher.subjectName ?? "بلا مادة"}`,
    }));

  const handleSubmit = async () => {
    const created = await mutation.mutateAsync({
      teacherId: Number(teacherId),
      absenceDate,
      reason: reason.trim() || null,
    });
    setActiveDate(created.absenceDate);
    toast.success("تم تسجيل الغياب بنجاح");
  };

  return (
    <EntityCreateModal
      isOpen={isOpen}
      title="تسجيل غياب"
      submitLabel="حفظ الغياب"
      submittingLabel="جارٍ الحفظ..."
      submitDisabled={teacherId === "" || absenceDate === ""}
      onClose={onClose}
      onSubmit={handleSubmit}
      allowBodyOverflow
    >
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-neutral-500">المعلم</Label>
        <SearchableSelect
          value={teacherId}
          onChange={setTeacherId}
          options={teacherOptions}
          placeholder="اختر المعلم الغائب"
        />
      </div>

      <DatePicker
        label="التاريخ"
        value={absenceDate}
        onChange={setAbsenceDate}
        required
      />

      <AriaTextField
        value={reason}
        onChange={setReason}
        className="flex flex-col gap-1.5"
      >
        <Label className="text-xs font-medium text-neutral-500">
          ملاحظات <span className="font-normal text-neutral-400">(اختياري)</span>
        </Label>
        <TextArea
          rows={4}
          maxLength={500}
          placeholder="مثال: إجازة مرضية أو حالة طارئة"
          className="min-h-[110px] w-full resize-none rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
        />
      </AriaTextField>
    </EntityCreateModal>
  );
}
