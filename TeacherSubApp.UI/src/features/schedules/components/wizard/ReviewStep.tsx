import {
  PlusCircle,
  Pencil,
  ArrowLeftRight,
  Trash2,
  X,
  Pencil as EditIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DraftOperation } from "../../draftStore";
import { dayLabel, eventColor } from "../../constants";

const STYLES = {
  list: "flex flex-col gap-2.5",
  row: "flex items-center gap-3 p-4 rounded-2xl border border-neutral-200/70 bg-white",
  index:
    "flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 text-neutral-500 text-[11px] font-semibold shrink-0 leading-none",
  iconWrap: "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
  content: "flex-1 min-w-0 flex flex-col gap-1.5",
  kindLabel: "text-xs font-semibold leading-none",
  coordLine: "text-sm font-semibold text-neutral-800 leading-snug",
  tagRow: "flex flex-wrap items-center gap-1.5",
  tag: "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium leading-none",
  tagClass: "bg-neutral-100 text-neutral-800",
  tagEvent: "border",
  tagEmpty: "text-sm font-medium text-neutral-400",
  swapLine: "flex flex-col gap-1 text-sm font-semibold text-neutral-800 leading-snug",
  swapArrow: "flex items-center justify-center text-neutral-300 shrink-0 py-0.5",
  deleteLine: "text-sm font-semibold text-red-700 leading-snug",
  actions: "flex items-center gap-1 shrink-0",
  actionButton:
    "flex items-center justify-center w-8 h-8 p-0 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors outline-none leading-none",
  actionDelete: "hover:text-red-600 hover:bg-red-50",
  empty:
    "flex flex-col items-center justify-center gap-2 py-10 text-center text-neutral-400 text-sm",
};

const KIND_META: Record<
  DraftOperation["kind"],
  { label: string; icon: LucideIcon; iconWrapClassName: string; textClassName: string }
> = {
  add: {
    label: "إضافة",
    icon: PlusCircle,
    iconWrapClassName: "bg-emerald-50 text-emerald-600",
    textClassName: "text-emerald-600",
  },
  edit: {
    label: "تعديل",
    icon: Pencil,
    iconWrapClassName: "bg-blue-50 text-blue-600",
    textClassName: "text-blue-600",
  },
  swap: {
    label: "تبديل",
    icon: ArrowLeftRight,
    iconWrapClassName: "bg-amber-50 text-amber-600",
    textClassName: "text-amber-600",
  },
  delete: {
    label: "حذف",
    icon: Trash2,
    iconWrapClassName: "bg-red-50 text-red-600",
    textClassName: "text-red-600",
  },
};

function coordLabel(
  teacherName: string,
  dayOfWeek: number,
  periodNumber: number,
): string {
  return `${teacherName} · ${dayLabel(dayOfWeek)} · حصة ${periodNumber}`;
}

function OccupantTags({
  className,
  eventName,
  eventId,
}: {
  className: string | null;
  eventName: string | null;
  eventId: number | null;
}) {
  if (!className && !eventName) {
    return <span className={STYLES.tagEmpty}>بدون تعيين</span>;
  }

  const color = eventId !== null ? eventColor(eventId) : null;

  return (
    <div className={STYLES.tagRow}>
      {className && (
        <span className={[STYLES.tag, STYLES.tagClass].join(" ")}>
          {className}
        </span>
      )}
      {eventName && (
        <span
          className={[
            STYLES.tag,
            STYLES.tagEvent,
            color?.bg ?? "bg-neutral-100",
            color?.text ?? "text-neutral-800",
            color?.border ?? "border-neutral-200",
          ].join(" ")}
        >
          {eventName}
        </span>
      )}
    </div>
  );
}

interface ReviewStepProps {
  operations: DraftOperation[];
  onEdit: (draftId: string) => void;
  onRemove: (draftId: string) => void;
}

export function ReviewStep({ operations, onEdit, onRemove }: ReviewStepProps) {
  if (operations.length === 0) {
    return (
      <div className={STYLES.empty}>
        <span>لا توجد عمليات مُضافة إلى المسودة بعد</span>
      </div>
    );
  }

  return (
    <div className={STYLES.list}>
      {operations.map((op, index) => {
        const meta = KIND_META[op.kind];
        return (
          <div key={op.draftId} className={STYLES.row}>
            <span className={STYLES.index}>{index + 1}</span>
            <span className={[STYLES.iconWrap, meta.iconWrapClassName].join(" ")}>
              <meta.icon size={16} strokeWidth={2} />
            </span>
            <div className={STYLES.content}>
              <span className={[STYLES.kindLabel, meta.textClassName].join(" ")}>
                {meta.label}
              </span>

              {(op.kind === "add" || op.kind === "edit") && (
                <>
                  <span className={STYLES.coordLine}>
                    {coordLabel(op.teacherName, op.dayOfWeek, op.periodNumber)}
                  </span>
                  <OccupantTags
                    className={op.className}
                    eventName={op.eventName}
                    eventId={op.eventId}
                  />
                </>
              )}

              {op.kind === "swap" && (
                <div className={STYLES.swapLine}>
                  <div className="flex flex-col gap-1">
                    <span>
                      {coordLabel(
                        op.slotAInfo.teacherName,
                        op.slotAInfo.dayOfWeek,
                        op.slotAInfo.periodNumber,
                      )}
                    </span>
                    <OccupantTags
                      className={op.slotAInfo.classDisplayName}
                      eventName={op.slotAInfo.eventName}
                      eventId={op.slotAInfo.eventId}
                    />
                  </div>
                  <span className={STYLES.swapArrow}>
                    <ArrowLeftRight size={14} strokeWidth={2} />
                  </span>
                  <div className="flex flex-col gap-1">
                    <span>
                      {coordLabel(
                        op.slotBInfo.teacherName,
                        op.slotBInfo.dayOfWeek,
                        op.slotBInfo.periodNumber,
                      )}
                    </span>
                    <OccupantTags
                      className={op.slotBInfo.classDisplayName}
                      eventName={op.slotBInfo.eventName}
                      eventId={op.slotBInfo.eventId}
                    />
                  </div>
                </div>
              )}

              {op.kind === "delete" && (
                <span className={STYLES.deleteLine}>{op.summaryLabel}</span>
              )}
            </div>
            <div className={STYLES.actions}>
              <button
                type="button"
                onClick={() => onEdit(op.draftId)}
                aria-label="تعديل"
                className={STYLES.actionButton}
              >
                <EditIcon size={14} strokeWidth={2} className="shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(op.draftId)}
                aria-label="حذف"
                className={[STYLES.actionButton, STYLES.actionDelete].join(" ")}
              >
                <X size={14} strokeWidth={2} className="shrink-0" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
