import type { WeeklyScheduleReadDto } from "../types";

const STYLES = {
  wrapper:
    "w-full overflow-auto bg-white border border-slate-200 rounded-2xl",
  table: "w-full border-collapse",

  cornerCell:
    "sticky top-0 start-0 z-20 bg-slate-50 border-b border-e border-slate-200 w-32",

  periodHeaderCell:
    "sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-3 py-4 text-base font-semibold text-slate-700 text-center whitespace-nowrap min-w-[150px]",

  dayHeaderCell:
    "sticky start-0 z-10 bg-slate-50 border-e border-b border-slate-200 px-4 py-4 text-base font-semibold text-slate-700 text-center whitespace-nowrap align-middle",

  bodyRow: "group",

  cellBase:
    "border-e border-b border-slate-100 last:border-e-0 p-3 align-middle bg-white transition-colors duration-300",

  // ── Empty cell ──
  cellSurfaceEmpty:
    "h-[96px] rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex items-center justify-center transition-all hover:border-slate-400 hover:bg-slate-50",
  emptyDash: "text-slate-400 text-2xl font-medium",

  // ── Occupied Cell Container (The "Card") ──
  occupiedCard:
    "min-h-[96px] w-full rounded-xl flex flex-col overflow-hidden border",

  // ── Sub-sections inside the Card ──
  cardSectionBase:
    "flex flex-col items-center justify-center text-center px-2 py-2 flex-1",
  cardSectionNeutral: "bg-white",
  cardDivider: "border-t border-slate-100",

  // Typography: Generous sizing, moderate weights
  primaryLine:
    "text-base font-medium tracking-tight leading-snug truncate max-w-full",
  secondaryLine:
    "text-sm font-normal tracking-wide leading-snug truncate max-w-full mt-0.5",

  // ── Support Section ──
  supportSection: "bg-amber-50/50 border-t border-amber-200/60",

  // ── Skeleton ──
  skeletonWrap:
    "w-full bg-white border border-slate-200 rounded-2xl overflow-hidden p-4",
  skeletonHeaderRow: "flex gap-3 mb-3",
  skeletonHeaderCell: "h-9 bg-slate-100 rounded-md animate-pulse flex-1",
  skeletonBodyRow: "flex gap-3 mb-3 last:mb-0",
  skeletonBodyCell:
    "h-[96px] bg-slate-50 rounded-xl border border-slate-100 animate-pulse flex-1",
  skeletonLabelCell:
    "h-[96px] w-32 bg-slate-100 rounded-xl animate-pulse shrink-0",
};

