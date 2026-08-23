import { BarChart3, CheckCircle2, CircleAlert, Medal, Repeat2, Scale } from "lucide-react";
import { StatCard } from "../../../components/orgnization/StatCard";
import { formatDateAsDayMonthYear } from "../../substitutions/dateUtils";
import { formatNumber, formatPercent } from "../utils";
import type { TeacherAnalysisDto } from "../types";

interface TeacherAnalysisViewProps {
  report: TeacherAnalysisDto;
}

export function TeacherAnalysisView({ report }: TeacherAnalysisViewProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-neutral-900">تحليل أداء المعلم</h2>
        <p className="mt-1 text-xs text-neutral-500">
          {report.teacherName ?? "المعلم"} · {report.subjectName ?? "بلا مادة"} · {formatDateAsDayMonthYear(report.fromDate)} — {formatDateAsDayMonthYear(report.toDate)}
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900"><CircleAlert size={16} className="text-red-500" /> الغياب والتغطية</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="أيام الغياب" value={formatNumber(report.totalAbsenceDays)} tone="red" icon={CircleAlert} />
          <StatCard label="حصص محررة" value={formatNumber(report.totalSlotsFreedByAbsence)} tone="blue" />
          <StatCard label="حصص مغطاة" value={formatNumber(report.totalSlotsCoveredForThisTeacher)} tone="emerald" icon={CheckCircle2} />
          <StatCard label="نسبة التغطية" value={formatPercent(report.absenceCoverageRate)} tone="emerald" />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900"><Repeat2 size={16} className="text-blue-600" /> المساهمة في التعويض</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard label="مرات التعويض" value={formatNumber(report.totalTimesSubstituted)} tone="blue" icon={Repeat2} />
          <StatCard label="أيام التعويض" value={formatNumber(report.totalDaysSubstituted)} tone="neutral" />
          <StatCard label="مطابقة الخوارزمية" value={formatPercent(report.algorithmMatchRate)} tone="emerald" icon={CheckCircle2} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900"><Scale size={16} className="text-amber-600" /> الحمل والترتيب</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="الحمل الأساسي الأسبوعي" value={formatNumber(report.baseWeeklyLoad)} tone="blue" icon={BarChart3} />
          <StatCard label="متوسط الحمل الفعلي" value={formatNumber(report.averageActualWeeklyLoad)} tone="neutral" />
          <StatCard label="ترتيب أيام الغياب" value={report.absenceDaysRankAmongAllTeachers === null ? "—" : formatNumber(report.absenceDaysRankAmongAllTeachers)} tone="amber" icon={Medal} />
          <StatCard label="ترتيب التعويضات" value={report.substitutionsRankAmongAllTeachers === null ? "—" : formatNumber(report.substitutionsRankAmongAllTeachers)} tone="amber" icon={Medal} />
        </div>
      </section>
    </div>
  );
}
