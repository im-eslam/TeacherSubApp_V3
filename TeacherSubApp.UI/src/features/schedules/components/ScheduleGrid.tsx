import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "react-aria-components/Table";
import { DAYS, PERIODS } from "../lib/labels";
import { indexSlotsByCoordinate, scheduleCoordinateKey } from "../lib/grid";
import type { WeeklyScheduleReadDto } from "../types";

export type ScheduleGridViewMode = "teacher" | "class";

interface ScheduleGridProps {
  slots: WeeklyScheduleReadDto[];
  viewMode: ScheduleGridViewMode;
  teacherSubjectById: ReadonlyMap<number, string | null>;
  isLoading: boolean;
}

const STYLES = {
  wrapper:
    "w-full overflow-auto rounded-2xl border border-slate-200 bg-white",
  table: "w-full min-w-[1200px] border-collapse",
  cornerCell:
    "sticky start-0 top-0 z-20 w-32 border-b border-e border-slate-200 bg-slate-50",
  periodHeaderCell:
    "sticky top-0 z-10 min-w-[150px] whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-4 text-center text-base font-semibold text-slate-700 outline-none",
  dayHeaderCell:
    "sticky start-0 z-10 whitespace-nowrap border-b border-e border-slate-200 bg-slate-50 px-4 py-4 text-center align-middle text-base font-semibold text-slate-700 outline-none",
  bodyRow: "group",
  cellBase:
    "border-b border-e border-slate-100 bg-white p-3 align-middle transition-colors duration-300 last:border-e-0",
  cellSurfaceEmpty:
    "flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50",
  emptyDash: "text-2xl font-medium text-slate-400",
  occupiedCard: "flex min-h-24 w-full flex-col overflow-hidden rounded-xl border",
  cardSectionBase:
    "flex flex-1 flex-col items-center justify-center px-2 py-2 text-center",
  cardSectionNeutral: "bg-white",
  cardDivider: "border-t border-slate-100",
  primaryLine:
    "max-w-full truncate text-base font-medium leading-snug tracking-tight",
  secondaryLine:
    "mt-0.5 max-w-full truncate text-sm font-normal leading-snug tracking-wide",
  skeletonWrap:
    "w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4",
  skeletonHeaderRow: "mb-3 grid grid-cols-8 gap-3",
  skeletonHeaderCell: "h-9 animate-pulse rounded-md bg-slate-100",
  skeletonBodyRow: "mb-3 grid grid-cols-8 gap-3 last:mb-0",
  skeletonBodyCell:
    "h-24 animate-pulse rounded-xl border border-slate-100 bg-slate-50",
};

