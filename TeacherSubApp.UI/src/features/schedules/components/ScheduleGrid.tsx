import { Button } from "react-aria-components/Button";
import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableHeader,
} from "react-aria-components/Table";
import { CalendarPlus } from "lucide-react";
import { DAYS, PERIODS } from "../lib/labels";
import type {
  SlotCoordinate,
  WeeklyScheduleReadDto,
} from "../types";

export type ScheduleGridViewMode = "teacher" | "class";

interface ScheduleGridProps {
  slots: WeeklyScheduleReadDto[];
  viewMode: ScheduleGridViewMode;
  isLoading: boolean;
  onCellPress: (coordinate: SlotCoordinate, slot: WeeklyScheduleReadDto | null) => void;
}

const STYLES = {
  wrapper:
    "w-full overflow-auto rounded-2xl border border-neutral-200/80 bg-white shadow-sm",
  table: "w-full min-w-[1100px] border-collapse text-sm",
  column:
    "sticky top-0 z-10 whitespace-nowrap border-b border-e border-neutral-200/80 bg-neutral-50 px-4 py-3 text-center text-xs font-semibold text-neutral-500 outline-none",
  row: "border-b border-neutral-100 last:border-b-0",
  rowHeader:
    "sticky start-0 z-[5] w-32 whitespace-nowrap border-e border-neutral-200/80 bg-neutral-50 px-4 py-3 text-center text-xs font-semibold text-neutral-600 outline-none",
  cell: "border-e border-neutral-100 p-2 align-top last:border-e-0",
  emptyButton:
    "flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 text-neutral-300 outline-none transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:ring-2 focus-visible:ring-blue-500/30",
  occupiedButton:
    "flex min-h-24 w-full flex-col items-stretch rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-start outline-none transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500/30",
  mutedButton:
    "flex min-h-24 w-full flex-col items-stretch rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-start outline-none transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500/30",
};

export function ScheduleGrid({
  slots,
  viewMode,
  isLoading,
  onCellPress,
}: ScheduleGridProps) {
  if (isLoading) return <ScheduleGridSkeleton />;

  const slotsByCoordinate = new Map<string, WeeklyScheduleReadDto[]>();
  for (const slot of slots) {
    const key = coordinateKey(slot.dayOfWeek, slot.periodNumber);
    const existing = slotsByCoordinate.get(key) ?? [];
    existing.push(slot);
    slotsByCoordinate.set(key, existing);
  }

  return (
    <div className={STYLES.wrapper}>
      <Table aria-label="الجدول الأسبوعي" className={STYLES.table}>
        <TableHeader>
          <Column id="day" isRowHeader className={STYLES.column}>
            اليوم
          </Column>
          {PERIODS.map((period) => (
            <Column key={period} id={`period-${period}`} className={STYLES.column}>
              الحصة {period}
            </Column>
          ))}
        </TableHeader>
        <TableBody items={DAYS}>
          {(day) => (
            <Row id={`day-${day.value}`} className={STYLES.row}>
              <Cell className={STYLES.rowHeader}>{day.label}</Cell>
              {PERIODS.map((period) => {
                const coordinate = {
                  teacherId: slots[0]?.teacherId ?? 0,
                  dayOfWeek: day.value,
                  periodNumber: period,
                } satisfies SlotCoordinate;
                const cellSlots =
                  slotsByCoordinate.get(coordinateKey(day.value, period)) ?? [];

                return (
                  <Cell
                    key={period}
                    className={STYLES.cell}
                  >
                    <ScheduleCell
                      coordinate={coordinate}
                      slots={cellSlots}
                      viewMode={viewMode}
                      onPress={onCellPress}
                    />
                  </Cell>
                );
              })}
            </Row>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ScheduleCell({
  coordinate,
  slots,
  viewMode,
  onPress,
}: {
  coordinate: SlotCoordinate;
  slots: WeeklyScheduleReadDto[];
  viewMode: ScheduleGridViewMode;
  onPress: ScheduleGridProps["onCellPress"];
}) {
  const firstSlot = slots[0] ?? null;

  if (slots.length === 0) {
    return (
      <Button
        type="button"
        className={STYLES.emptyButton}
        onPress={() => onPress(coordinate, null)}
        aria-label={`إضافة ${coordinate.periodNumber}، ${coordinate.dayOfWeek}`}
      >
        <CalendarPlus size={18} strokeWidth={1.8} />
        <span className="text-[11px]">إضافة تعيين</span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      className={viewMode === "class" ? STYLES.mutedButton : STYLES.occupiedButton}
      onPress={() => onPress(coordinate, firstSlot)}
      aria-label={`تعديل الحصة ${firstSlot.periodNumber}`}
    >
      <span className="truncate font-semibold text-neutral-800">
        {viewMode === "class"
          ? firstSlot.teacherName
          : firstSlot.classDisplayName ?? firstSlot.eventName ?? "تعيين"}
      </span>
      {viewMode === "class" && firstSlot.eventName && (
        <span className="mt-1 truncate text-xs text-neutral-500">
          {firstSlot.eventName}
        </span>
      )}
      {viewMode === "teacher" && firstSlot.eventName && firstSlot.classDisplayName && (
        <span className="mt-1 truncate text-xs text-blue-700">
          {firstSlot.eventName}
        </span>
      )}
      {slots.length > 1 && (
        <span className="mt-2 text-[11px] text-neutral-400">
          {slots.length} تعيينات
        </span>
      )}
    </Button>
  );
}

function coordinateKey(dayOfWeek: number, periodNumber: number): string {
  return `${dayOfWeek}-${periodNumber}`;
}

function ScheduleGridSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
      <div className="mb-3 grid grid-cols-8 gap-3">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-9 animate-pulse rounded-lg bg-neutral-100" />
        ))}
      </div>
      {DAYS.map((day) => (
        <div key={day.value} className="mb-3 grid grid-cols-8 gap-3 last:mb-0">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl border border-neutral-100 bg-neutral-50"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
