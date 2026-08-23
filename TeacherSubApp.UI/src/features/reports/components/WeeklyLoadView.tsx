import { BarChart3, CalendarDays, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataTable } from "../../../components/orgnization/DataTable";
import type { DataTableConfig } from "../../../components/orgnization/DataTable";
import { StatCard } from "../../../components/orgnization/StatCard";
import { formatDateAsDayMonthYear } from "../../substitutions/dateUtils";
import { formatNumber, formatWeekRangeLabel } from "../utils";
import type { TeacherWeeklyLoadReportDto, WeeklyLoadBucketDto } from "../types";
import { ReportEmptyState } from "./ReportsShared";

interface WeeklyLoadViewProps {
  report: TeacherWeeklyLoadReportDto;
}

const tableConfig: DataTableConfig<WeeklyLoadBucketDto> = {
  getKey: (item) => item.weekStart,
  actionsColumnLabel: "الإجراءات",
  columns: [
    {
      id: "week",
      label: "الأسبوع",
      isPrimary: true,
      renderCell: (item) => formatWeekRangeLabel(item.weekStart, item.weekEnd),
    },
    { id: "base", label: "الحمل الأساسي", renderCell: (item) => formatNumber(item.baseWeeklyLoad) },
    { id: "lost", label: "فاقد الغياب", renderCell: (item) => formatNumber(item.slotsLostToAbsence) },
    { id: "gained", label: "مكاسب البدائل", renderCell: (item) => formatNumber(item.slotsGainedSubstituting) },
    { id: "actual", label: "الحمل الفعلي", renderCell: (item) => <span className="font-bold text-blue-700">{formatNumber(item.netActualLoad)}</span> },
  ],
  emptyState: {
    icon: <CalendarDays size={24} />,
    title: "لا توجد أسابيع",
    titleFiltered: () => "لا توجد أسابيع",
    subtitle: "لا توجد بيانات حمل ضمن النطاق المحدد.",
    subtitleFiltered: "",
    addFirst: "",
  },
};

export function WeeklyLoadView({ report }: WeeklyLoadViewProps) {
  const weeks = report.weeks ?? [];
  const average = weeks.length
    ? weeks.reduce((sum, week) => sum + week.netActualLoad, 0) / weeks.length
    : 0;
  const totalSubstitutions = weeks.reduce((sum, week) => sum + week.substitutionsInWeek, 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-neutral-900">الحمل الأسبوعي</h2>
        <p className="mt-1 text-xs text-neutral-500">
          {report.teacherName ?? "المعلم"} · {report.subjectName ?? "بلا مادة"} · الحمل الأساسي {formatNumber(report.baseWeeklyLoad)} حصة
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="الحمل الأساسي" value={formatNumber(report.baseWeeklyLoad)} tone="blue" icon={BarChart3} />
        <StatCard label="متوسط الحمل الفعلي" value={formatNumber(average)} tone="emerald" icon={TrendingUp} />
        <StatCard label="مرات التعويض" value={formatNumber(totalSubstitutions)} tone="neutral" />
      </div>

      {weeks.length === 0 ? (
        <ReportEmptyState label="لا توجد بيانات حمل أسبوعي ضمن النطاق المحدد." />
      ) : (
        <>
          <section className="rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-neutral-900">اتجاه الحمل الفعلي</h3>
              <p className="mt-1 text-xs text-neutral-500">مقارنة الحمل الفعلي بين أسابيع النطاق المحدد.</p>
            </div>
            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeks} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="weekStart" tickFormatter={(value) => formatDateAsDayMonthYear(String(value))} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip labelFormatter={(value) => formatDateAsDayMonthYear(String(value))} formatter={(value) => [formatNumber(Number(value)), "الحمل الفعلي"]} />
                  <Line type="monotone" dataKey="netActualLoad" name="الحمل الفعلي" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: "#2563eb" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          <DataTable config={tableConfig} data={{ items: weeks, isLoading: false, isError: false, searchQuery: "" }} aria-label="الحمل الأسبوعي للمعلم" />
        </>
      )}
    </div>
  );
}
