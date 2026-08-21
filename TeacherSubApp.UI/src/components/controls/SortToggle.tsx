import {
  ToggleButton,
  composeRenderProps,
  type ToggleButtonProps,
} from "react-aria-components";
import { ArrowUpDown } from "lucide-react";


const STYLES = {
  base: "flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-medium rounded-full border transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
  idle: "text-neutral-600 bg-white border-neutral-200/80 hover:bg-neutral-50",
  selected: "text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100",
};

// ════════════════════════════════════════════════════════════
// SortToggle
// ════════════════════════════════════════════════════════════
// Usage (inside a feature page toolbar):
//
//   <SortToggle
//     sortOrder={sortOrder}
//     onSortToggle={() =>
//       setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
//     }
//     isDisabled={isDisabled}
//     sortAscLabel="أ ← ي"
//     sortDescLabel="ي ← أ"
//   />
// ════════════════════════════════════════════════════════════


export type SortOrder = "asc" | "desc";

interface SortToggleProps extends Omit<
  ToggleButtonProps,
  "children" | "isSelected" | "onChange"
> {
  sortOrder: SortOrder;
  onSortToggle: () => void;
  isDisabled?: boolean;
  sortAscLabel: string;
  sortDescLabel: string;
}

export function SortToggle({
  sortOrder,
  onSortToggle,
  isDisabled = false,
  sortAscLabel,
  sortDescLabel,
  ...rest
}: SortToggleProps) {
  return (
    <ToggleButton
      {...rest}
      isSelected={sortOrder === "desc"}
      onChange={onSortToggle}
      isDisabled={isDisabled}
      aria-label={sortOrder === "asc" ? sortDescLabel : sortAscLabel}
      className={composeRenderProps(
        rest.className,
        (className, { isSelected }) =>
          [STYLES.base, isSelected ? STYLES.selected : STYLES.idle, className]
            .filter(Boolean)
            .join(" "),
      )}
    >
      <ArrowUpDown size={16} strokeWidth={2} />
      {sortOrder === "asc" ? sortAscLabel : sortDescLabel}
    </ToggleButton>
  );
}
