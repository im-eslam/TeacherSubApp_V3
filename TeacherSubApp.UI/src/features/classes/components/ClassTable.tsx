import { GraduationCap } from "lucide-react";
import type { SortDescriptor } from "react-aria-components/Table";
import {
  DataTable,
  type DataTableColumn,
  type DataTableConfig,
} from "../../../components/orgnization/DataTable";
import type { SchoolClassReadDto } from "../types";

// ── Columns ──

const SCHOOL_CLASS_COLUMNS: DataTableColumn<SchoolClassReadDto>[] = [
  {
    id: "displayName",
    label: "اسم الفصل",
    isPrimary: true,
    allowsSorting: true,
    renderCell: (schoolClass) => schoolClass.displayName,
  },
  {
    id: "grade",
    label: "الصف",
    allowsSorting: true,
    renderCell: (schoolClass) =>
      schoolClass.grade !== null ? schoolClass.grade : "—",
  },
  {
    id: "section",
    label: "الشعبة",
    allowsSorting: true,
    renderCell: (schoolClass) =>
      schoolClass.section !== null ? schoolClass.section : "—",
  },
];

// ── Configuration ──

const SCHOOL_CLASS_CONFIG: DataTableConfig<SchoolClassReadDto> = {
  getKey: (schoolClass) => schoolClass.id,
  columns: SCHOOL_CLASS_COLUMNS,
  actionsColumnLabel: "الإجراءات",
  emptyState: {
    icon: <GraduationCap size={28} strokeWidth={1.5} />,
    title: "لا توجد فصول بعد",
    titleFiltered: (query) => `لا توجد نتائج مطابقة لـ "${query}"`,
    subtitle: "ابدأ بإضافة فصل جديد",
    subtitleFiltered: "جرّب تغيير كلمة البحث أو عوامل التصفية",
    addFirst: "إضافة أول فصل",
  },
  errorState: {
    title: "تعذّر تحميل الفصول",
    subtitle: "تحقق من اتصالك بالإنترنت أو حاول مرة أخرى.",
  },
};

// ════════════════════════════════════════════════════════════
// SchoolClassGrid
// ════════════════════════════════════════════════════════════

interface SchoolClassGridProps {
  classes: SchoolClassReadDto[];
  isLoading: boolean;
  isAwaitingData?: boolean;
  isError: boolean;
  searchQuery: string;
  isFiltered?: boolean;
  sortDescriptor: SortDescriptor;
  onSortChange: (descriptor: SortDescriptor) => void;
  onEdit: (schoolClass: SchoolClassReadDto) => void;
  onDelete: (schoolClass: SchoolClassReadDto) => void;
  onAdd: () => void;
}

export function SchoolClassGrid(props: SchoolClassGridProps) {
  return (
    <DataTable<SchoolClassReadDto>
      aria-label="الفصول الدراسية"
      config={SCHOOL_CLASS_CONFIG}
      data={{
        items: props.classes,
        isLoading: props.isLoading,
        isAwaitingData: props.isAwaitingData,
        isError: props.isError,
        searchQuery: props.searchQuery,
        isFiltered: props.isFiltered,
      }}
      actions={{
        onAdd: props.onAdd,
        onEdit: props.onEdit,
        onDelete: props.onDelete,
      }}
      sortDescriptor={props.sortDescriptor}
      onSortChange={props.onSortChange}
    />
  );
}
