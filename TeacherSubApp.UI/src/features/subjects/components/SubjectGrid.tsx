import { memo, useMemo } from "react";
import { BookOpen } from "lucide-react";
import {
  EntityGrid,
  type GridConfig,
} from "../../../components/orgnization/EntityGrid";
import type { SubjectReadDto } from "../types";

const STYLES = {
  icon: "shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600",
  name: "text-sm font-semibold text-neutral-900 truncate",
};

// ── Configuration ──

const SUBJECT_CONFIG: GridConfig<SubjectReadDto> = {
  getKey: (subject) => subject.id,
  getTextValue: (subject) => subject.name,
  skeletonHeight: "h-[60px]",
  emptyState: {
    icon: <BookOpen size={28} strokeWidth={1.5} />,
    title: "لم تُضف أي مادة بعد",
    titleFiltered: (query) => `لا توجد نتائج مطابقة لـ "${query}"`,
    subtitle:
      "أضف موادك الدراسية لتتمكن من ربطها بالمعلمين وحساب البدلاء تلقائياً",
    subtitleFiltered: "جرّب كلمة بحث أخرى أو امسح الفلتر",
    addFirst: "إضافة أول مادة",
  },
  errorState: {
    title: "تعذّر تحميل المواد الدراسية",
    subtitle: "تحقق من اتصالك بالإنترنت أو حاول مرة أخرى.",
  },
  renderItem: (subject) => (
    <>
      <div className={STYLES.icon}>
        <BookOpen size={18} strokeWidth={2} />
      </div>
      <span className={STYLES.name}>{subject.name}</span>
    </>
  ),
};

// ════════════════════════════════════════════════════════════
// SubjectGrid
// ════════════════════════════════════════════════════════════

interface SubjectGridProps {
  subjects: SubjectReadDto[];
  isLoading: boolean;
  isAwaitingData?: boolean;
  isError: boolean;
  searchQuery: string;
  onEdit: (subject: SubjectReadDto) => void;
  onDelete: (subject: SubjectReadDto) => void;
  onAdd: () => void;
}

export const SubjectGrid = memo(function SubjectGrid(props: SubjectGridProps) {
  const data = useMemo(
    () => ({
      items: props.subjects,
      isLoading: props.isLoading,
      isAwaitingData: props.isAwaitingData,
      isError: props.isError,
      searchQuery: props.searchQuery,
    }),
    [
      props.subjects,
      props.isLoading,
      props.isAwaitingData,
      props.isError,
      props.searchQuery,
    ],
  );

  const actions = useMemo(
    () => ({
      onAdd: props.onAdd,
      onEdit: props.onEdit,
      onDelete: props.onDelete,
    }),
    [props.onAdd, props.onEdit, props.onDelete],
  );

  return (
    <EntityGrid<SubjectReadDto>
      aria-label="المواد الدراسية"
      config={SUBJECT_CONFIG}
      data={data}
      actions={actions}
    />
  );
});

SubjectGrid.displayName = "SubjectGrid";