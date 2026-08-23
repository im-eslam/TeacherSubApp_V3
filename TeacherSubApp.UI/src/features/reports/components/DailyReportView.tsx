import { CircleAlert, ShieldCheck, Loader2 } from "lucide-react";
import { EntityErrorBanner } from "../../../components/layout/EntityPageLayout";
import { formatLongArabicDate } from "../../substitutions/dateUtils";
import { ReportsToolbar } from "./ReportsToolbar";
import { DatePicker } from "../../../components/controls/DatePicker";
import type { AbsentTeacherDto } from "../types";
import { useReportsPage } from "../hooks";
import { downloadDailyReportPdf } from "../lib/printDailyReport";
import logoImage from "../../../assets/logo.png";
import { useState } from "react";

type ReportsPageViewModel = ReturnType<typeof useReportsPage>;

interface DailyReportViewProps {
  vm: ReportsPageViewModel;
}

const STYLES = {
  wrapper:
    "w-full overflow-auto bg-white border border-neutral-200/80 rounded-2xl",
  table: "w-full min-w-[760px] table-fixed border-collapse text-sm",
  head: "sticky top-0 z-10 bg-neutral-50 border-b border-neutral-200/80 px-4 py-3 text-start text-xs font-semibold text-neutral-500 whitespace-nowrap",

  teacherCell: "align-top border-e border-neutral-100 px-4 py-3 break-words",
  slotRow: "border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/60",
  periodCell: "px-4 py-2.5 text-center align-middle",
  classCell: "px-4 py-2.5 align-middle break-words",
  subCell: "px-4 py-2.5 align-middle break-words",
  statusCell: "px-4 py-2.5 align-middle whitespace-normal break-words",
};

export function DailyReportView({ vm }: DailyReportViewProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = async () => {
    if (vm.dailyReport && !isExporting) {
      setIsExporting(true);
      try {
        await downloadDailyReportPdf(
          vm.dailyReport,
          "مدرسة الفرقان الأهلية",
          logoImage,
        );
      } catch (error) {
        console.error("Failed to generate PDF:", error);
      } finally {
        setIsExporting(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ReportsToolbar onPrint={handlePrint}>
        <DatePicker
          key={vm.dailyDate}
          label=""
          value={vm.dailyDate}
          onChange={vm.setDailyDate}
        />

        {vm.dailyReport && (
          <div className="flex h-11 items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-4 text-xs font-semibold text-blue-700">
            <ShieldCheck size={15} />
            {vm.dailyReport.absentTeachersCount} معلم غائب
          </div>
        )}
      </ReportsToolbar>

      {vm.isDailyError && (
        <EntityErrorBanner
          error={vm.dailyError}
          onRetry={vm.retryDaily}
          isRetrying={vm.isDailyRetrying}
        />
      )}

      {vm.isDailyLoading && (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-neutral-200 bg-white py-16 text-sm text-neutral-500">
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
          <div className={STYLES.wrapper}>
            <table className={STYLES.table} aria-label="التقرير اليومي للغياب">
              <colgroup>
                <col className="w-1/5" />
                <col className="w-1/5" />
                <col className="w-1/5" />
                <col className="w-1/5" />
                <col className="w-1/5" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className={STYLES.head}>
                    المعلم الغائب
                  </th>
                  <th scope="col" className={STYLES.head}>
                    الحصة
                  </th>
                  <th scope="col" className={STYLES.head}>
                    الفصل
                  </th>
                  <th scope="col" className={STYLES.head}>
                    البديل
                  </th>
                  <th scope="col" className={STYLES.head}>
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {vm.dailyReport.absentTeachers.map((absentTeacher) => (
                  <AbsentTeacherRows
                    key={absentTeacher.teacherId}
                    absentTeacher={absentTeacher}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

function AbsentTeacherRows({
  absentTeacher,
}: {
  absentTeacher: AbsentTeacherDto;
}) {
  const slots = absentTeacher.freedSlots;
  const rowCount = Math.max(slots.length, 1);
  const allCovered =
    absentTeacher.freedSlotsCount > 0 &&
    absentTeacher.coveredSlotsCount === absentTeacher.freedSlotsCount;

  const teacherCell = (
    <td rowSpan={rowCount} className={STYLES.teacherCell}>
      <div className="flex items-start gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${allCovered ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
        >
          {allCovered ? <ShieldCheck size={16} /> : <CircleAlert size={16} />}
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="min-w-0 break-words text-sm font-semibold text-neutral-900">
              {absentTeacher.teacherName}
            </p>
            <p className="min-w-0 break-words text-xs font-medium text-neutral-500">
              {absentTeacher.subjectName ?? "بلا مادة"}
            </p>
          </div>
          {absentTeacher.reason && (
            <p className="mt-0.5 break-words text-xs text-neutral-400">
              {absentTeacher.reason}
            </p>
          )}
        </div>
      </div>
    </td>
  );

  if (slots.length === 0) {
    return (
      <tr className={STYLES.slotRow}>
        {teacherCell}
        <td
          colSpan={4}
          className="px-4 py-3 text-center text-sm text-neutral-400"
        >
          لا توجد حصص مسجلة لهذا المعلم في هذا اليوم
        </td>
      </tr>
    );
  }

  return (
    <>
      {slots.map((slot, index) => (
        <tr key={slot.weeklyScheduleId} className={STYLES.slotRow}>
          {index === 0 && teacherCell}
          <td className={STYLES.periodCell}>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-700">
              {slot.periodNumber}
            </span>
          </td>
          <td className={STYLES.classCell}>
            {slot.classDisplayName ? (
              <span className="inline-block rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-bold text-neutral-700 break-words whitespace-normal">
                {slot.classDisplayName}
              </span>
            ) : (
              <span className="text-neutral-300">—</span>
            )}
          </td>
          <td className={STYLES.subCell}>
            {slot.substitute ? (
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="min-w-0 break-words text-sm font-semibold text-neutral-900">
                  {slot.substitute.teacherName}
                </p>
                <p className="min-w-0 break-words text-xs text-neutral-500">
                  {slot.substitute.subjectName ?? "بلا مادة"}
                </p>
              </div>
            ) : (
              <span className="text-neutral-300">—</span>
            )}
          </td>
          <td className={STYLES.statusCell}>
            {slot.isCovered ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                مغطاة
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                غير مغطاة
              </span>
            )}
          </td>
        </tr>
      ))}
    </>
  );
}
