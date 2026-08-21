import type { ReactNode } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  Column,
  Row,
  Cell,
  type SortDescriptor,
} from "react-aria-components/Table";
import { Button } from "react-aria-components/Button";
import {
  Pencil,
  Trash2,
  Plus,
  ServerCrash,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

const STYLES = {
  wrapper:
    "w-full overflow-auto bg-white border border-neutral-200/80 rounded-2xl",

  table: "w-full text-sm border-collapse",

  headerRow: "",
  column: [
    "sticky top-0 z-10 bg-neutral-50 border-b border-neutral-200/80",
    "px-4 py-3 text-xs font-semibold text-neutral-500 text-start whitespace-nowrap outline-none",
    "transition-colors duration-150",
  ].join(" "),
  columnActive: "text-blue-600",
  columnSortable:
    "cursor-pointer select-none hover:text-blue-600 hover:bg-neutral-100 transition-colors",
  columnActions: "text-end",
  columnInner: "flex items-center gap-1.5",
  sortIcon: "shrink-0 transition-colors duration-150",
  sortIconNeutral: "text-neutral-300",
  sortIconActive: "text-blue-500",

  row: "border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/80 transition-colors duration-150 outline-none focus-visible:bg-blue-50/60",

  cell: "px-4 py-3 text-sm text-neutral-800 whitespace-nowrap outline-none",
  cellPrimary:
    "px-4 py-3 text-sm font-medium text-neutral-900 whitespace-nowrap outline-none",
  cellMuted:
    "px-4 py-3 text-sm text-neutral-400 whitespace-nowrap outline-none",
  cellActions: "px-4 py-3 whitespace-nowrap outline-none",

  actionsGroup: "flex items-center gap-1 justify-end",
  actionEdit:
    "flex items-center justify-center w-8 h-8 rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
  actionDelete:
    "flex items-center justify-center w-8 h-8 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500/40",

  skeletonWrap:
    "w-full bg-white border border-neutral-200/80 rounded-2xl overflow-hidden",
  skeletonHeaderRow:
    "flex gap-4 px-4 py-3 border-b border-neutral-200/80 bg-neutral-50",
  skeletonHeaderCell: "h-3 bg-neutral-200 rounded animate-pulse flex-1",
  skeletonRow:
    "flex gap-4 px-4 py-3.5 border-b border-neutral-100 last:border-b-0",
  skeletonCell: "h-4 bg-neutral-200/70 rounded animate-pulse flex-1",

  emptyWrap:
    "flex flex-col items-center justify-center gap-2.5 py-24 text-center px-4",
  emptyIconError:
    "flex items-center justify-center w-16 h-16 rounded-3xl bg-red-50 text-red-400",
  emptyIconNeutral:
    "flex items-center justify-center w-16 h-16 rounded-3xl bg-neutral-100 text-neutral-400",
  emptyTitle: "text-sm font-medium text-neutral-900 mt-1",
  emptySubtitle: "text-xs text-neutral-400 leading-relaxed max-w-xs",
  emptyAddButton:
    "flex items-center gap-1.5 mt-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
};

// ════════════════════════════════════════════════════════════
// DataTable
// ════════════════════════════════════════════════════════════
// Usage (inside a feature page, e.g., SubjectsPage):
//
//   // 1. Define the config (Ideally outside the component or memoized)
//   const tableConfig: DataTableConfig<SubjectReadDto> = {
//     getKey: (item) => item.id,
//     actionsColumnLabel: "الإجراءات",
//     columns: [
//       {
//         id: "name",
//         label: "اسم المادة",
//         isPrimary: true,
//         allowsSorting: true,
//         renderCell: (item) => item.name,
//       },
//       // ... other columns
//     ],
//     emptyState: {
//       icon: <BookX size={24} />,
//       title: "لا توجد مواد",
//       titleFiltered: (q) => `لا توجد نتائج مطابقة لـ "${q}"`,
//       subtitle: "لم يتم إضافة أي مواد دراسية إلى النظام بعد.",
//       subtitleFiltered: "تأكد من صحة الكلمة وتجربة بحث مختلفة.",
//       addFirst: "إضافة مادة",
//     },
//   };
//
//   // 2. Render the table
//   <DataTable
//     config={tableConfig}
//     data={{
//       items: subjects,
//       isLoading: isLoading,
//       isError: isError,
//       searchQuery: searchQuery,
//     }}
//     actions={{
//       onAdd: () => setCreateModalOpen(true),
//       onEdit: (subject) => openEditModal(subject),
//       onDelete: (subject) => openDeleteModal(subject),
//     }}
//     sortDescriptor={sortDescriptor}
//     onSortChange={setSortDescriptor}
//   />
// ════════════════════════════════════════════════════════════

// ── Interfaces ──

export interface DataTableColumn<T> {
  id: string;
  label: string;
  renderCell: (item: T) => ReactNode;
  isPrimary?: boolean;
  allowsSorting?: boolean;
  align?: "start" | "end";
}

export interface DataTableData<T> {
  items: T[];
  isLoading: boolean;
  isAwaitingData?: boolean;
  isError: boolean;
  searchQuery: string;
  isFiltered?: boolean;
}

export interface DataTableActions<T> {
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}

export interface DataTableEmptyState {
  icon: ReactNode;
  title: string;
  titleFiltered: (query: string) => string;
  subtitle: string;
  subtitleFiltered: string;
  addFirst: string;
}

export interface DataTableErrorState {
  icon?: ReactNode;
  title: string;
  subtitle: string;
}

export interface DataTableConfig<T> {
  getKey: (item: T) => string | number;
  columns: DataTableColumn<T>[];
  emptyState: DataTableEmptyState;
  errorState?: DataTableErrorState;
  actionsColumnLabel: string;
}

// ── Sort Icon ──

function SortIcon({
  columnId,
  sortDescriptor,
  allowsSorting,
}: {
  columnId: string;
  sortDescriptor?: SortDescriptor;
  allowsSorting?: boolean;
}) {
  if (!allowsSorting) return null;

  const isActive = String(sortDescriptor?.column ?? "") === String(columnId);
  const iconClass = [
    STYLES.sortIcon,
    isActive ? STYLES.sortIconActive : STYLES.sortIconNeutral,
  ].join(" ");

  if (!isActive) {
    return <ArrowUpDown size={12} strokeWidth={2} className={iconClass} />;
  }

  return sortDescriptor?.direction === "ascending" ? (
    <ArrowUp size={12} strokeWidth={2.5} className={iconClass} />
  ) : (
    <ArrowDown size={12} strokeWidth={2.5} className={iconClass} />
  );
}

interface DataTableProps<T> {
  config: DataTableConfig<T>;
  data: DataTableData<T>;
  actions: DataTableActions<T>;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  "aria-label"?: string;
}

export function DataTable<T>({
  config,
  data,
  actions,
  sortDescriptor,
  onSortChange,
  "aria-label": ariaLabel,
}: DataTableProps<T>) {
  // 1. Loading State
  if ((data.isLoading && data.isAwaitingData) || data.isLoading) {
    return (
      <div className={STYLES.skeletonWrap}>
        <div className={STYLES.skeletonHeaderRow}>
          {config.columns.map((col) => (
            <div key={col.id} className={STYLES.skeletonHeaderCell} />
          ))}
          <div className={`${STYLES.skeletonHeaderCell} max-w-16`} />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={STYLES.skeletonRow}>
            {config.columns.map((col) => (
              <div key={col.id} className={STYLES.skeletonCell} />
            ))}
            <div className={`${STYLES.skeletonCell} max-w-16`} />
          </div>
        ))}
      </div>
    );
  }
  if (data.isAwaitingData) {
    return null;
  }

  // 2. Empty State
  if (data.items.length === 0) {
    // 2a. Error with no data
    if (data.isError) {
      const errorState = config.errorState;
      return (
        <div className={STYLES.wrapper}>
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
        </div>
      );
    }

    // 2b. Genuinely empty
    const isFiltered =
      data.searchQuery.trim().length > 0 || data.isFiltered === true;
    const { emptyState } = config;

    return (
      <div className={STYLES.wrapper}>
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
      </div>
    );
  }

  // 3. Data State
  return (
    <div className={STYLES.wrapper}>
      <Table
        aria-label={ariaLabel ?? "جدول البيانات"}
        className={STYLES.table}
        sortDescriptor={sortDescriptor}
        onSortChange={onSortChange}
      >
        <TableHeader>
          {config.columns.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              isRowHeader={col.isPrimary}
              allowsSorting={col.allowsSorting}
              className={[
                STYLES.column,
                col.allowsSorting ? STYLES.columnSortable : "",
                sortDescriptor?.column === col.id ? STYLES.columnActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className={STYLES.columnInner}>
                {col.label}
                <SortIcon
                  columnId={col.id}
                  sortDescriptor={sortDescriptor}
                  allowsSorting={col.allowsSorting}
                />
              </div>
            </Column>
          ))}
          <Column
            id="__actions"
            className={`${STYLES.column} ${STYLES.columnActions}`}
          >
            {config.actionsColumnLabel}
          </Column>
        </TableHeader>

        <TableBody items={data.items}>
          {(item) => (
            <Row
              key={config.getKey(item)}
              id={config.getKey(item)}
              className={STYLES.row}
            >
              {config.columns.map((col) => {
                const content = col.renderCell(item);
                const cellClass = col.isPrimary
                  ? STYLES.cellPrimary
                  : content == null || content === ""
                    ? STYLES.cellMuted
                    : STYLES.cell;

                return (
                  <Cell key={col.id} className={cellClass}>
                    {content}
                  </Cell>
                );
              })}

              <Cell className={STYLES.cellActions}>
                <div className={STYLES.actionsGroup}>
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
              </Cell>
            </Row>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
