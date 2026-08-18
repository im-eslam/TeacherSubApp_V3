import { useMemo } from "react";
import { SearchableSelect } from "../../../components/controls/SearchableSelect";
import type { SchoolClassReadDto } from "../../classes/types";
import type { EventKeyReadDto } from "../../events/types";

const NONE_VALUE = "none";

const STYLES = {
  grid: "grid grid-cols-2 gap-3",
  hint: "text-[11px] text-neutral-400 mt-1",
  warn: "text-[11px] text-amber-700 mt-1",
};

export interface SlotContentFieldsProps {
  classes: SchoolClassReadDto[];
  events: EventKeyReadDto[];
  classId: number | null;
  eventId: number | null;
  onClassChange: (id: number | null) => void;
  onEventChange: (id: number | null) => void;
}

export function SlotContentFields({
  classes,
  events,
  classId,
  eventId,
  onClassChange,
  onEventChange,
}: SlotContentFieldsProps) {
  const classOptions = useMemo(
    () => [
      { value: NONE_VALUE, label: "— بلا فصل —" },
      ...classes.map((c) => ({ value: String(c.id), label: c.displayName })),
    ],
    [classes],
  );

  const eventOptions = useMemo(
    () => [
      { value: NONE_VALUE, label: "— بلا حدث —" },
      ...events.map((e) => ({ value: String(e.id), label: e.eventName })),
    ],
    [events],
  );

  const selectedEvent =
    eventId !== null ? (events.find((e) => e.id === eventId) ?? null) : null;

  const hasNoContent = classId === null && eventId === null;
  const supportMissingClass =
    selectedEvent?.isSupport === true && classId === null;
  const standbyHasClass = selectedEvent?.isStandby === true && classId !== null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className={STYLES.grid}>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1.5">
            الفصل
          </label>
          <SearchableSelect
            value={classId === null ? NONE_VALUE : String(classId)}
            onChange={(v) => onClassChange(v === NONE_VALUE ? null : Number(v))}
            options={classOptions}
            placeholder="— بلا فصل —"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1.5">
            الحدث
          </label>
          <SearchableSelect
            value={eventId === null ? NONE_VALUE : String(eventId)}
            onChange={(v) => onEventChange(v === NONE_VALUE ? null : Number(v))}
            options={eventOptions}
            placeholder="— بلا حدث —"
          />
        </div>
      </div>

      {hasNoContent && (
        <p className={STYLES.warn}>يجب اختيار فصل أو حدث لهذه الحصة.</p>
      )}
      {supportMissingClass && (
        <p className={STYLES.warn}>
          "{selectedEvent?.eventName}" حدث دعم ويتطلب اختيار فصل أيضاً.
        </p>
      )}
      {standbyHasClass && (
        <p className={STYLES.warn}>
          "{selectedEvent?.eventName}" حدث احتياطي ولا يمكن أن يقترن بفصل.
        </p>
      )}
      {!hasNoContent && !supportMissingClass && !standbyHasClass && (
        <p className={STYLES.hint}>
          اختر فصلاً لحصة دراسية عادية، أو حدثاً لحصة غير دراسية، أو كليهما لحدث
          دعم.
        </p>
      )}
    </div>
  );
}
