import { CalendarDays, CheckCircle2, ClipboardList, CircleAlert } from "lucide-react";
import { DataTable } from "../../../components/orgnization/DataTable";
import type { DataTableConfig } from "../../../components/orgnization/DataTable";
import { StatCard } from "../../../components/orgnization/StatCard";
import { formatDateAsDayMonthYear } from "../../substitutions/dateUtils";
import { formatNumber } from "../utils";
import type {
  TeacherAbsenceHistoryDto,
  TeacherAbsenceHistoryEntryDto,
} from "../types";
import { ReportEmptyState } from "./ReportsShared";

interface TeacherHistoryViewProps {
  report: TeacherAbsenceHistoryDto;
}

const tableConfig: DataTableConfig<TeacherAbsenceHistoryEntryDto> = {
  getKey: (item) => item.absenceId,
  actionsColumnLabel: "الإجراءات",
  columns: [
    {
      id: "date",
      label: "التاريخ",
      isPrimary: true,
      renderCell: (item) => formatDateAsDayMonthYear(item.absenceDate),
    },
    {
      id: "reason",
      label: "السبب",
      renderCell: (item) => item.reason ?? "—",
    },
    {
      id: "freed",
      label: "حصص محررة",
      renderCell: (item) => formatNumber(item.slotsFreed),
    },
    {
      id: "covered",
      label: "مغطاة",
      renderCell: (item) => formatNumber(item.slotsCovered),
    },
    {
      id: "uncovered",
      label: "غير مغطاة",
      renderCell: (item) => (
        <span className={item.uncoveredSlots > 0 ? "font-bold text-red-600" : "text-emerald-700"}>
          {formatNumber(item.uncoveredSlots)}
        </span>
      ),
    },
  ],
  emptyState: {
    icon: <CalendarDays size={24} />,
    title: "لا توجد حالات غياب",
    titleFiltered: () => "لا توجد حالات غياب",
    subtitle: "لم يسجل المعلم حالات غياب ضمن النطاق المحدد.",
    subtitleFiltered: "",
    addFirst: "",
  },
};

export function TeacherHistoryView({ report }: TeacherHistoryViewProps) {
  const entries = report.entries ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-neutral-900">
            {report.teacherName ?? "المعلم"}
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            {report.subjectName ?? "بلا مادة"} · {formatDateAsDayMonthYear(report.fromDate)} — {formatDateAsDayMonthYear(report.toDate)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="أيام الغياب" value={formatNumber(report.totalAbsenceDays)} tone="red" icon={CircleAlert} />
        <StatCard label="الحصص المحررة" value={formatNumber(report.totalSlotsFreed)} tone="blue" icon={ClipboardList} />
        <StatCard label="الحصص المغطاة" value={formatNumber(report.totalSlotsCovered)} tone="emerald" icon={CheckCircle2} />
        <StatCard label="غير مغطاة" value={formatNumber(report.totalUncoveredSlots)} tone="amber" />
      </div>

      {entries.length === 0 ? (
        <ReportEmptyState label="لا توجد حالات غياب لهذا المعلم ضمن النطاق المحدد." />
      ) : (
        <>
          <DataTable
            config={tableConfig}
            data={{
              items: entries,
              isLoading: false,
              isError: false,
              searchQuery: "",
            }}
            aria-label="سجل غياب المعلم"
          />
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.absenceId} className="rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-neutral-900">تفاصيل {formatDateAsDayMonthYear(entry.absenceDate)}</p>
                  <span className="text-xs font-semibold text-neutral-500">{entry.reason ?? "بدون سبب"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(entry.slots ?? []).length === 0 ? (
                    <span className="text-xs text-neutral-500">لا توجد تفاصيل حصص.</span>
                  ) : (
                    (entry.slots ?? []).map((slot) => (
                      <span key={`${entry.absenceId}-${slot.periodNumber}`} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${slot.isCovered ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                        الحصة {formatNumber(slot.periodNumber)} · {slot.classDisplayName ?? "بدون فصل"}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
