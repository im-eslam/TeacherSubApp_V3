import type { ReactNode } from "react";

// ════════════════════════════════════════════════════════════
// LedgerTable
// ════════════════════════════════════════════════════════════
// A read-only variant of DataTable's visual language, for report
// ledgers that have no row actions (edit/delete). DataTable always
// renders an actions column, so it isn't a fit here — this keeps
// the same wrapper/skeleton/empty-state look without faking
// onEdit/onDelete handlers.
//
// Usage:
//   <LedgerTable
//     items={absences}
//     getKey={(item) => item.absenceId}
//     columns={[{ id: "date", label: "التاريخ", renderCell: (item) => ... }]}
//     emptyIcon={<CalendarDays size={24} />}
//     emptyTitle="لا يوجد غياب مسجل"
//     emptySubtitle="..."
//   />
// ════════════════════════════════════════════════════════════

const STYLES = {
  wrapper:
    "w-full overflow-auto bg-white border border-neutral-200/80 rounded-2xl",
  table: "w-full text-sm border-collapse",
  column: [
    "sticky top-0 z-10 bg-neutral-50 border-b border-neutral-200/80",
    "px-4 py-3 text-xs font-semibold text-neutral-500 text-start whitespace-nowrap",
  ].join(" "),
  row: "border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/80 transition-colors duration-150",
  cell: "px-4 py-3 text-sm text-neutral-800 whitespace-nowrap",
  cellPrimary:
    "px-4 py-3 text-sm font-medium text-neutral-900 whitespace-nowrap",

  emptyWrap:
    "flex flex-col items-center justify-center gap-2.5 py-16 text-center px-4",
  emptyIcon:
    "flex items-center justify-center w-14 h-14 rounded-3xl bg-neutral-100 text-neutral-400",
  emptyTitle: "text-sm font-medium text-neutral-900 mt-1",
  emptySubtitle: "text-xs text-neutral-400 leading-relaxed max-w-xs",
};

export interface LedgerColumn<T> {
  id: string;
  label: string;
  renderCell: (item: T) => ReactNode;
  isPrimary?: boolean;
}

interface LedgerTableProps<T> {
  items: T[];
  getKey: (item: T) => string | number;
  columns: LedgerColumn<T>[];
  emptyIcon: ReactNode;
  emptyTitle: string;
  emptySubtitle: string;
  "aria-label": string;
}

export function LedgerTable<T>({
  items,
  getKey,
  columns,
  emptyIcon,
  emptyTitle,
  emptySubtitle,
  "aria-label": ariaLabel,
}: LedgerTableProps<T>) {
  if (items.length === 0) {
    return (
      <div className={STYLES.wrapper}>
        <div className={STYLES.emptyWrap}>
          <div className={STYLES.emptyIcon}>{emptyIcon}</div>
          <p className={STYLES.emptyTitle}>{emptyTitle}</p>
          <p className={STYLES.emptySubtitle}>{emptySubtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={STYLES.wrapper}>
      <table className={STYLES.table} aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.id} scope="col" className={STYLES.column}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={getKey(item)} className={STYLES.row}>
              {columns.map((col) => (
                <td
                  key={col.id}
                  className={col.isPrimary ? STYLES.cellPrimary : STYLES.cell}
                >
                  {col.renderCell(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
