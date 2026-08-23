import { useMemo, useState } from "react";
import {
  ChevronDown,
  CircleAlert,
  Clock3,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "../../../components/controls/Button";
import { getErrorMessage } from "../../../lib/apiErrors";
import { isWeekendIsoDate } from "../dateUtils";
import { useDailySchedule, useDeleteAbsence } from "../hooks";
import { useSubstitutionsPageStore } from "../store";
import type { SubstitutionReadDto, TeacherAbsenceReadDto } from "../types";

interface AbsenceCardProps {
  absence: TeacherAbsenceReadDto;
  serviceDate: string;
  substitutions: SubstitutionReadDto[];
  isSubstitutionsLoading: boolean;
  teacherSubject: string | null;
}

export function AbsenceCard({
  absence,
  serviceDate,
  substitutions,
  isSubstitutionsLoading,
  teacherSubject,
}: AbsenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const openRecommendation = useSubstitutionsPageStore(
    (state) => state.openRecommendation,
  );
  const deleteMutation = useDeleteAbsence();

  const { data: schedules = [], isLoading, isError } = useDailySchedule(
    absence.teacherId,
    serviceDate,
    isExpanded,
  );

  const classSlots = useMemo(
    () =>
      schedules
        .filter((schedule) => schedule.classId !== null && schedule.classDisplayName)
        .sort((a, b) => a.periodNumber - b.periodNumber),
    [schedules],
  );

  const coveredSlots = useMemo(
    () =>
      substitutions.filter(
        (substitution) =>
          substitution.absenceId === absence.id &&
          substitution.serviceDate === serviceDate,
      ),
    [absence.id, serviceDate, substitutions],
  );

  const isRowLoading = isLoading || isSubstitutionsLoading;

  const coveredCount = classSlots.filter((slot) =>
    coveredSlots.some((substitution) => substitution.weeklyScheduleId === slot.id),
  ).length;
  const totalCount = classSlots.length;
  const allCovered = totalCount > 0 && coveredCount === totalCount;

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(absence);
      setConfirmingDelete(false);
    } catch (error) {
      setDeleteError(getErrorMessage(error));
    }
  };

  return (
    <section
      className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition-shadow ${isExpanded ? "border-blue-200 shadow-md" : "border-neutral-200/70"}`}
    >
      <div className="flex w-full items-center gap-2 px-5 py-5">
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 items-center justify-between gap-4 text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/30"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${allCovered ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
            >
              {allCovered ? <ShieldCheck size={21} /> : <CircleAlert size={21} />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-neutral-900">
                {absence.teacherName}
              </span>
              <span className="mt-1 block truncate text-xs font-medium text-neutral-500">
                {teacherSubject ?? "بلا مادة"}
                {absence.reason ? ` · ${absence.reason}` : ""}
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${allCovered ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
            >
              {coveredCount}/{totalCount || "—"} حصص مغطاة
            </span>
            <ChevronDown
              size={18}
              className={`text-neutral-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </span>
        </button>

        {confirmingDelete ? (
          <span className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="destructive"
              onPress={handleDelete}
              isDisabled={deleteMutation.isPending}
              className="px-3 py-2 text-xs"
            >
              {deleteMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "تأكيد الحذف"
              )}
            </Button>
            <Button
              variant="quiet"
              onPress={() => setConfirmingDelete(false)}
              isDisabled={deleteMutation.isPending}
              className="px-3 py-2 text-xs"
            >
              إلغاء
            </Button>
          </span>
        ) : (
          <Button
            variant="quiet"
            aria-label="حذف الغياب"
            onPress={() => setConfirmingDelete(true)}
            className="shrink-0 px-2.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={17} />
          </Button>
        )}
      </div>

      {deleteError && (
        <div className="mx-5 mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-700" role="alert">
          {deleteError}
        </div>
      )}

      {isExpanded && (
        <div className="border-t border-neutral-100 bg-neutral-50/50 px-5 py-5">
          {isWeekendIsoDate(serviceDate) && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-700">
              لا توجد حصص مدرسية مجدولة في عطلة نهاية الأسبوع.
            </div>
          )}
          {isRowLoading && (
            <div className="flex flex-col gap-3" aria-label="جارٍ تحميل بيانات الحصص">
              {[1, 2, 3].map((skeleton) => (
                <div key={skeleton} className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <span className="h-10 w-10 animate-pulse rounded-xl bg-neutral-200" />
                    <span className="flex flex-col gap-2">
                      <span className="h-3 w-28 animate-pulse rounded-full bg-neutral-200" />
                      <span className="h-2.5 w-40 animate-pulse rounded-full bg-neutral-100" />
                    </span>
                  </div>
                  <span className="h-9 w-24 animate-pulse rounded-full bg-neutral-100" />
                </div>
              ))}
            </div>
          )}
          {isError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700" role="alert">
              تعذر تحميل جدول المعلم لهذا اليوم.
            </div>
          )}
          {!isRowLoading && !isError && !isWeekendIsoDate(serviceDate) && classSlots.length === 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-500">
              لا توجد حصص مسجلة لهذا المعلم اليوم.
            </div>
          )}
          {!isRowLoading && !isError && classSlots.length > 0 && (
            <div className="flex flex-col gap-3">
              {classSlots.map((slot) => {
                const substitution = coveredSlots.find(
                  (item) => item.weeklyScheduleId === slot.id,
                );
                return (
                  <div
                    key={slot.id}
                    className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border-s-4 px-3 py-3 shadow-sm ${substitution ? "border-s-emerald-500 border-neutral-200 bg-emerald-50/70" : "border-s-red-500 border-red-100 bg-red-50/70"}`}
                  >
                    <div className="contents">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${substitution ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                      >
                        {slot.periodNumber}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">الحصة {slot.periodNumber}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                          <Clock3 size={13} />
                          {slot.classDisplayName}
                        </p>
                        {substitution && (
                          <div className="mt-2">
                            <p className="text-sm font-bold text-emerald-800">
                              {substitution.substituteTeacherNameAtTimeOfService}
                            </p>
                            <p className="mt-0.5 text-sm font-medium text-emerald-700">
                              {substitution.substituteTeacherSubjectAtTimeOfService || "بلا مادة"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={substitution ? "quiet" : "primary"}
                      onPress={() =>
                                                openRecommendation({
                          absenceId: absence.id,
                          absentTeacherId: absence.teacherId,
                          weeklyScheduleId: slot.id,
                          periodNumber: slot.periodNumber,
                          serviceDate,
                          substitution,
                        })

                      }
                      className={substitution ? "shrink-0 px-3 py-2 text-emerald-800 hover:bg-emerald-100" : "shrink-0 px-3 py-2"}
                    >
                      {substitution ? "تعديل" : "اختيار بديل"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
