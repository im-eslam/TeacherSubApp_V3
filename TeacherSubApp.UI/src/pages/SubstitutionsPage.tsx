import { CalendarDays, Loader2, ShieldCheck } from "lucide-react";
import {
  EntityErrorBanner,
  EntityPageHeader,
} from "../components/layout/EntityPageLayout";
import { AbsenceCard } from "../features/substitutions/components/AbsenceCard";
import { LogAbsenceModal } from "../features/substitutions/components/LogAbsenceModal";
import { RecommendationModal } from "../features/substitutions/components/RecommendationModal";
import { LocalizedDateInput } from "../features/substitutions/components/LocalizedDateInput";
import { useSubstitutionsPage } from "../features/substitutions/hooks";

export default function SubstitutionsPage() {
  const {
    activeDate,
    setActiveDate,
    absenceList,
    substitutionList,
    teacherList,
    isInitialLoading,
    isError,
    error,
    isRetrying,
    retry,
    isLogAbsenceOpen,
    openLogAbsence,
    closeLogAbsence,
    selectedSlotForSub,
    closeRecommendation,
  } = useSubstitutionsPage();

  return (
    <div dir="rtl" className="flex min-h-full flex-col gap-6 p-6">
      <EntityPageHeader
        title="إدارة الغياب والاحتياط"
        description="مركز القيادة لإدارة غياب اليوم وتغطية الحصص بسرعة ووضوح. النظام يقترح أفضل بديل، وأنت تؤكد الاختيار."
        addLabel="تسجيل غياب"
        onAdd={openLogAbsence}
        isDisabled={teacherList.length === 0 && isInitialLoading}
      />

      <div className="flex items-center justify-between gap-4 rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-4"
>
        <div className="flex min-w-0 items-center gap-3"
>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <CalendarDays size={19} />
          </span>
          <LocalizedDateInput
            key={activeDate}
            label="تاريخ التغطية"
            labelClassName="sr-only"
            value={activeDate}
            onChange={setActiveDate}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-blue-700"
>
          <ShieldCheck size={16} />
          {substitutionList.length} حصص تم تعيين بديل لها
        </div>
      </div>

      {isError && (
        <EntityErrorBanner error={error} onRetry={retry} isRetrying={isRetrying} />
      )}

      {isInitialLoading && absenceList.length === 0 && (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-neutral-200 bg-white py-16 text-sm text-neutral-500 shadow-sm">
          <Loader2 size={19} className="animate-spin" /> جارٍ تجهيز مركز التغطية...
        </div>
      )}

      {!isInitialLoading && !isError && absenceList.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <ShieldCheck size={27} />
          </span>
          <h2 className="mt-4 text-base font-bold text-neutral-900">لا يوجد غياب مسجل في هذا اليوم</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
            كل الحصص تسير وفق الجدول. عند تسجيل غياب سيظهر المعلم هنا لتبدأ تغطية حصصه.
          </p>
        </div>
      )}

      {absenceList.length > 0 && (
        <div className="flex flex-col gap-4">
          {absenceList.map((absence) => (
            <AbsenceCard
              key={absence.id}
              absence={absence}
              serviceDate={activeDate}
              substitutions={substitutionList}
            />
          ))}
        </div>
      )}

      {isLogAbsenceOpen && (
        <LogAbsenceModal
          isOpen={isLogAbsenceOpen}
          onClose={closeLogAbsence}
          teachers={teacherList}
        />
      )}

      {selectedSlotForSub && (
        <RecommendationModal
          isOpen={selectedSlotForSub !== null}
          onClose={closeRecommendation}
          absenceId={selectedSlotForSub.absenceId}
          slot={selectedSlotForSub}
        />
      )}
    </div>
  );
}
