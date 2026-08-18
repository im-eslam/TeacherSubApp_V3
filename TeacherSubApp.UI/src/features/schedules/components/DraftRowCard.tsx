import { Plus, Pencil, Trash2, ArrowLeftRight, X } from "lucide-react";
import { Button } from "react-aria-components";
import { slotLabel, contentLabel } from "../lib/labels";
import type { DraftRow } from "../types";

const STYLES = {
  row: "flex items-start gap-3 px-4 py-3.5 bg-white border border-neutral-200/80 rounded-xl",
  badge: {
    base: "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5",
    add: "bg-emerald-50 text-emerald-600",
    edit: "bg-blue-50 text-blue-600",
    delete: "bg-red-50 text-red-500",
    swap: "bg-violet-50 text-violet-600",
  },
  content: "flex-1 min-w-0 flex flex-col gap-0.5",
  target: "text-sm font-medium text-neutral-900 truncate",
  opLabel: "text-neutral-400 font-normal",
  transition: "flex items-center gap-1.5 text-xs mt-0.5 flex-wrap",
  before: "text-neutral-400 line-through decoration-neutral-300",
  after: "text-neutral-700 font-medium",
  swapLine: "text-xs text-neutral-500 mt-0.5",
  actions: "flex items-center gap-0.5 shrink-0",
  editBtn: [
    "flex items-center justify-center w-8 h-8 min-w-[36px] min-h-[36px]",
    "rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50",
    "transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
  ].join(" "),
  removeBtn: [
    "flex items-center justify-center w-8 h-8 min-w-[36px] min-h-[36px]",
    "rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50",
    "transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500/30",
  ].join(" "),
};

const OP_ICON = {
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  swap: ArrowLeftRight,
};
const OP_LABEL = { add: "إضافة", edit: "تعديل", delete: "حذف", swap: "تبديل" };

export interface DraftRowCardProps {
  row: DraftRow;
  onRemove: () => void;
  onEdit?: () => void;
}

export function DraftRowCard({ row, onRemove, onEdit }: DraftRowCardProps) {
  const Icon = OP_ICON[row.type];
  const canEdit = row.type !== "delete" && onEdit != null;

  return (
    <div className={STYLES.row}>
      <span className={[STYLES.badge.base, STYLES.badge[row.type]].join(" ")}>
        <Icon size={15} strokeWidth={2.25} />
      </span>

      <div className={STYLES.content}>
        {row.type === "swap" ? (
          <>
            <span className={STYLES.target}>
              <span className={STYLES.opLabel}>{OP_LABEL.swap} · </span>
              {slotLabel(
                row.a.teacherName,
                row.a.dayOfWeek,
                row.a.periodNumber,
              )}
              {" ⇄ "}
              {slotLabel(
                row.b.teacherName,
                row.b.dayOfWeek,
                row.b.periodNumber,
              )}
            </span>
            <span className={STYLES.swapLine}>
              {contentLabel(row.a.content)} ← → {contentLabel(row.b.content)}
            </span>
          </>
        ) : (
          <>
            <span className={STYLES.target}>
              <span className={STYLES.opLabel}>{OP_LABEL[row.type]} · </span>
              {slotLabel(row.teacherName, row.dayOfWeek, row.periodNumber)}
            </span>
            {row.type === "add" && (
              <span className={STYLES.transition}>
                <span className={STYLES.after}>
                  {contentLabel(row.content)}
                </span>
              </span>
            )}
            {row.type === "edit" && (
              <span className={STYLES.transition}>
                <span className={STYLES.before}>
                  {contentLabel(row.before)}
                </span>
                <span className="text-neutral-300">←</span>
                <span className={STYLES.after}>
                  {contentLabel(row.content)}
                </span>
              </span>
            )}
            {row.type === "delete" && (
              <span className={STYLES.transition}>
                <span className={STYLES.before}>
                  {contentLabel(row.before)}
                </span>
              </span>
            )}
          </>
        )}
      </div>

      <div className={STYLES.actions}>
        {canEdit && (
          <Button
            type="button"
            onPress={onEdit}
            aria-label="تعديل هذا التغيير"
            className={STYLES.editBtn}
          >
            <Pencil size={14} strokeWidth={2.25} />
          </Button>
        )}
        <Button
          type="button"
          onPress={onRemove}
          aria-label="إزالة هذا التغيير"
          className={STYLES.removeBtn}
        >
          <X size={15} strokeWidth={2.25} />
        </Button>
      </div>
    </div>
  );
}