const EVENT_COLOR_PALETTE = [
  { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  { bg: "bg-violet-50", text: "text-violet-800", border: "border-violet-200" },
  { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
  { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200" },
  { bg: "bg-fuchsia-50", text: "text-fuchsia-800", border: "border-fuchsia-200" },
  { bg: "bg-lime-50", text: "text-lime-800", border: "border-lime-200" },
  { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
  { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" },
  { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200" },
  { bg: "bg-pink-50", text: "text-pink-800", border: "border-pink-200" },
] as const;

function colorForEventId(eventId: number) {
  return EVENT_COLOR_PALETTE[Math.abs(eventId) % EVENT_COLOR_PALETTE.length];
}

export function ScheduleGrid({
  slots,
  viewMode,
  teacherSubjectById,
  isLoading,
}: ScheduleGridProps) {
  if (isLoading) return <ScheduleGridSkeleton />;

  const slotsByCoordinate = indexSlotsByCoordinate(slots);

  return (
    <div className={STYLES.wrapper}>
      <Table aria-label="الجدول الأسبوعي" className={STYLES.table}>
        <TableHeader>
          <Column id="day" isRowHeader className={STYLES.cornerCell}>
            <span className="sr-only">اليوم</span>
          </Column>
          {PERIODS.map((period) => (
            <Column
              key={period}
              id={`period-${period}`}
              className={STYLES.periodHeaderCell}
            >
              الحصة {period}
            </Column>
          ))}
        </TableHeader>
        <TableBody items={DAYS}>
          {(day) => (
            <Row id={`day-${day.value}`} className={STYLES.bodyRow}>
              <Cell className={STYLES.dayHeaderCell}>{day.label}</Cell>
              {PERIODS.map((period) => (
                <Cell key={period} className={STYLES.cellBase}>
                  <ScheduleCellContent
                    slots={slotsByCoordinate.get(scheduleCoordinateKey(day.value, period)) ?? []}
                    viewMode={viewMode}
                    teacherSubjectById={teacherSubjectById}
                  />
                </Cell>
              ))}
            </Row>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ScheduleCellContent({
  slots,
  viewMode,
  teacherSubjectById,
}: {
  slots: WeeklyScheduleReadDto[];
  viewMode: ScheduleGridViewMode;
  teacherSubjectById: ReadonlyMap<number, string | null>;
}) {
  if (slots.length === 0) {
    return (
      <div className={STYLES.cellSurfaceEmpty}>
        <span className={STYLES.emptyDash}>—</span>
      </div>
    );
  }

  return viewMode === "teacher" ? (
    <TeacherViewCell slot={slots[0]} />
  ) : (
    <ClassViewCell
      slots={slots}
      teacherSubjectById={teacherSubjectById}
    />
  );
}

function TeacherViewCell({ slot }: { slot: WeeklyScheduleReadDto }) {
  const border =
    slot.eventId === null
      ? "border-slate-300"
      : colorForEventId(slot.eventId).border;

  if (slot.classId !== null && slot.eventId !== null) {
    return (
      <div className={`${STYLES.occupiedCard} ${border}`}>
        <ClassHalf label={slot.classDisplayName} />
        <div className={STYLES.cardDivider} />
        <EventHalf slot={slot} />
      </div>
    );
  }

  if (slot.eventId !== null) {
    return (
      <div className={`${STYLES.occupiedCard} ${border}`}>
        <EventHalf slot={slot} />
      </div>
    );
  }

  return (
    <div className={`${STYLES.occupiedCard} border-slate-300`}>
      <ClassHalf label={slot.classDisplayName} />
    </div>
  );
}

function ClassViewCell({
  slots,
  teacherSubjectById,
}: {
  slots: WeeklyScheduleReadDto[];
  teacherSubjectById: ReadonlyMap<number, string | null>;
}) {
  return (
    <div className="flex min-h-24 flex-col gap-0">
      {slots.map((slot, index) => (
        <div
          key={slot.id}
          className={`${STYLES.occupiedCard} ${
            slot.eventId === null
              ? "border-slate-300"
              : colorForEventId(slot.eventId).border
          }`}
        >
          <TeacherHalf name={slot.teacherName} />
          <div className={STYLES.cardDivider} />
          {slot.eventId !== null ? (
            <EventHalf slot={slot} />
          ) : (
            <SubjectHalf label={teacherSubjectById.get(slot.teacherId) ?? null} />
          )}
          {index < slots.length - 1 && <div className="h-2" />}
        </div>
      ))}
    </div>
  );
}

function ClassHalf({ label }: { label: string | null }) {
  return (
    <div className={`${STYLES.cardSectionBase} ${STYLES.cardSectionNeutral}`}>
      <div className={`${STYLES.primaryLine} text-slate-800`}>
        {label ?? "—"}
      </div>
    </div>
  );
}

function TeacherHalf({ name }: { name: string }) {
  return (
    <div className={`${STYLES.cardSectionBase} ${STYLES.cardSectionNeutral}`}>
      <div className={`${STYLES.primaryLine} text-slate-800`}>{name}</div>
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

function EventHalf({ slot }: { slot: WeeklyScheduleReadDto }) {
  const color = slot.eventId === null ? null : colorForEventId(slot.eventId);
  return (
    <div className={`${STYLES.cardSectionBase} ${color?.bg ?? "bg-slate-50"}`}>
      <div className={`${STYLES.primaryLine} ${color?.text ?? "text-slate-800"}`}>
        {slot.eventName ?? "حدث"}
      </div>
    </div>
  );
}

function ScheduleGridSkeleton() {
  return (
    <div className={STYLES.skeletonWrap}>
      <div className={STYLES.skeletonHeaderRow}>
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className={STYLES.skeletonHeaderCell} />
        ))}
      </div>
      {DAYS.map((day) => (
        <div key={day.value} className={STYLES.skeletonBodyRow}>
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className={STYLES.skeletonBodyCell} />
          ))}
        </div>
      ))}
    </div>
  );
}
