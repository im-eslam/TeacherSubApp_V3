import { useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { X } from "lucide-react";
import { useDelayedLoading } from "../lib/useDelayedLoading";
import {
  EntityPageHeader,
  EntityErrorBanner,
  EntityToolbar,
} from "../components/layout/EntityPageLayout";
import { SearchInput } from "../components/controls/SearchInput";
import { SortToggle, type SortOrder } from "../components/controls/SortToggle";
import { Button } from "../components/controls/Button";
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from "../features/subjects/hooks";
import { SubjectGrid } from "../features/subjects/components/SubjectGrid";
import {
  SubjectCreateModal,
  SubjectEditModal,
  SubjectDeleteModal,
} from "../features/subjects/components/SubjectModals";
import type {
  SubjectReadDto,
  SubjectWriteDto,
} from "../features/subjects/types";
import { useDebouncedValue } from "../lib/useDebouncedValue";

export default function SubjectsPage() {
  // ── Data fetching ──
  const {
    data: subjects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSubjects();
  const createMutation = useCreateSubject();
  const updateMutation = useUpdateSubject();
  const deleteMutation = useDeleteSubject();

  // ── Modal state ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectReadDto | null>(
    null,
  );

  // ── Toolbar state ──
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // ── Derived data ──
  const displayedSubjects = useMemo(() => {
    const filtered = debouncedQuery.trim()
      ? subjects.filter((s) =>
          s.name.toLowerCase().includes(debouncedQuery.trim().toLowerCase()),
        )
      : [...subjects];

    return filtered.sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name, "ar")
        : b.name.localeCompare(a.name, "ar"),
    );
  }, [subjects, debouncedQuery, sortOrder]);

  const hasFilters = query.length > 0 || sortOrder !== "asc";
  const showLoader = useDelayedLoading(isLoading, 200);
  const isAwaitingData = isLoading && subjects.length === 0;

  const isDisabled = isLoading;

  // ── Handlers ──
  const handleCreateSubmit = async (data: SubjectWriteDto) => {
    await createMutation.mutateAsync(data);
    toast.success("تمت إضافة المادة بنجاح");
  };

  const handleEditSubmit = async (id: number, data: SubjectWriteDto) => {
    await updateMutation.mutateAsync({ id, dto: data });
    toast.success("تم حفظ التعديلات");
  };

  const handleDeleteSubmit = async (id: number) => {
    await deleteMutation.mutateAsync(id);
    toast.success("تم حذف المادة");
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      <Toaster
        position="top-center"
        toastOptions={{
          className: "font-medium text-sm",
          style: { direction: "rtl", borderRadius: "99px" },
        }}
      />

      <EntityPageHeader
        title="المواد الدراسية"
        description="تُربط المواد بالمعلمين لتحديد تخصصاتهم في الجدول. وتعتمد عليها خوارزمية الاستبدال بشكل مباشر لمنح الأولوية لمعلمي نفس المادة عند ترشيح البديل الأنسب."
        addLabel="إضافة مادة"
        onAdd={() => {
          setCreateOpen(true);
        }}
        isDisabled={isDisabled}
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
          placeholder="بحث عن مادة..."
          isDisabled={isDisabled}
        />

        <SortToggle
          sortOrder={sortOrder}
          onSortToggle={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
          isDisabled={isDisabled}
          sortAscLabel="أ ← ي"
          sortDescLabel="ي ← أ"
        />

        {hasFilters && (
          <Button
            variant="quiet"
            onPress={() => {
              setQuery("");
              setSortOrder("asc");
            }}
            isDisabled={isDisabled}
          >
            <X size={16} strokeWidth={2.5} />
            إلغاء التصفية
          </Button>
        )}
      </EntityToolbar>

      <SubjectGrid
        subjects={displayedSubjects}
        isLoading={showLoader}
        isAwaitingData={isAwaitingData}
        isError={isError}
        searchQuery={debouncedQuery}
        onAdd={() => {
          setCreateOpen(true);
        }}
        onEdit={(subject) => {
          setSelectedSubject(subject);
          setEditOpen(true);
        }}
        onDelete={(subject) => {
          setSelectedSubject(subject);
          setDeleteOpen(true);
        }}
      />

      {createOpen && (
        <SubjectCreateModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      {editOpen && selectedSubject && (
        <SubjectEditModal
          isOpen={editOpen}
          subject={selectedSubject}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEditSubmit}
        />
      )}

      {deleteOpen && selectedSubject && (
        <SubjectDeleteModal
          isOpen={deleteOpen}
          subject={selectedSubject}
          onClose={() => setDeleteOpen(false)}
          onSubmit={handleDeleteSubmit}
        />
      )}
    </div>
  );
}
