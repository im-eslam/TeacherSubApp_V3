import { SearchableSelect } from "../../../components/controls/SearchableSelect";
import { SegmentedToggle } from "../../../components/controls/SegmentedToggle";
import type { ScheduleViewMode } from "../hooks";

interface ScheduleOption {
  value: string;
  label: string;
}

interface ScheduleToolbarProps {
  viewMode: ScheduleViewMode;
  teacherOptions: ScheduleOption[];
  classOptions: ScheduleOption[];
  selectedTeacherId: number | null;
  selectedClassId: number | null;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  onTeacherChange: (value: string) => void;
  onClassChange: (value: string) => void;
  isDisabled: boolean;
}

const VIEW_OPTIONS = [
  { value: "teacher", label: "عرض المعلم" },
  { value: "class", label: "عرض الفصل" },
];

export function ScheduleToolbar({
  viewMode,
  teacherOptions,
  classOptions,
  selectedTeacherId,
  selectedClassId,
  onViewModeChange,
  onTeacherChange,
  onClassChange,
  isDisabled,
}: ScheduleToolbarProps) {
  const options = viewMode === "teacher" ? teacherOptions : classOptions;
  const selectedValue = String(
    viewMode === "teacher" ? selectedTeacherId ?? "" : selectedClassId ?? "",
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          طريقة عرض الجدول
        </span>
        <SegmentedToggle
          value={viewMode}
          onChange={(value) => onViewModeChange(value as ScheduleViewMode)}
          options={VIEW_OPTIONS}
          isDisabled={isDisabled}
        />
      </div>
      <div className="w-full sm:max-w-sm">
        <SearchableSelect
          value={selectedValue}
          onChange={viewMode === "teacher" ? onTeacherChange : onClassChange}
          options={options}
          placeholder={
            viewMode === "teacher"
              ? "اختر معلماً لعرض جدوله"
              : "اختر فصلاً لعرض جدوله"
          }
          disabled={isDisabled}
        />
      </div>
    </>
  );
}
