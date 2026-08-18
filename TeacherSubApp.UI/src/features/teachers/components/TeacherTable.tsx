import { Users, ShieldAlert } from "lucide-react";
import type { SortDescriptor } from "react-aria-components/Table";
import {
  DataTable,
  type DataTableColumn,
  type DataTableConfig,
} from "../../../components/orgnization/DataTable";
import type { TeacherReadDto } from "../types";
import { useMemo } from "react";

const STYLES = {
  badgeSupervisor:
    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100/50",
  badgeTeacher:
    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200/50",
  noSubject: "text-neutral-400",
};

// ── Columns ──

const TEACHER_COLUMNS: DataTableColumn<TeacherReadDto>[] = [
  {
    id: "name",
    label: "اسم المعلم",
    isPrimary: true,
    allowsSorting: true,
    renderCell: (teacher) => teacher.name,
  },
  {
    id: "subjectName",
    label: "المادة الدراسية",
    allowsSorting: true,
    renderCell: (teacher) =>
      teacher.subjectName ?? (
        <span className={STYLES.noSubject}>— غير محدد —</span>
      ),
  },
  {
    id: "isSupervisor",
    label: "الدور",
    allowsSorting: true,
    renderCell: (teacher) =>
      teacher.isSupervisor ? (
        <span className={STYLES.badgeSupervisor}>
          <ShieldAlert size={12} strokeWidth={2.5} />
          مشرف مادة
        </span>
      ) : (
        <span className={STYLES.badgeTeacher}>
          <Users size={12} strokeWidth={2} />
          معلم
        </span>
      ),
  },
];

// ── Configuration ──

const TEACHER_CONFIG: DataTableConfig<TeacherReadDto> = {
  getKey: (teacher) => teacher.id,
  columns: TEACHER_COLUMNS,
  actionsColumnLabel: "الإجراءات",
  emptyState: {
    icon: <Users size={28} strokeWidth={1.5} />,
    title: "لا يوجد معلمون بعد",
    titleFiltered: (query) => `لا توجد نتائج مطابقة لـ "${query}"`,
    subtitle: "ابدأ بإضافة معلم جديد",
    subtitleFiltered: "جرّب تغيير كلمة البحث أو عوامل التصفية",
    addFirst: "إضافة أول معلم",
  },
  errorState: {
    title: "تعذّر تحميل المعلمين",
    subtitle: "تحقق من اتصالك بالإنترنت أو حاول مرة أخرى.",
  },
};

// ════════════════════════════════════════════════════════════
// TeacherGrid
// ════════════════════════════════════════════════════════════

interface TeacherGridProps {
  teachers: TeacherReadDto[];
  isLoading: boolean;
  isAwaitingData?: boolean;
  isError: boolean;
  searchQuery: string;
  isFiltered?: boolean;
  sortDescriptor: SortDescriptor;
  onSortChange: (descriptor: SortDescriptor) => void;
  onEdit: (teacher: TeacherReadDto) => void;
  onDelete: (teacher: TeacherReadDto) => void;
  onAdd: () => void;
}

export function TeacherGrid(props: TeacherGridProps) {
  const tableData = useMemo(
    () => ({
      items: props.teachers,
      isLoading: props.isLoading,
      isAwaitingData: props.isAwaitingData,
      isError: props.isError,
      searchQuery: props.searchQuery,
      isFiltered: props.isFiltered,
    }),
    [
      props.teachers,
      props.isLoading,
      props.isAwaitingData,
      props.isError,
      props.searchQuery,
      props.isFiltered,
    ],
  );

  const tableActions = useMemo(
    () => ({
      onAdd: props.onAdd,
      onEdit: props.onEdit,
      onDelete: props.onDelete,
    }),
    [props.onAdd, props.onEdit, props.onDelete],
  );

  return (
    <DataTable<TeacherReadDto>
      aria-label="المعلمون"
      config={TEACHER_CONFIG}
      data={tableData}
      actions={tableActions}
      sortDescriptor={props.sortDescriptor}
      onSortChange={props.onSortChange}
    />
  );
}
