import { BarChart3, CheckCircle2, CircleAlert, Gauge, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "../../../components/orgnization/StatCard";
import { formatDateAsDayMonthYear } from "../../substitutions/dateUtils";
import { formatNumber, formatPercent } from "../utils";
import type { SystemAnalysisDto } from "../types";
import { ReportEmptyState } from "./ReportsShared";

interface SystemAnalysisViewProps {
  report: SystemAnalysisDto;
}

export function SystemAnalysisView({ report }: SystemAnalysisViewProps) {
  const trend = report.dailyTrend ?? [];
  const absentRanking = report.topAbsentTeachers ?? [];
  const substitutingRanking = report.topSubstitutingTeachers ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-neutral-900">تحليل النظام</h2>
        <p className="mt-1 text-xs text-neutral-500">
          من {formatDateAsDayMonthYear(report.fromDate)} إلى {formatDateAsDayMonthYear(report.toDate)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="المعلمون النشطون" value={formatNumber(report.totalActiveTeachers)} tone="blue" icon={Users} />
        <StatCard label="أيام الغياب" value={formatNumber(report.totalAbsenceDays)} tone="red" icon={CircleAlert} />
        <StatCard label="نسبة التغطية" value={formatPercent(report.overallCoverageRate)} tone="emerald" icon={CheckCircle2} />
        <StatCard label="مطابقة الخوارزمية" value={formatPercent(report.overallAlgorithmMatchRate)} tone="emerald" icon={Gauge} />
        <StatCard label="الحصص المحررة" value={formatNumber(report.totalSlotsFreed)} tone="neutral" />
        <StatCard label="الحصص المغطاة" value={formatNumber(report.totalSlotsCovered)} tone="emerald" />
        <StatCard label="غير مغطاة" value={formatNumber(report.totalUncoveredSlots)} tone="amber" />
        <StatCard label="عمليات التعويض" value={formatNumber(report.totalSubstitutionsMade)} tone="blue" icon={BarChart3} />
      </div>

      {trend.length === 0 && absentRanking.length === 0 && substitutingRanking.length === 0 ? (
        <ReportEmptyState label="لا توجد بيانات تحليلية ضمن النطاق المحدد." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartCard title="الاتجاه اليومي" subtitle="الغياب والحصص المحررة والمغطاة يومياً.">
            {trend.length === 0 ? (
              <ReportEmptyState label="لا توجد بيانات اتجاه يومي." />
            ) : (
              <div className="h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tickFormatter={(value) => formatDateAsDayMonthYear(String(value))} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip labelFormatter={(value) => formatDateAsDayMonthYear(String(value))} formatter={(value, name) => [formatNumber(Number(value)), String(name)]} />
                    <Line type="monotone" dataKey="absenceCount" name="حالات الغياب" stroke="#dc2626" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="slotsFreed" name="محررة" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="slotsCovered" name="مغطاة" stroke="#059669" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="الأكثر غياباً" subtitle="ترتيب المعلمين بحسب أيام الغياب.">
            {absentRanking.length === 0 ? (
              <ReportEmptyState label="لا توجد بيانات ترتيب الغياب." />
            ) : (
              <RankingChart data={absentRanking.map((entry) => ({ name: entry.teacherName ?? "معلم", count: entry.count }))} color="#dc2626" />
            )}
          </ChartCard>

          <ChartCard title="الأكثر تعويضاً" subtitle="ترتيب المعلمين بحسب عمليات التعويض.">
            {substitutingRanking.length === 0 ? (
              <ReportEmptyState label="لا توجد بيانات ترتيب التعويض." />
            ) : (
              <RankingChart data={substitutingRanking.map((entry) => ({ name: entry.teacherName ?? "معلم", count: entry.count }))} color="#059669" />
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
      <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function RankingChart({ data, color }: { data: { name: string; count: number }[]; color: string }) {
  return (
    <div className="h-72" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 18, left: 18, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(value) => [formatNumber(Number(value)), "العدد"]} />
          <Bar dataKey="count" name="العدد" fill={color} radius={[0, 5, 5, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
