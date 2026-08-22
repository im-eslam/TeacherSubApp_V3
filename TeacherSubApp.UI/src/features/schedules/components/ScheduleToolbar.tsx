import { memo } from "react";
import { SegmentedToggle } from "../../../components/controls/SegmentedToggle";
import { SearchableSelect } from "../../../components/controls/SearchableSelect";
import type { ScheduleViewMode } from "../types";
import type { SelectorOption } from "../hooks";

const VIEW_MODE_OPTIONS = [
  { value: "teacher", label: "عرض المعلم" },
  { value: "class", label: "عرض الفصل" },
];

interface ScheduleToolbarProps {
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  selectedId: string;
  onSelectedIdChange: (id: string) => void;
  options: SelectorOption[];
  isDisabled?: boolean;
}

export const ScheduleToolbar = memo(function ScheduleToolbar({
  viewMode,
  onViewModeChange,
  selectedId,
  onSelectedIdChange,
  options,
  isDisabled = false,
}: ScheduleToolbarProps) {
  return (
    <>
      <SegmentedToggle
        value={viewMode}
        onChange={(value) => onViewModeChange(value as ScheduleViewMode)}
        options={VIEW_MODE_OPTIONS}
        isDisabled={isDisabled}
        aria-label="تبديل عرض الجدول"
      />
      <div className="w-[400px]">
        <SearchableSelect
          value={selectedId}
          onChange={onSelectedIdChange}
          options={options}
          placeholder={
            viewMode === "teacher" ? "اختر معلمًا..." : "اختر فصلاً..."
          }
          disabled={isDisabled}
        />
      </div>
    </>
  );
});

ScheduleToolbar.displayName = "ScheduleToolbar";
