import { EntityPageHeaderPlain } from "../components/layout/EntityPageLayout";
import { SegmentedToggle } from "../components/controls/SegmentedToggle";
import { useReportsPage } from "../features/reports/hooks";
import { DailyReportView } from "../features/reports/components/DailyReportView";
import { TeacherReportView } from "../features/reports/components/TeacherReportView";

export default function ReportsPage() {
  const vm = useReportsPage();

  return (
    <div dir="rtl" className="flex min-h-full flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <EntityPageHeaderPlain
          title="التقارير"
          subtitle=""
          description="اطّلع على تقرير يومي لغياب اليوم وحالة تغطيته، أو تقرير مفصّل لكل معلم."
        />

        <SegmentedToggle
          value={vm.activeView}
          onChange={(value) => vm.setActiveView(value as "daily" | "teacher")}
          options={[
            { value: "daily", label: "التقرير اليومي" },
            { value: "teacher", label: "تقرير معلم" },
          ]}
          aria-label="نوع التقرير"
        />
      </div>

      {vm.activeView === "daily" ? (
        <DailyReportView vm={vm} />
      ) : (
        <TeacherReportView vm={vm} />
      )}
    </div>
  );
}
