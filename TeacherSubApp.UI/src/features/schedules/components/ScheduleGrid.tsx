import { memo, useMemo } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { DAYS, PERIODS, eventColor } from "../constants";
import type { ScheduleViewMode, WeeklyScheduleReadDto } from "../types";

const STYLES = {
  wrapper: "relative flex flex-col gap-3",

  fetchingBadge:
    "absolute -top-3 start-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-neutral-200/60 rounded-full text-[11px] font-medium text-neutral-500 shadow-sm",

  scrollWrapper:
    "relative w-full overflow-auto rounded-2xl border border-neutral-200/80 bg-white",
  table: "w-full min-w-[860px] table-fixed border-collapse",

  cornerCell:
    "sticky start-0 top-0 z-20 w-28 sm:w-32 border-b border-e border-neutral-200/80 bg-neutral-50",
  headCell:
    "sticky top-0 z-10 border-b border-neutral-200/80 bg-neutral-50 px-2 sm:px-3 py-3 sm:py-4 text-center text-sm sm:text-base font-semibold text-neutral-700",
  dayHeadCell:
    "sticky start-0 z-10 w-28 sm:w-32 border-b border-e border-neutral-200/80 bg-neutral-50 px-2 sm:px-4 py-3 sm:py-4 text-center align-middle text-sm sm:text-base font-semibold text-neutral-700",

  bodyCell:
    "border-b border-e border-neutral-100 bg-white p-1.5 sm:p-3 align-middle transition-colors duration-300",
  emptyCellContainer:
    "flex h-20 sm:h-24 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50",
  emptyCellDash: "text-xl sm:text-2xl font-medium text-neutral-400",

  cardWrapper:
    "flex min-h-20 sm:min-h-24 w-full flex-col overflow-hidden rounded-xl border",
  cardSection:
    "flex flex-1 flex-col items-center justify-center px-1.5 sm:px-2 py-1.5 sm:py-2 text-center",
  cardDivider: "border-t border-neutral-100",
  primaryText:
    "max-w-full line-clamp-2 break-words text-[13px] sm:text-base font-medium leading-snug tracking-tight text-neutral-800",
  secondaryText:
    "mt-0.5 max-w-full line-clamp-2 break-words text-[11px] sm:text-sm font-normal leading-snug tracking-wide text-neutral-600",

  emptyState:
    "flex flex-col items-center justify-center gap-3 py-16 text-center rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/40",
  emptyIcon:
    "flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 text-neutral-400",
  emptyTitle: "text-sm font-semibold text-neutral-600",
  emptySubtitle: "text-xs text-neutral-400 max-w-xs",
};

// ── Slot lookup ──

function buildSlotMap(
  slots: WeeklyScheduleReadDto[],
): Map<string, WeeklyScheduleReadDto> {
  const map = new Map<string, WeeklyScheduleReadDto>();
  for (const slot of slots) {
    map.set(`${slot.dayOfWeek}-${slot.periodNumber}`, slot);
  }
  return map;
}

// ── Cell renderer ──

