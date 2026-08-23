import {
  EntityErrorBanner,
  EntityPageHeaderPlain,
  EntityToolbar,
} from "../components/layout/EntityPageLayout";
import { SegmentedToggle } from "../components/controls/SegmentedToggle";
import { DailyReportView } from "../features/reports/components/DailyReportView";
import { TeacherHistoryView } from "../features/reports/components/TeacherHistoryView";
import { WeeklyLoadView } from "../features/reports/components/WeeklyLoadView";
import { TeacherAnalysisView } from "../features/reports/components/TeacherAnalysisView";
import { SystemAnalysisView } from "../features/reports/components/SystemAnalysisView";
import {
  DailyReportFilters,
  ReportEmptyState,
  ReportErrorState,
  ReportLoadingState,
  SystemReportFilters,
  TeacherReportFilters,
  TeacherSelectionState,
} from "../features/reports/components/ReportsShared";
import { useReportsPage } from "../features/reports/hooks";
import type { ReportTab } from "../features/reports/types";

const REPORT_TABS = [
  { value: "daily", label: "التقرير اليومي" },
  { value: "absence-history", label: "سجل غياب المعلم" },
  { value: "weekly-load", label: "الحمل الأسبوعي" },
  { value: "teacher-analysis", label: "تحليل المعلم" },
  { value: "system-analysis", label: "تحليل النظام" },
];

export default function ReportsPage() {
  const reports = useReportsPage();
  const isDaily = reports.activeTab === "daily";

  return (
    <div
      dir="rtl"
      className={`reports-page min-h-full space-y-6 p-5 md:p-8 ${isDaily ? "reports-daily-active" : "reports-non-daily-active"}`}
    >
      <div className="reports-page-chrome space-y-5">
        <EntityPageHeaderPlain
          title="التقارير والتحليلات"
          subtitle="رؤية واضحة لأداء الغياب والتغطية والحمل الدراسي"
          description="تابع التقارير اليومية، وحلل أداء المعلمين، واتخذ قراراتك اعتماداً على بيانات موحدة وقابلة للطباعة."
        />

        <EntityToolbar>
          <SegmentedToggle
            value={reports.activeTab}
            onChange={reports.onTabChange}
            options={REPORT_TABS}
            aria-label="أنواع التقارير"
          />
        </EntityToolbar>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          {reports.activeTab === "daily" && (
            <DailyReportFilters
              date={reports.daily.date}
              onDateChange={reports.daily.onDateChange}
            />
          )}
          {(reports.activeTab === "absence-history" ||
            reports.activeTab === "weekly-load" ||
            reports.activeTab === "teacher-analysis") && (
            <TeacherReportFilters
              teacherId={reports.teacherReports.teacherId}
              onTeacherChange={reports.teacherReports.onTeacherChange}
              teacherOptions={reports.teachers.options}
              teacherLoading={reports.teachers.isLoading}
              range={reports.teacherReports.teacherRange}
              onRangeChange={reports.teacherReports.onRangeChange}
            />
          )}
          {reports.activeTab === "system-analysis" && (
            <SystemReportFilters
              range={reports.system.range}
              onRangeChange={reports.system.onRangeChange}
              topCount={reports.system.topCount}
              onTopCountChange={reports.system.onTopCountChange}
            />
          )}
        </section>
      </div>

      {reports.teachers.isError && reports.activeTab !== "daily" && (
        <EntityErrorBanner
          error={new Error("تعذر تحميل قائمة المعلمين")}
          onRetry={() => window.location.reload()}
          isRetrying={false}
        />
      )}

      <main className="reports-content">
        {reports.active.isError ? (
          <ReportErrorState onRetry={() => void reports.active.refetch()} />
        ) : reports.active.isLoading ? (
          <ReportLoadingState />
        ) : (
          <ActiveReportContent reports={reports} activeTab={reports.activeTab} />
        )}
      </main>
    </div>
  );
}

function ActiveReportContent({ reports, activeTab }: { reports: ReturnType<typeof useReportsPage>; activeTab: ReportTab }) {
  if (activeTab === "daily") {
    if (!reports.daily.query.data) return <ReportEmptyState label="لا توجد بيانات للتقرير اليومي." />;
    return <DailyReportView report={reports.daily.query.data} />;
  }

  if (!reports.teacherReports.isTeacherSelected) return <TeacherSelectionState />;
  if (reports.teacherReports.rangeError) return <ReportEmptyState label={reports.teacherReports.rangeError} />;

  if (activeTab === "absence-history") {
    if (!reports.teacherReports.history.data) return <ReportEmptyState label="لا توجد بيانات لسجل الغياب." />;
    return <TeacherHistoryView report={reports.teacherReports.history.data} />;
  }
  if (activeTab === "weekly-load") {
    if (!reports.teacherReports.weeklyLoad.data) return <ReportEmptyState label="لا توجد بيانات للحمل الأسبوعي." />;
    return <WeeklyLoadView report={reports.teacherReports.weeklyLoad.data} />;
  }
  if (activeTab === "teacher-analysis") {
    if (!reports.teacherReports.analysis.data) return <ReportEmptyState label="لا توجد بيانات لتحليل المعلم." />;
    return <TeacherAnalysisView report={reports.teacherReports.analysis.data} />;
  }

  if (reports.system.rangeError) return <ReportEmptyState label={reports.system.rangeError} />;
  if (!reports.system.query.data) return <ReportEmptyState label="لا توجد بيانات لتحليل النظام." />;
  return <SystemAnalysisView report={reports.system.query.data} />;
}
