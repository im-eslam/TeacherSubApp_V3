import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "../../../components/controls/Button";
import { DatePicker } from "../../../components/controls/DatePicker";
import { DateRangePicker } from "../../../components/controls/DateRangePicker";
import { SearchableSelect } from "../../../components/controls/SearchableSelect";
import { Select } from "../../../components/controls/Select";
import type { ReportDateRange } from "../types";

interface DailyReportFiltersProps {
  date: string;
  onDateChange: (date: string) => void;
}

export function DailyReportFilters({ date, onDateChange }: DailyReportFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="w-full max-w-xs">
        <DatePicker label="تاريخ التقرير" value={date} onChange={onDateChange} />
      </div>
    </div>
  );
}

interface TeacherReportFiltersProps {
  teacherId: string;
  onTeacherChange: (value: string) => void;
  teacherOptions: { value: string; label: string }[];
  teacherLoading: boolean;
  range: ReportDateRange;
  onRangeChange: (range: ReportDateRange) => void;
}

export function TeacherReportFilters({
  teacherId,
  onTeacherChange,
  teacherOptions,
  teacherLoading,
  range,
  onRangeChange,
}: TeacherReportFiltersProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(240px,0.8fr)_minmax(420px,1.4fr)] lg:items-start">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-neutral-600">
          المعلم
        </label>
        <SearchableSelect
          value={teacherId}
          onChange={onTeacherChange}
          options={teacherOptions}
          placeholder={teacherLoading ? "جارٍ تحميل المعلمين..." : "اختر المعلم"}
          disabled={teacherLoading}
        />
      </div>
      <DateRangePicker value={range} onChange={onRangeChange} />
    </div>
  );
}

interface SystemReportFiltersProps {
  range: ReportDateRange;
  onRangeChange: (range: ReportDateRange) => void;
  topCount: string;
  onTopCountChange: (value: string) => void;
}

export function SystemReportFilters({
  range,
  onRangeChange,
  topCount,
  onTopCountChange,
}: SystemReportFiltersProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(420px,1.4fr)_minmax(160px,0.35fr)] lg:items-start">
      <DateRangePicker value={range} onChange={onRangeChange} />
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-neutral-600">
          عدد المتصدرين
        </label>
        <Select
          value={topCount}
          onChange={onTopCountChange}
          options={[
            { value: "5", label: "أفضل 5" },
            { value: "10", label: "أفضل 10" },
            { value: "20", label: "أفضل 20" },
          ]}
          placeholder="اختر العدد"
          aria-label="عدد المتصدرين"
        />
      </div>
    </div>
  );
}

export function ReportLoadingState({ label = "جارٍ تحميل التقرير..." }: { label?: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-200/70 bg-white p-8 text-sm text-neutral-500">
      <Loader2 size={24} className="animate-spin text-blue-600" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ReportErrorState({
  onRetry,
  label = "تعذر تحميل التقرير. حاول مرة أخرى.",
}: {
  onRetry: () => void;
  label?: string;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-8 text-center text-sm text-red-700">
      <p>{label}</p>
      <Button variant="quiet" onPress={onRetry} className="gap-2 text-red-700 hover:bg-red-100">
        <RefreshCw size={15} aria-hidden="true" />
        إعادة المحاولة
      </Button>
    </div>
  );
}

export function ReportEmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 p-8 text-center text-sm text-neutral-500">
      {label}
    </div>
  );
}

export function TeacherSelectionState() {
  return (
    <ReportEmptyState label="اختر معلماً من القائمة لعرض تفاصيل التقرير." />
  );
}