function ScheduleCell({
  slot,
  viewMode,
}: {
  slot: WeeklyScheduleReadDto | undefined;
  viewMode: ScheduleViewMode;
}) {
  if (!slot) {
    return (
      <div className={STYLES.emptyCellContainer}>
        <span className={STYLES.emptyCellDash}>—</span>
      </div>
    );
  }

  const hasClass = slot.classId !== null;
  const hasEvent = slot.eventId !== null;
  const color = hasEvent ? eventColor(slot.eventId as number) : null;

  if (viewMode === "teacher") {
    if (hasClass && hasEvent) {
      return (
        <div
          className={[STYLES.cardWrapper, "bg-white", color?.border].join(" ")}
        >
          <div className={STYLES.cardSection}>
            <span className={STYLES.primaryText}>{slot.classDisplayName}</span>
          </div>
          <div className={STYLES.cardDivider} />
          <div className={[STYLES.cardSection, color?.bg].join(" ")}>
            <span className={[STYLES.primaryText, color?.text].join(" ")}>
              {slot.eventName}
            </span>
          </div>
        </div>
      );
    }

    if (hasEvent) {
      return (
        <div
          className={[STYLES.cardWrapper, color?.bg, color?.border].join(" ")}
        >
          <div className={STYLES.cardSection}>
            <span className={[STYLES.primaryText, color?.text].join(" ")}>
              {slot.eventName}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        className={[STYLES.cardWrapper, "bg-white border-neutral-300"].join(
          " ",
        )}
      >
        <div className={STYLES.cardSection}>
          <span className={STYLES.primaryText}>{slot.classDisplayName}</span>
        </div>
      </div>
    );
  }

  if (hasEvent) {
    return (
      <div
        className={[STYLES.cardWrapper, "bg-white", color?.border].join(" ")}
      >
        <div className={STYLES.cardSection}>
          <span className={STYLES.primaryText}>{slot.teacherName}</span>
        </div>
        <div className={STYLES.cardDivider} />
        <div className={[STYLES.cardSection, color?.bg].join(" ")}>
          <span className={[STYLES.primaryText, color?.text].join(" ")}>
            {slot.eventName}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[STYLES.cardWrapper, "bg-white border-neutral-300"].join(" ")}
    >
      <div className={STYLES.cardSection}>
        <span className={STYLES.primaryText}>{slot.teacherName}</span>
      </div>
      <div className={STYLES.cardDivider} />
      <div className={[STYLES.cardSection, "bg-neutral-50/50"].join(" ")}>
        <span className={STYLES.secondaryText}>{slot.subjectName ?? "—"}</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ScheduleGrid
// ════════════════════════════════════════════════════════════

interface ScheduleGridProps {
  slots: WeeklyScheduleReadDto[];
  viewMode: ScheduleViewMode;
  isLoading: boolean;
  isFetching: boolean;
  hasSelection: boolean;
}

export const ScheduleGrid = memo(function ScheduleGrid({
  slots,
  viewMode,
  isLoading,
  isFetching,
  hasSelection,
}: ScheduleGridProps) {
  const slotMap = useMemo(() => buildSlotMap(slots), [slots]);

  if (!hasSelection) {
    return (
      <div className={STYLES.emptyState}>
        <div className={STYLES.emptyIcon}>
          <CalendarDays size={22} strokeWidth={1.75} />
        </div>
        <p className={STYLES.emptyTitle}>
          {viewMode === "teacher"
            ? "اختر معلمًا لعرض جدوله"
            : "اختر فصلاً لعرض جدوله"}
        </p>
        <p className={STYLES.emptySubtitle}>
          استخدم القائمة أعلاه لعرض الجدول الأسبوعي الخاص بالمعلم أو الفصل
          المطلوب
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={STYLES.emptyState}>
        <Loader2 size={22} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className={STYLES.wrapper}>
      {isFetching && !isLoading && (
        <span className={STYLES.fetchingBadge}>
          <Loader2 size={12} className="animate-spin" />
          جارٍ التحديث...
        </span>
      )}

      <div className={STYLES.scrollWrapper}>
        <table className={STYLES.table}>
          <thead>
            <tr>
              <th className={STYLES.cornerCell}>اليوم / الحصة</th>
              {PERIODS.map((period) => (
                <th key={period} className={STYLES.headCell}>
                  الحصة {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day.value}>
                <th className={STYLES.dayHeadCell}>{day.label}</th>
                {PERIODS.map((period) => {
                  const slot = slotMap.get(`${day.value}-${period}`);
                  return (
                    <td key={period} className={STYLES.bodyCell}>
                      <ScheduleCell slot={slot} viewMode={viewMode} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

ScheduleGrid.displayName = "ScheduleGrid";
