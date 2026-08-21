import type { ReactNode } from "react";
import {
  GridList,
  GridListItem,
  type GridListProps,
} from "react-aria-components/GridList";
import { Button } from "react-aria-components/Button";
import { Pencil, Trash2, Plus, ServerCrash } from "lucide-react";

const STYLES = {
  skeletonWrap: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5",
  skeletonCard: "w-full bg-neutral-200/60 animate-pulse rounded-2xl",

  emptyWrap:
    "col-span-full flex flex-col items-center justify-center gap-2.5 py-24 text-center px-4",
  emptyIconError:
    "flex items-center justify-center w-16 h-16 rounded-3xl bg-red-50 text-red-400",
  emptyIconNeutral:
    "flex items-center justify-center w-16 h-16 rounded-3xl bg-neutral-100 text-neutral-400",
  emptyTitle: "text-sm font-medium text-neutral-900 mt-1",
  emptySubtitle: "text-xs text-neutral-400 leading-relaxed max-w-xs",
  emptyAddButton:
    "flex items-center gap-1.5 mt-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",

  list: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-0 outline-none",

  item: [
    "group flex flex-row items-center justify-between gap-4 p-4 bg-white",
    "border border-neutral-200/80 rounded-2xl transition-colors",
    "outline-none cursor-default",
    "hover:border-blue-300 hover:shadow-sm",
  ].join(" "),

  itemContent: "flex-1 flex items-center gap-3 overflow-hidden min-w-0",

  actions:
    "flex items-center gap-1.5 shrink-0 opacity-70 transition-opacity duration-300 group-hover:opacity-100",
  actionEdit:
    "flex items-center justify-center w-8 h-8 rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
  actionDelete:
    "flex items-center justify-center w-8 h-8 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500/40",
};

// ════════════════════════════════════════════════════════════
// EntityGrid
// ════════════════════════════════════════════════════════════
// Usage (inside a feature, e.g. SubjectGrid):
//
//   const SUBJECT_CONFIG: GridConfig<SubjectReadDto> = {
//     getKey: (subject) => subject.id,
//     skeletonHeight: "h-[60px]",
//     emptyState: { ... },
//     renderItem: (subject) => (
//       <>
//         <div className="...icon wrapper...">
//           <BookOpen size={18} />
//         </div>
//         <span className="...">{subject.name}</span>
//       </>
//     ),
//   };
//
//   <EntityGrid
//     config={SUBJECT_CONFIG}
//     data={{ items: subjects, isLoading, isError, searchQuery }}
//     actions={{ onAdd, onEdit, onDelete }}
//   />
// ════════════════════════════════════════════════════════════

// ── Interfaces ──

export interface GridData<T> {
  items: T[];
  isLoading: boolean;
  isAwaitingData?: boolean;
  isError: boolean;
  searchQuery: string;
}

export interface GridActions<T> {
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}

export interface GridConfig<T> {
  getKey: (item: T) => string | number;
  renderItem: (item: T) => ReactNode;
  getTextValue?: (item: T) => string;
  skeletonHeight: string;
  emptyState: {
    icon: ReactNode;
    title: string;
    titleFiltered: (query: string) => string;
    subtitle: string;
    subtitleFiltered: string;
    addFirst: string;
  };
  errorState?: {
    icon?: ReactNode;
    title: string;
    subtitle: string;
  };
}

interface EntityGridProps<T> extends Pick<
  GridListProps<T>,
  "layout" | "aria-label"
> {
  data: GridData<T>;
  actions: GridActions<T>;
  config: GridConfig<T>;
}

export function EntityGrid<T>({
  data,
  actions,
  config,
  layout = "grid",
  "aria-label": ariaLabel,
}: EntityGridProps<T>) {
  // 1. Loading State
  if ((data.isLoading && data.isAwaitingData) || data.isLoading) {
    return (
      <div className={STYLES.skeletonWrap}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`${STYLES.skeletonCard} ${config.skeletonHeight}`}
          />
        ))}
      </div>
    );
  }
  if (data.isAwaitingData) {
    return null;
  }

  // 2. Empty State
  if (data.items.length === 0) {
    // 2a. Error with no data — show a dedicated error state
    if (data.isError) {
      const errorState = config.errorState;
      return (
        <div className={STYLES.emptyWrap}>
          <div className={STYLES.emptyIconError}>
            {errorState?.icon ?? <ServerCrash size={28} strokeWidth={1.5} />}
          </div>
          <p className={STYLES.emptyTitle}>
            {errorState?.title ?? "تعذّر تحميل البيانات"}
          </p>
          <p className={STYLES.emptySubtitle}>
            {errorState?.subtitle ??
              "حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى."}
          </p>
        </div>
      );
    }

    // 2b. Genuinely empty — no error, no items
    const isFiltered = data.searchQuery.trim().length > 0;
    const { emptyState } = config;

    return (
      <div className={STYLES.emptyWrap}>
        <div className={STYLES.emptyIconNeutral}>{emptyState.icon}</div>
        <p className={STYLES.emptyTitle}>
          {isFiltered
            ? emptyState.titleFiltered(data.searchQuery)
            : emptyState.title}
        </p>
        <p className={STYLES.emptySubtitle}>
          {isFiltered ? emptyState.subtitleFiltered : emptyState.subtitle}
        </p>
        {!isFiltered && (
          <button
            type="button"
            onClick={actions.onAdd}
            className={STYLES.emptyAddButton}
          >
            <Plus size={16} strokeWidth={2.5} />
            {emptyState.addFirst}
          </button>
        )}
      </div>
    );
  }

  // 3. Data State
  return (
    <GridList
      aria-label={ariaLabel ?? "قائمة العناصر"}
      layout={layout}
      items={data.items}
      className={STYLES.list}
    >
      {(item) => (
        <GridListItem
          key={config.getKey(item)}
          id={config.getKey(item)}
          textValue={config.getTextValue?.(item) ?? String(config.getKey(item))}
          className={STYLES.item}
        >
          {/* Feature-specific content */}
          <div className={STYLES.itemContent}>{config.renderItem(item)}</div>

          {/* Shared Action Buttons */}
          <div className={STYLES.actions}>
            <Button
              type="button"
              onPress={() => actions.onEdit(item)}
              aria-label="تعديل"
              className={STYLES.actionEdit}
            >
              <Pencil size={15} strokeWidth={2} />
            </Button>
            <Button
              type="button"
              onPress={() => actions.onDelete(item)}
              aria-label="حذف"
              className={STYLES.actionDelete}
            >
              <Trash2 size={15} strokeWidth={2} />
            </Button>
          </div>
        </GridListItem>
      )}
    </GridList>
  );
}
