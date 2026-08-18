import { useState, useMemo } from "react";
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
import { SearchableSelect } from "../components/controls/SearchableSelect";
import { Select } from "../components/controls/Select";
import { Button } from "../components/controls/Button";
import {
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
} from "../features/teachers/hooks";
import { useSubjects } from "../features/subjects/hooks";
import { TeacherGrid } from "../features/teachers/components/TeacherTable";
import {
  TeacherCreateModal,
  TeacherEditModal,
  TeacherDeleteModal,
} from "../features/teachers/components/TeacherModals";
import type {
  TeacherReadDto,
  TeacherWriteDto,
} from "../features/teachers/types";

// ── Constants ──
const ALL_VALUE = "all";
const SUPERVISOR_VALUE = "supervisor";
const TEACHER_VALUE = "teacher";

const ROLE_OPTIONS = [
  { value: ALL_VALUE, label: "كل الأدوار" },
  { value: SUPERVISOR_VALUE, label: "مشرفون فقط" },
  { value: TEACHER_VALUE, label: "معلمون فقط" },
];

export default function TeachersPage() {
  // ── Data fetching — always the full list ──
  const {
    data: allTeachers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTeachers();
  const { data: subjects = [] } = useSubjects();
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const deleteMutation = useDeleteTeacher();

  // ── Toolbar state ──
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>(ALL_VALUE);
  const [roleFilter, setRoleFilter] = useState<string>(ALL_VALUE);

  // ── Sort state ──
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });

  // ── Modal state ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherReadDto | null>(
    null,
  );

  // ── All filter + sort in one memo — instant, no network ──
  const displayedTeachers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const key = sortDescriptor.column as keyof TeacherReadDto;
    const multiplier = sortDescriptor.direction === "ascending" ? 1 : -1;

    return allTeachers
      .filter((t) => {
        if (q && !t.name.toLowerCase().includes(q)) return false;
        if (
          subjectFilter !== ALL_VALUE &&
          String(t.subjectId) !== subjectFilter
        )
          return false;
        if (roleFilter === SUPERVISOR_VALUE && !t.isSupervisor) return false;
        if (roleFilter === TEACHER_VALUE && t.isSupervisor) return false;
        return true;
      })
      .sort((a, b) => {
        if (key === "isSupervisor") {
          return (
            ((a.isSupervisor ? 1 : 0) - (b.isSupervisor ? 1 : 0)) * multiplier
          );
        }
        const valA = a[key] ?? "";
        const valB = b[key] ?? "";
        if (typeof valA === "string" && typeof valB === "string") {
          return valA.localeCompare(valB, "ar") * multiplier;
        }
        return 0;
      });
  }, [allTeachers, query, subjectFilter, roleFilter, sortDescriptor]);

  // ── Derived filter options — built from the full list ──
  const subjectOptions = useMemo(
    () => [
      { value: ALL_VALUE, label: "كل المواد" },
      ...subjects.map((s) => ({ value: String(s.id), label: s.name })),
    ],
    [subjects],
  );

  const hasFilters =
    query.length > 0 || subjectFilter !== ALL_VALUE || roleFilter !== ALL_VALUE;

  // Only block on the very first load; after that data stays visible
  const showLoader = useDelayedLoading(isLoading, 200);
  const isAwaitingData = isLoading && allTeachers.length === 0;

  // ── Handlers ──
  const handleCreateSubmit = async (data: TeacherWriteDto) => {
    await createMutation.mutateAsync(data);
    toast.success("تمت إضافة المعلم بنجاح");
  };

  const handleEditSubmit = async (id: number, data: TeacherWriteDto) => {
    await updateMutation.mutateAsync({ id, dto: data });
    toast.success("تم حفظ التعديلات");
  };

  const handleDeleteSubmit = async (id: number) => {
    await deleteMutation.mutateAsync(id);
    toast.success("تم حذف المعلم");
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
        title="المعلمون"
        description="يشكلون أساس الجدول الأسبوعي. تعتمد خوارزمية الاستبدال على بياناتهم، كالمادة المسندة وحالة الإشراف، كمعايير دقيقة لاختيار المعلم الأنسب لتغطية الحصص الشاغرة."
        addLabel="إضافة معلم"
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
          placeholder="بحث عن معلم..."
          isDisabled={isLoading}
        />

        {/* Subject — searchable because the list can grow long */}
        <div className="w-[180px]">
          <SearchableSelect
            isFilter
            value={subjectFilter}
            onChange={setSubjectFilter}
            options={subjectOptions}
            placeholder="كل المواد"
            disabled={isLoading}
          />
        </div>

        {/* Role — plain select; only 3 fixed options */}
        <div className="w-[160px]">
          <Select
            isFilter
            value={roleFilter}
            onChange={setRoleFilter}
            options={ROLE_OPTIONS}
            placeholder="كل الأدوار"
            disabled={isLoading}
          />
        </div>

        {hasFilters && (
          <Button
            variant="quiet"
            onPress={() => {
              setQuery("");
              setSubjectFilter(ALL_VALUE);
              setRoleFilter(ALL_VALUE);
            }}
            isDisabled={isLoading}
          >
            <X size={16} strokeWidth={2.5} />
            إلغاء التصفية
          </Button>
        )}
      </EntityToolbar>

      <TeacherGrid
        teachers={displayedTeachers}
        isLoading={showLoader}
        isAwaitingData={isAwaitingData}
        isError={isError}
        searchQuery={query}
        isFiltered={subjectFilter !== ALL_VALUE || roleFilter !== ALL_VALUE}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        onAdd={() => setCreateOpen(true)}
        onEdit={(teacher) => {
          setSelectedTeacher(teacher);
          setEditOpen(true);
        }}
        onDelete={(teacher) => {
          setSelectedTeacher(teacher);
          setDeleteOpen(true);
        }}
      />

      {createOpen && (
        <TeacherCreateModal
          isOpen={createOpen}
          subjects={subjects}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      {editOpen && selectedTeacher && (
        <TeacherEditModal
          isOpen={editOpen}
          teacher={selectedTeacher}
          subjects={subjects}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEditSubmit}
        />
      )}

      {deleteOpen && selectedTeacher && (
        <TeacherDeleteModal
          isOpen={deleteOpen}
          teacher={selectedTeacher}
          onClose={() => setDeleteOpen(false)}
          onSubmit={handleDeleteSubmit}
        />
      )}
    </div>
  );
}
