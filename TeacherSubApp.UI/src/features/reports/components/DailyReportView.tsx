import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  CircleAlert,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { DatePicker } from "../../../components/controls/DatePicker";
import { EntityErrorBanner } from "../../../components/layout/EntityPageLayout";
import { formatLongArabicDate } from "../../substitutions/dateUtils";
import type { AbsentTeacherDto } from "../types";
import { useReportsPage } from "../hooks";

type ReportsPageViewModel = ReturnType<typeof useReportsPage>;

interface DailyReportViewProps {
  vm: ReportsPageViewModel;
}

export function DailyReportView({ vm }: DailyReportViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <CalendarDays size={19} />
          </span>
          <DatePicker
            key={vm.dailyDate}
            label="تاريخ التقرير"
            labelClassName="sr-only"
            value={vm.dailyDate}
            onChange={vm.setDailyDate}
          />
        </div>
        {vm.dailyReport && (
          <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-blue-700">
            <ShieldCheck size={16} />
            {vm.dailyReport.absentTeachersCount} معلم غائب
          </div>
        )}
      </div>

      {vm.isDailyError && (
        <EntityErrorBanner
          error={vm.dailyError}
          onRetry={vm.retryDaily}
          isRetrying={vm.isDailyRetrying}
        />
      )}

      {vm.isDailyLoading && (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-neutral-200 bg-white py-16 text-sm text-neutral-500 shadow-sm">
          <Loader2 size={19} className="animate-spin" /> جارٍ تجهيز التقرير...
        </div>
      )}

      {!vm.isDailyLoading &&
        !vm.isDailyError &&
        vm.dailyReport &&
        vm.dailyReport.absentTeachers.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <ShieldCheck size={27} />
            </span>
            <h2 className="mt-4 text-base font-bold text-neutral-900">
              لا يوجد غياب مسجل في {formatLongArabicDate(vm.dailyDate)}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
              كل المعلمين حاضرون في هذا اليوم.
            </p>
          </div>
        )}

      {!vm.isDailyLoading &&
        !vm.isDailyError &&
        vm.dailyReport &&
        vm.dailyReport.absentTeachers.length > 0 && (
          <div className="flex flex-col gap-4">
            {vm.dailyReport.absentTeachers.map((absentTeacher) => (
              <AbsentTeacherReportCard
                key={absentTeacher.teacherId}
                absentTeacher={absentTeacher}
              />
            ))}
          </div>
        )}
    </div>
  );
}

function AbsentTeacherReportCard({
  absentTeacher,
}: {
  absentTeacher: AbsentTeacherDto;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const allCovered =
    absentTeacher.freedSlotsCount > 0 &&
    absentTeacher.coveredSlotsCount === absentTeacher.freedSlotsCount;

  return (
    <section
      className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition-shadow ${isExpanded ? "border-blue-200 shadow-md" : "border-neutral-200/70"}`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/30"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${allCovered ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
          >
            {allCovered ? <ShieldCheck size={21} /> : <CircleAlert size={21} />}
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-neutral-900">
                {absentTeacher.teacherName}
              </span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800">
                {absentTeacher.subjectName ?? "بلا مادة"}
              </span>
            </span>
            {absentTeacher.reason && (
              <span className="mt-1 block truncate text-xs font-medium text-neutral-500">
                {absentTeacher.reason}
              </span>
            )}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${allCovered ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
          >
            {absentTeacher.coveredSlotsCount}/
            {absentTeacher.freedSlotsCount || "—"} حصص مغطاة
          </span>
          <ChevronDown
            size={18}
            className={`text-neutral-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-neutral-100 bg-neutral-50/50 px-5 py-5">
          {absentTeacher.freedSlots.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-500">
              لا توجد حصص مسجلة لهذا المعلم في هذا اليوم.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {absentTeacher.freedSlots.map((slot) => (
                <div
                  key={slot.weeklyScheduleId}
                  className={`grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border-s-4 px-3 py-3 shadow-sm ${slot.isCovered ? "border-s-emerald-500 border-neutral-200 bg-emerald-50/70" : "border-s-red-500 border-red-100 bg-red-50/70"}`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${slot.isCovered ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                  >
                    {slot.periodNumber}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-neutral-900">
                        الحصة {slot.periodNumber}
                      </p>
                      {slot.classDisplayName && (
                        <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-bold text-neutral-800 shadow-sm">
                          {slot.classDisplayName}
                        </span>
                      )}
                    </div>
                    {slot.substitute ? (
                      <div className="mt-2">
                        <p className="text-base font-bold text-neutral-900">
                          {slot.substitute.teacherName}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-neutral-700">
                          {slot.substitute.subjectName ?? "بلا مادة"}
                          {slot.substitute.isAlgorithmMatch && (
                            <span className="ms-2 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                              ترشيح النظام
                            </span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm font-semibold text-red-700">
                        لم يتم تعيين بديل
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
