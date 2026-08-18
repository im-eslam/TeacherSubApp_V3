import {
  ToggleButtonGroup as AriaToggleButtonGroup,
  ToggleButton as AriaToggleButton,
  composeRenderProps,
  type Key,
} from "react-aria-components";

const STYLES = {
  group: "inline-flex items-center gap-0.5 p-1 bg-neutral-200 rounded-full",

  button:
    "flex items-center gap-1.5 px-4 py-2 min-h-[36px] text-sm font-medium rounded-full outline-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] focus-visible:ring-2 focus-visible:ring-blue-500/30",

  buttonIdle: "text-neutral-500 hover:text-neutral-700 hover:bg-white/60",
  buttonSelected: "text-blue-700 bg-white shadow-sm",
};

// ════════════════════════════════════════════════════════════
// SegmentedToggle
// ════════════════════════════════════════════════════════════
// Usage (schedules toolbar, teacher/class view switch):
//
//   <SegmentedToggle
//     value={viewMode}
//     onChange={(v) => setViewMode(v as "teacher" | "class")}
//     options={[
//       { value: "teacher", label: "عرض المعلم" },
//       { value: "class", label: "عرض الفصل" },
//     ]}
//     isDisabled={isLoading}
//   />
// ════════════════════════════════════════════════════════════

export interface SegmentedToggleOption {
  value: string;
  label: string;
}

export interface SegmentedToggleProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedToggleOption[];
  isDisabled?: boolean;
  "aria-label"?: string;
}

export function SegmentedToggle({
  value,
  onChange,
  options,
  isDisabled = false,
  "aria-label": ariaLabel,
}: SegmentedToggleProps) {
  return (
    <AriaToggleButtonGroup
      aria-label={ariaLabel ?? "تبديل العرض"}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[value]}
      onSelectionChange={(keys: Set<Key>) => {
        const next = [...keys][0];
        if (next != null) onChange(String(next));
      }}
      isDisabled={isDisabled}
      className={STYLES.group}
    >
      {options.map((option) => (
        <AriaToggleButton
          key={option.value}
          id={option.value}
          className={composeRenderProps("", (_, { isSelected }) =>
            [
              STYLES.button,
              isSelected ? STYLES.buttonSelected : STYLES.buttonIdle,
            ].join(" "),
          )}
        >
          {option.label}
        </AriaToggleButton>
      ))}
    </AriaToggleButtonGroup>
  );
}
