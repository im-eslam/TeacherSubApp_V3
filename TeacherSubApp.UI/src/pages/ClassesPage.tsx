import { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { X } from "lucide-react";
import type { SortDescriptor } from "react-aria-components/Table";
import { useDelayedLoading } from "../lib/useDelayedLoading";
import {
  EntityPageHeader,
  EntityErrorBanner,
  EntityToolbar,
} from "../components/layout/EntityPageLayout";
import { SearchInput } from "../components/controls/SearchInput";
import { Select } from "../components/controls/Select";
import { Button } from "../components/controls/Button";
import {
  useSchoolClasses,
  useGrades,
  useSectionsForGrade,
  useCreateSchoolClass,
  useUpdateSchoolClass,
  useDeleteSchoolClass,
} from "../features/classes/hooks";
import { SchoolClassGrid } from "../features/classes/components/ClassTable";
import {
  SchoolClassCreateModal,
  SchoolClassEditModal,
  SchoolClassDeleteModal,
} from "../features/classes/components/ClassModals";
import type {
  SchoolClassReadDto,
  SchoolClassWriteDto,
} from "../features/classes/types";

const ALL_VALUE = "all";

export default function SchoolClassesPage() {
  // ── Data fetching — always the full list ──
  const {
    data: allClasses = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSchoolClasses();
  const { data: grades = [], isLoading: isGradesLoading } = useGrades();
  const [gradeFilter, setGradeFilter] = useState<string>(ALL_VALUE);
  const [sectionFilter, setSectionFilter] = useState<string>(ALL_VALUE);
  const selectedGrade = gradeFilter === ALL_VALUE ? null : Number(gradeFilter);
  const { data: sections = [], isLoading: isSectionsLoading } =
    useSectionsForGrade(selectedGrade);

  const createMutation = useCreateSchoolClass();
  const updateMutation = useUpdateSchoolClass();
  const deleteMutation = useDeleteSchoolClass();

  // ── Toolbar state ──
  const [query, setQuery] = useState("");

  // ── Sort state ──
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "displayName",
    direction: "ascending",
  });

  // ── Modal state ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SchoolClassReadDto | null>(
    null,
  );

  // ── Dropdown options — loaded from the backend ──
  const gradeOptions = [
    { value: ALL_VALUE, label: "كل الصفوف" },
    ...grades.map((grade) => ({
      value: String(grade),
      label: `الصف ${grade}`,
    })),
  ];

  const sectionOptions = [
    { value: ALL_VALUE, label: "كل الشعب" },
    ...sections.map((section) => ({
      value: String(section),
      label: `الشعبة ${section}`,
    })),
  ];

  const handleGradeFilterChange = (value: string) => {
    setGradeFilter(value);
    setSectionFilter(ALL_VALUE);
  };

  // ── All filter + sort in one memo — instant, no network ──
  const displayedClasses = useMemo(() => {
    const q = query.trim().toLowerCase();
    const key = sortDescriptor.column as keyof SchoolClassReadDto;
    const multiplier = sortDescriptor.direction === "ascending" ? 1 : -1;

    return allClasses
      .filter((c) => {
        if (q && !c.displayName.toLowerCase().includes(q)) return false;
        if (gradeFilter !== ALL_VALUE && c.grade !== Number(gradeFilter))
          return false;
        if (sectionFilter !== ALL_VALUE && c.section !== Number(sectionFilter))
          return false;
        return true;
      })
      .sort((a, b) => {
        if (key === "displayName") {
          return a.displayName.localeCompare(b.displayName, "ar") * multiplier;
        }
        // grade / section: nulls sort last regardless of direction
        const valA = a[key];
        const valB = b[key];
        if (valA === null && valB === null) return 0;
        if (valA === null) return 1;
        if (valB === null) return -1;
        return (valA - valB) * multiplier;
      });
  }, [allClasses, query, gradeFilter, sectionFilter, sortDescriptor]);

  const hasFilters =
    query.length > 0 ||
    gradeFilter !== ALL_VALUE ||
    sectionFilter !== ALL_VALUE;

  const isSectionDisabled = gradeFilter === ALL_VALUE;

  // Only block on the very first load; after that data stays visible
  const showLoader = useDelayedLoading(isLoading, 200);
  const isAwaitingData = isLoading && allClasses.length === 0;

  // ── Handlers ──
  const handleCreateSubmit = async (data: SchoolClassWriteDto) => {
    await createMutation.mutateAsync(data);
    toast.success("تمت إضافة الفصل بنجاح");
  };

  const handleEditSubmit = async (id: number, data: SchoolClassWriteDto) => {
    await updateMutation.mutateAsync({ id, dto: data });
    toast.success("تم حفظ التعديلات");
  };

  const handleDeleteSubmit = async (id: number) => {
    await deleteMutation.mutateAsync(id);
    toast.success("تم حذف الفصل");
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      <Toaster
        position="top-center"
        toastOptions={{
          className: "font-medium text-sm",
          style: { direction: "rtl", borderRadius: "12px" },
        }}
      />

      <EntityPageHeader
        title="الفصول الدراسية"
        description="تُستخدم الفصول لربط الطلاب بالمعلمين في الجدول الأسبوعي. تعتمد عليها خوارزمية الاستبدال كمعيار رئيسي لمنع تضارب الحصص وتأمين التغطية الفورية للغياب."
        addLabel="إضافة فصل"
        onAdd={() => setCreateOpen(true)}
        isDisabled={isLoading}
      />

      {isError && (
        <EntityErrorBanner
          error={error}
          onRetry={refetch}
          isRetrying={isLoading}
        />
      )}

      <EntityToolbar>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="بحث عن فصل..."
          isDisabled={isLoading}
        />

        <div className="w-[160px]">
          <Select
            isFilter
            value={gradeFilter}
            onChange={handleGradeFilterChange}
            options={gradeOptions}
            placeholder="كل الصفوف"
            disabled={isLoading || isGradesLoading}
          />
        </div>

        <div className="w-[160px]">
          <Select
            isFilter
            value={sectionFilter}
            onChange={setSectionFilter}
            options={sectionOptions}
            placeholder="كل الشعب"
            disabled={isLoading || isSectionDisabled || isSectionsLoading}
          />
        </div>

        {hasFilters && (
          <Button
            variant="quiet"
            onPress={() => {
              setQuery("");
              setGradeFilter(ALL_VALUE);
              setSectionFilter(ALL_VALUE);
            }}
            isDisabled={isLoading}
          >
            <X size={16} strokeWidth={2.5} />
            إلغاء التصفية
          </Button>
        )}
      </EntityToolbar>

      <SchoolClassGrid
        classes={displayedClasses}
        isLoading={showLoader}
        isAwaitingData={isAwaitingData}
        isError={isError}
        searchQuery={query}
        isFiltered={gradeFilter !== ALL_VALUE || sectionFilter !== ALL_VALUE}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        onAdd={() => setCreateOpen(true)}
        onEdit={(schoolClass) => {
          setSelectedClass(schoolClass);
          setEditOpen(true);
        }}
        onDelete={(schoolClass) => {
          setSelectedClass(schoolClass);
          setDeleteOpen(true);
        }}
      />

      {createOpen && (
        <SchoolClassCreateModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      {editOpen && selectedClass && (
        <SchoolClassEditModal
          isOpen={editOpen}
          schoolClass={selectedClass}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEditSubmit}
        />
      )}

      {deleteOpen && selectedClass && (
        <SchoolClassDeleteModal
          isOpen={deleteOpen}
          schoolClass={selectedClass}
          onClose={() => setDeleteOpen(false)}
          onSubmit={handleDeleteSubmit}
        />
      )}
    </div>
  );
}
