// ════════════════════════════════════════════════════════════
// Shared "active filter" helper
// ════════════════════════════════════════════════════════════

export function isFilterActive(
  value: string,
  isFilter: boolean | undefined,
): boolean {
  return Boolean(isFilter) && value !== "" && value !== "all";
}

export const FILTER_ACTIVE_COLORS = {
  field: "bg-blue-50 border-blue-200",
  fieldHover: "hover:bg-blue-100",
  text: "text-blue-700",
  chevron: "text-blue-500",
};
