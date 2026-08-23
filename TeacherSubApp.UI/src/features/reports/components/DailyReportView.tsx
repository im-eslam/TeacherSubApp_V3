import { Printer, ShieldCheck, CircleAlert } from "lucide-react";
import { Button } from "../../../components/controls/Button";
import { StatCard } from "../../../components/orgnization/StatCard";
import { formatDateAsDayMonthYear } from "../../substitutions/dateUtils";
import { formatNumber } from "../utils";
import type { DailyAbsenceEntryDto, DailyReportDto } from "../types";
import { ReportEmptyState } from "./ReportsShared";

interface DailyReportViewProps {
  report: DailyReportDto;
}

function DailyAbsenceCard({ absence }: { absence: DailyAbsenceEntryDto }) {
  const slots = [...(absence.slots ?? [])].sort(
    (a, b) => a.periodNumber - b.periodNumber,
  );
  const fullyCovered = absence.uncoveredSlots === 0;

  return (
    <section className="daily-report-absence overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${fullyCovered ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
          >
            {fullyCovered ? <ShieldCheck size={19} /> : <CircleAlert size={19} />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold text-neutral-900">
                {absence.teacherName ?? "معلم غير مسجل"}
              </h3>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800">
                {absence.subjectName ?? "بلا مادة"}
              </span>
            </div>
            {absence.reason && (
              <p className="mt-1 text-xs text-neutral-500">{absence.reason}</p>
            )}
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${fullyCovered ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
        >
          {formatNumber(absence.slotsCovered)} / {formatNumber(absence.slotsFreed)} حصة مغطاة
        </span>
      </div>
      <div className="space-y-2 bg-neutral-50/50 p-4">
        {slots.length === 0 ? (
          <p className="rounded-xl border border-neutral-200 bg-white px-4 py-5 text-center text-sm text-neutral-500">
            لا توجد تفاصيل حصص لهذا الغياب.
          </p>
        ) : (
          slots.map((slot) => (
            <div
              key={`${absence.absenceId}-${slot.periodNumber}`}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-3 ${slot.isCovered ? "border-emerald-100 bg-emerald-50/70" : "border-red-100 bg-red-50/70"}`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${slot.isCovered ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                >
                  {formatNumber(slot.periodNumber)}
                </span>
                <span className="text-sm font-bold text-neutral-900">
                  الحصة {formatNumber(slot.periodNumber)}
                </span>
                {slot.classDisplayName && (
                  <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-bold text-neutral-800 shadow-sm">
                    {slot.classDisplayName}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-neutral-700">
                {slot.isCovered
                  ? slot.substituteTeacherName ?? "مغطاة"
                  : "غير مغطاة"}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function DailyReportView({ report }: DailyReportViewProps) {
  const absences = report.absences ?? [];
  const dateLabel = formatDateAsDayMonthYear(report.date);

  return (
    <div className="reports-printable-daily space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-sm font-semibold text-neutral-900">تقرير اليوم</p>
          <p className="mt-1 text-xs text-neutral-500">{dateLabel}</p>
        </div>
        <Button variant="secondary" onPress={() => window.print()} className="gap-2">
          <Printer size={16} aria-hidden="true" />
          طباعة
        </Button>
      </div>

      <header className="hidden border-b border-neutral-200 pb-4 print:block">
        <p className="text-lg font-bold text-neutral-900">مدرسة الفرقان الأهلية</p>
        <h2 className="mt-2 text-xl font-bold text-neutral-900">تقرير الغياب والتغطية اليومية</h2>
        <p className="mt-1 text-sm text-neutral-600">التاريخ: {dateLabel}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="حالات الغياب" value={formatNumber(report.totalAbsences)} tone="red" icon={CircleAlert} />
        <StatCard label="الحصص المحررة" value={formatNumber(report.totalSlotsFreed)} tone="blue" />
        <StatCard label="الحصص المغطاة" value={formatNumber(report.totalSlotsCovered)} tone="emerald" icon={ShieldCheck} />
        <StatCard label="غير مغطاة" value={formatNumber(report.totalUncoveredSlots)} tone="amber" />
      </div>

      {absences.length === 0 ? (
        <ReportEmptyState label="لا توجد حالات غياب مسجلة لهذا التاريخ." />
      ) : (
        <div className="space-y-3">
          {absences.map((absence) => (
            <DailyAbsenceCard key={absence.absenceId} absence={absence} />
          ))}
        </div>
      )}
    </div>
  );
}
