import { useMemo, useState } from "react";
import {
  ChevronDown,
  CircleAlert,
  Clock3,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../../../components/controls/Button";
import { useDailySchedule } from "../hooks";
import type {
  SubstitutionReadDto,
  TeacherAbsenceReadDto,
} from "../types";
import { RecommendationModal } from "./RecommendationModal";

interface AbsenceCardProps {
  absence: TeacherAbsenceReadDto;
  serviceDate: string;
  substitutions: SubstitutionReadDto[];
}

function isWeekend(serviceDate: string) {
  const day = new Date(`${serviceDate}T12:00:00`).getDay();
  return day === 5 || day === 6;
}

export function AbsenceCard({
  absence,
  serviceDate,
  substitutions,
}: AbsenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    weeklyScheduleId: number;
    periodNumber: number;
  } | null>(null);
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

  const coveredCount = classSlots.filter((slot) =>
    coveredSlots.some((substitution) => substitution.weeklyScheduleId === slot.id),
  ).length;
  const totalCount = classSlots.length;
  const allCovered = totalCount > 0 && coveredCount === totalCount;

  return (
    <section className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition-shadow ${isExpanded ? "border-blue-200 shadow-md" : "border-neutral-200/70"}`}>
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-start outline-none transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/30"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${allCovered ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
            {allCovered ? <ShieldCheck size={21} /> : <CircleAlert size={21} />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold text-neutral-900">{absence.teacherName}</span>
            <span className="mt-1 block truncate text-xs text-neutral-500">غياب اليوم{absence.reason ? ` · ${absence.reason}` : ""}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${allCovered ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
            {coveredCount}/{totalCount || "—"} حصص مغطاة
          </span>
          <ChevronDown size={18} className={`text-neutral-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-neutral-100 bg-neutral-50/50 px-5 py-5">
          {isWeekend(serviceDate) && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-700">لا توجد حصص مدرسية مجدولة في عطلة نهاية الأسبوع.</div>
          )}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-10 text-sm text-neutral-500">
              <Loader2 size={18} className="animate-spin" /> جارٍ تحميل حصص اليوم...
            </div>
          )}
          {isError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700" role="alert">تعذر تحميل جدول المعلم لهذا اليوم.</div>
          )}
          {!isLoading && !isError && !isWeekend(serviceDate) && classSlots.length === 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-500">لا توجد حصص مسجلة لهذا المعلم اليوم.</div>
          )}
          {!isLoading && !isError && classSlots.length > 0 && (
            <div className="flex flex-col gap-3">
              {classSlots.map((slot) => {
                const substitution = coveredSlots.find((item) => item.weeklyScheduleId === slot.id);
                return (
                  <div key={slot.id} className={`flex flex-col gap-4 rounded-2xl border-s-4 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${substitution ? "border-s-emerald-500 border-neutral-200 bg-emerald-50/70" : "border-s-red-500 border-red-100 bg-red-50/70"}`}>
                    <div className="flex items-center gap-4">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${substitution ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {slot.periodNumber}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">الحصة {slot.periodNumber}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500"><Clock3 size={13} />{slot.classDisplayName}</p>
                        {substitution && <p className="mt-1 text-xs font-semibold text-emerald-700">{substitution.substituteTeacherNameAtTimeOfService} · {substitution.substituteTeacherSubjectAtTimeOfService}</p>}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={substitution ? "quiet" : "primary"}
                      onPress={() => setSelectedSlot({ weeklyScheduleId: slot.id, periodNumber: slot.periodNumber })}
                      className={substitution ? "shrink-0 text-emerald-700 hover:bg-emerald-100" : "shrink-0"}
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

      {selectedSlot && (
        <RecommendationModal
          isOpen={selectedSlot !== null}
          onClose={() => setSelectedSlot(null)}
          absenceId={absence.id}
          absentTeacherId={absence.teacherId}
          weeklyScheduleId={selectedSlot.weeklyScheduleId}
          periodNumber={selectedSlot.periodNumber}
          serviceDate={serviceDate}
        />
      )}
    </section>
  );
}