const EVENT_COLOR_PALETTE: { bg: string; text: string; border: string }[] = [
  { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  { bg: "bg-violet-50", text: "text-violet-800", border: "border-violet-200" },
  { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
  {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
  { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200" },
  {
    bg: "bg-fuchsia-50",
    text: "text-fuchsia-800",
    border: "border-fuchsia-200",
  },
  { bg: "bg-lime-50", text: "text-lime-800", border: "border-lime-200" },
  { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
  { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" },
  { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200" },
  { bg: "bg-pink-50", text: "text-pink-800", border: "border-pink-200" },
];

function colorForEventId(eventId: number) {
  const index = Math.abs(eventId) % EVENT_COLOR_PALETTE.length;
  return EVENT_COLOR_PALETTE[index];
}

const DAYS: { value: number; label: string }[] = [
  { value: 1, label: "الأحد" },
  { value: 2, label: "الاثنين" },
  { value: 3, label: "الثلاثاء" },
  { value: 4, label: "الأربعاء" },
  { value: 5, label: "الخميس" },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export type ScheduleGridViewMode = "teacher" | "class";

export interface ScheduleGridProps {
  slots: WeeklyScheduleReadDto[];
  viewMode: ScheduleGridViewMode;
  isLoading: boolean;
}

export function ScheduleGrid({
  slots,
  viewMode,
  isLoading,
}: ScheduleGridProps) {
  if (isLoading) {
    return <ScheduleGridSkeleton />;
  }

  const slotsByCoord = new Map<string, WeeklyScheduleReadDto[]>();
  for (const slot of slots) {
    const key = `${slot.dayOfWeek}-${slot.periodNumber}`;
    const existing = slotsByCoord.get(key);
    if (existing) {
      existing.push(slot);
    } else {
      slotsByCoord.set(key, [slot]);
    }
  }

  return (
    <div className={STYLES.wrapper}>
      <table className={STYLES.table}>
        <thead>
          <tr>
            <th className={STYLES.cornerCell} />
            {PERIODS.map((period) => (
              <th key={period} className={STYLES.periodHeaderCell}>
                الحصة {period}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {DAYS.map((day) => (
            <tr key={day.value} className={STYLES.bodyRow}>
              <th className={STYLES.dayHeaderCell}>{day.label}</th>
              {PERIODS.map((period) => {
                const cellSlots =
                  slotsByCoord.get(`${day.value}-${period}`) ?? [];
                return (
                  <td key={period} className={STYLES.cellBase}>
                    <ScheduleCellContent
                      slots={cellSlots}
                      viewMode={viewMode}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Cell content
// ════════════════════════════════════════════════════════════

function ScheduleCellContent({
  slots,
  viewMode,
}: {
  slots: WeeklyScheduleReadDto[];
  viewMode: ScheduleGridViewMode;
}) {
  const occupied = slots.filter((s) => !s.isEmpty);

  if (occupied.length === 0) {
    return (
      <div className={STYLES.cellSurfaceEmpty}>
        <span className={STYLES.emptyDash}>—</span>
      </div>
    );
  }

  if (viewMode === "class") {
    return <ClassViewCell slots={occupied} />;
  }

  const slot = occupied[0];
  const hasEvent = slot.eventId !== null;

  if (hasEvent && slot.classId !== null) {
    return <TeacherViewSplitCell slot={slot} />;
  }

  // Standalone Cells (Class-only or Event-only in Teacher View)
  if (hasEvent) {
    const border = colorForEventId(slot.eventId!).border;
    return (
      <div className={`${STYLES.occupiedCard} ${border}`}>
        <EventHalf slot={slot} label={slot.eventName} />
      </div>
    );
  }

  return (
    <div className={`${STYLES.occupiedCard} border-slate-300`}>
      <ClassHalf label={slot.classDisplayName} />
    </div>
  );
}

// ── Inner Card Sections ──

function ClassHalf({ label }: { label: string | null }) {
  return (
    <div className={`${STYLES.cardSectionBase} ${STYLES.cardSectionNeutral}`}>
      <div className={`${STYLES.primaryLine} text-slate-800`}>{label}</div>
    </div>
  );
}

function TeacherHalf({
  name,
  subtitle,
}: {
  name: string;
  subtitle?: string | null;
}) {
  return (
    <div className={`${STYLES.cardSectionBase} ${STYLES.cardSectionNeutral}`}>
      <div className={`${STYLES.primaryLine} text-slate-800`}>{name}</div>
      {subtitle && (
        <div className={`${STYLES.secondaryLine} text-slate-500`}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function EventHalf({
  slot,
  label,
}: {
  slot: WeeklyScheduleReadDto;
  label: string | null;
}) {
  const color = slot.eventId !== null ? colorForEventId(slot.eventId) : null;
  const bg = color?.bg ?? "bg-slate-50";
  const text = color?.text ?? "text-slate-800";

  return (
    <div className={`${STYLES.cardSectionBase} ${bg}`}>
      <div className={`${STYLES.primaryLine} ${text}`}>{label}</div>
    </div>
  );
}

function SubjectHalf({ label }: { label: string | null }) {
  return (
    <div className={`${STYLES.cardSectionBase} bg-slate-50/50`}>
      <div className={`${STYLES.primaryLine} text-slate-600`}>
        {label ?? "—"}
      </div>
    </div>
  );
}

function SupportSection({ slot }: { slot: WeeklyScheduleReadDto }) {
  return (
    <div className={`${STYLES.cardSectionBase} ${STYLES.supportSection}`}>
      <div className={`${STYLES.primaryLine} text-amber-800`}>
        {slot.teacherName}
      </div>
      {slot.eventName && (
        <div className={`${STYLES.secondaryLine} text-amber-700`}>
          {slot.eventName}
        </div>
      )}
    </div>
  );
}

// ── Composite Card Layouts ──

function TeacherViewSplitCell({ slot }: { slot: WeeklyScheduleReadDto }) {
  const border =
    slot.eventId !== null
      ? colorForEventId(slot.eventId).border
      : "border-slate-300";

  return (
    <div className={`${STYLES.occupiedCard} ${border}`}>
      <ClassHalf label={slot.classDisplayName} />
      <div className={STYLES.cardDivider} />
      <EventHalf slot={slot} label={slot.eventName} />
    </div>
  );
}

function ClassViewCell({ slots }: { slots: WeeklyScheduleReadDto[] }) {
  const primary = slots.find((s) => !s.eventIsSupport);
  const supportSlots = slots.filter((s) => s.eventIsSupport);

  let cardBorder = "border-slate-300";
  if (primary?.eventId != null) {
    cardBorder = colorForEventId(primary.eventId).border;
  } else if (!primary && supportSlots.length > 0) {
    cardBorder = "border-amber-300";
  }

  return (
    <div className={`${STYLES.occupiedCard} ${cardBorder}`}>
      {primary ? (
        <TeacherHalf name={primary.teacherName} />
      ) : (
        <ClassHalf label="—" />
      )}

      <div className={STYLES.cardDivider} />

      {primary && primary.eventId !== null ? (
        <EventHalf slot={primary} label={primary.eventName} />
      ) : (
        <SubjectHalf label={primary?.teacherSubjectName ?? null} />
      )}

      {supportSlots.map((support) => (
        <div key={support.id} className="contents">
          <div className={STYLES.cardDivider} />
          <SupportSection slot={support} />
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Skeleton
// ════════════════════════════════════════════════════════════

function ScheduleGridSkeleton() {
  return (
    <div className={STYLES.skeletonWrap}>
      <div className={STYLES.skeletonHeaderRow}>
        <div className="w-32 shrink-0" />
        {PERIODS.map((period) => (
          <div key={period} className={STYLES.skeletonHeaderCell} />
        ))}
      </div>
      {DAYS.map((day) => (
        <div key={day.value} className={STYLES.skeletonBodyRow}>
          <div className={STYLES.skeletonLabelCell} />
          {PERIODS.map((period) => (
            <div key={period} className={STYLES.skeletonBodyCell} />
          ))}
        </div>
      ))}
    </div>
  );
}
