import { useState } from "react";
import { CalendarDays, Loader2, ShieldCheck } from "lucide-react";
import {
  EntityErrorBanner,
  EntityPageHeader,
} from "../components/layout/EntityPageLayout";
import { useTeachers } from "../features/teachers/hooks";
import { AbsenceCard } from "../features/substitutions/components/AbsenceCard";
import { LogAbsenceModal } from "../features/substitutions/components/LogAbsenceModal";
import {
  getServiceDate,
  useTodayAbsences,
  useTodaySubstitutions,
} from "../features/substitutions/hooks";

export default function SubstitutionsPage() {
  const [serviceDate] = useState(getServiceDate);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const absences = useTodayAbsences(serviceDate);
  const substitutions = useTodaySubstitutions(serviceDate);
  const teachers = useTeachers();
  const absenceList = absences.data ?? [];
  const substitutionList = substitutions.data ?? [];
  const isInitialLoading = absences.isLoading || substitutions.isLoading || teachers.isLoading;
  const isError = absences.isError || substitutions.isError || teachers.isError;
  const error = absences.error ?? substitutions.error ?? teachers.error;
  const formattedDate = new Date(`${serviceDate}T12:00:00`).toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div dir="rtl" className="flex min-h-full flex-col gap-6 p-6">
      <EntityPageHeader
        title="إدارة الغياب والاحتياط"
        description="مركز القيادة لإدارة غياب اليوم وتغطية الحصص بسرعة ووضوح. النظام يقترح أفضل بديل، وأنت تؤكد الاختيار."
        addLabel="تسجيل غياب"
        onAdd={() => setIsLogOpen(true)}
        isDisabled={teachers.isLoading}
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm"><CalendarDays size={19} /></span>
          <div>
            <p className="text-xs font-semibold text-blue-700">تغطية اليوم</p>
            <p className="mt-1 text-sm font-bold text-neutral-900">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
          <ShieldCheck size={16} />
          {substitutionList.length} حصص تم تعيين بديل لها
        </div>
      </div>

      {isError && (
        <EntityErrorBanner
          error={error}
          onRetry={() => {
            void absences.refetch();
            void substitutions.refetch();
            void teachers.refetch();
          }}
          isRetrying={absences.isFetching || substitutions.isFetching || teachers.isFetching}
        />
      )}

      {isInitialLoading && absenceList.length === 0 && (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-neutral-200 bg-white py-16 text-sm text-neutral-500 shadow-sm">
          <Loader2 size={19} className="animate-spin" /> جارٍ تجهيز مركز التغطية...
        </div>
      )}

      {!isInitialLoading && !isError && absenceList.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><ShieldCheck size={27} /></span>
          <h2 className="mt-4 text-base font-bold text-neutral-900">لا يوجد غياب مسجل اليوم</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">كل الحصص تسير وفق الجدول. عند تسجيل غياب سيظهر المعلم هنا لتبدأ تغطية حصصه.</p>
        </div>
      )}

      {absenceList.length > 0 && (
        <div className="flex flex-col gap-4">
          {absenceList.map((absence) => (
            <AbsenceCard
              key={absence.id}
              absence={absence}
              serviceDate={serviceDate}
              substitutions={substitutionList}
            />
          ))}
        </div>
      )}

      {isLogOpen && (
        <LogAbsenceModal
          isOpen={isLogOpen}
          onClose={() => setIsLogOpen(false)}
          teachers={teachers.data ?? []}
        />
      )}
    </div>
  );
}
