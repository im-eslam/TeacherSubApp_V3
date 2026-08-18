import { CalendarClock, ShieldCheck, RefreshCw } from "lucide-react";
import {
  EntityGrid,
  type GridConfig,
} from "../../../components/orgnization/EntityGrid";
import type { EventKeyReadDto } from "../types";


const STYLES = {
  icon: "shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600",

  textCol: "flex flex-1 items-center min-w-0 gap-2.5",
  name: "text-sm font-semibold text-neutral-900 truncate",

  badgeRow: "flex items-center gap-2",
  badgeSupport:
    "inline-flex items-center gap-1 shrink-0 px-2 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 rounded-full",
  badgeStandby:
    "inline-flex items-center gap-1 shrink-0 px-2 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 rounded-full",
};

// ── Configuration ──

const EVENT_KEY_CONFIG: GridConfig<EventKeyReadDto> = {
  getKey: (eventKey) => eventKey.id,
  getTextValue: (eventKey) => eventKey.eventName,
  skeletonHeight: "h-[68px]",
  emptyState: {
    icon: <CalendarClock size={28} strokeWidth={1.5} />,
    title: "لم تُضف أي أحداث بعد",
    titleFiltered: (query) => `لا توجد نتائج مطابقة لـ "${query}"`,
    subtitle:
      "أضف الأحداث (الحصص غير الدراسية أو الخاصة، مثل الاجتماعات وحصة القيم) لتتمكن من ربطها بجدول المعلمين الأسبوعي",
    subtitleFiltered: "جرّب كلمة بحث أخرى أو امسح الفلتر",
    addFirst: "إضافة أول حدث",
  },
  errorState: {
    title: "تعذّر تحميل الأحداث",
    subtitle: "تحقق من اتصالك بالإنترنت أو حاول مرة أخرى.",
  },
  renderItem: (eventKey) => (
    <>
      <div className={STYLES.icon}>
        <CalendarClock size={18} strokeWidth={2} />
      </div>

      <div className={STYLES.textCol}>
        <span className={STYLES.name}>{eventKey.eventName}</span>

        {(eventKey.isSupport || eventKey.isStandby) && (
          <div className={STYLES.badgeRow}>
            {eventKey.isSupport && (
              <span className={STYLES.badgeSupport}>
                <ShieldCheck size={11} strokeWidth={2.5} />
                دعم
              </span>
            )}
            {eventKey.isStandby && (
              <span className={STYLES.badgeStandby}>
                <RefreshCw size={11} strokeWidth={2.5} />
                احتياطي
              </span>
            )}
          </div>
        )}
      </div>
    </>
  ),
};

// ════════════════════════════════════════════════════════════
// EventKeyGrid
// ════════════════════════════════════════════════════════════

interface EventKeyGridProps {
  eventKeys: EventKeyReadDto[];
  isLoading: boolean;
  isAwaitingData?: boolean;
  isError: boolean;
  searchQuery: string;
  onEdit: (eventKey: EventKeyReadDto) => void;
  onDelete: (eventKey: EventKeyReadDto) => void;
  onAdd: () => void;
}

export function EventKeyGrid(props: EventKeyGridProps) {
  return (
    <EntityGrid<EventKeyReadDto>
      aria-label="الأحداث"
      config={EVENT_KEY_CONFIG}
      data={{
        items: props.eventKeys,
        isLoading: props.isLoading,
        isAwaitingData: props.isAwaitingData,
        isError: props.isError,
        searchQuery: props.searchQuery,
      }}
      actions={{
        onAdd: props.onAdd,
        onEdit: props.onEdit,
        onDelete: props.onDelete,
      }}
    />
  );
}
