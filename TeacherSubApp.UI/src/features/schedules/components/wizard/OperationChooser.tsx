import { PlusCircle, Pencil, ArrowLeftRight, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DraftOperationKind } from "../../draftStore";

const STYLES = {
  grid: "grid grid-cols-2 gap-3",
  card: [
    "flex flex-col items-start gap-2 p-4 rounded-2xl border text-start",
    "border-neutral-200/80 bg-white hover:border-blue-300 hover:bg-blue-50/40",
    "transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
  ].join(" "),
  icon: "flex items-center justify-center w-9 h-9 rounded-xl",
  title: "text-sm font-semibold text-neutral-900",
  subtitle: "text-xs text-neutral-500 leading-relaxed",
};

interface OperationCardConfig {
  kind: DraftOperationKind;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconClass: string;
}

const OPERATIONS: OperationCardConfig[] = [
  {
    kind: "add",
    title: "إضافة تعيين",
    subtitle: "إنشاء تعيين جديد في حصة شاغرة",
    icon: PlusCircle,
    iconClass: "bg-emerald-50 text-emerald-600",
  },
  {
    kind: "edit",
    title: "تعديل تعيين",
    subtitle: "تغيير بيانات الصف أو الحدث لحصة موجودة",
    icon: Pencil,
    iconClass: "bg-blue-50 text-blue-600",
  },
  {
    kind: "swap",
    title: "تبديل موضعين",
    subtitle: "تبادل مكانَي حصتين موجودتين",
    icon: ArrowLeftRight,
    iconClass: "bg-amber-50 text-amber-600",
  },
  {
    kind: "delete",
    title: "حذف تعيين",
    subtitle: "إزالة تعيين موجود من الجدول",
    icon: Trash2,
    iconClass: "bg-red-50 text-red-600",
  },
];

interface OperationChooserProps {
  onChoose: (kind: DraftOperationKind) => void;
}

export function OperationChooser({ onChoose }: OperationChooserProps) {
  return (
    <div className={STYLES.grid}>
      {OPERATIONS.map((op) => (
        <button
          key={op.kind}
          type="button"
          onClick={() => onChoose(op.kind)}
          className={STYLES.card}
        >
          <span className={[STYLES.icon, op.iconClass].join(" ")}>
            <op.icon size={18} strokeWidth={2} />
          </span>
          <span className={STYLES.title}>{op.title}</span>
          <span className={STYLES.subtitle}>{op.subtitle}</span>
        </button>
      ))}
    </div>
  );
}
