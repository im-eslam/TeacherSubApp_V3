import { X } from "lucide-react";
import {
  EntityErrorBanner,
  EntityPageHeader,
  EntityToolbar,
} from "../components/layout/EntityPageLayout";
import { Button } from "../components/controls/Button";
import { SearchInput } from "../components/controls/SearchInput";
import { SortToggle } from "../components/controls/SortToggle";
import { useSubjectsPage } from "../features/subjects/hooks";
import { SubjectGrid } from "../features/subjects/components/SubjectGrid";
import {
  SubjectCreateModal,
  SubjectDeleteModal,
  SubjectEditModal,
} from "../features/subjects/components/SubjectModals";

export default function SubjectsPage() {
  const page = useSubjectsPage();
  const { filters, grid, modals, mutations } = page;

  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <EntityPageHeader
        title="المواد الدراسية"
        description="تُربط المواد بالمعلمين لتحديد تخصصاتهم في الجدول. وتعتمد عليها خوارزمية الاستبدال بشكل مباشر لمنح الأولوية لمعلمي نفس المادة عند ترشيح البديل الأنسب."
        addLabel="إضافة مادة"
        onAdd={modals.openCreate}
        isDisabled={page.isBlocked}
      />
      {page.isError && (
        <EntityErrorBanner
          error={page.error}
          onRetry={page.retry}
          isRetrying={page.isDisabled}
        />
      )}
      <EntityToolbar>
        <SearchInput
          value={filters.query}
          onChange={filters.onQueryChange}
          placeholder="بحث عن مادة..."
          isDisabled={filters.isDisabled}
        />
        <SortToggle
          sortOrder={filters.sortOrder}
          onSortToggle={filters.onSortToggle}
          isDisabled={filters.isDisabled}
          sortAscLabel="أ ← ي"
          sortDescLabel="ي ← أ"
        />
        {filters.hasFilters && (
          <Button
            variant="quiet"
            onPress={filters.onClear}
            isDisabled={filters.isDisabled}
          >
            <X size={16} strokeWidth={2.5} />
            إلغاء التصفية
          </Button>
        )}
      </EntityToolbar>
      <SubjectGrid {...grid} />
      {modals.createOpen && (
        <SubjectCreateModal
          isOpen={modals.createOpen}
          onClose={modals.closeCreate}
          onSubmit={mutations.create}
        />
      )}
      {modals.editOpen && modals.selectedSubject && (
        <SubjectEditModal
          isOpen={modals.editOpen}
          subject={modals.selectedSubject}
          onClose={modals.closeEdit}
          onSubmit={mutations.update}
        />
      )}
      {modals.deleteOpen && modals.selectedSubject && (
        <SubjectDeleteModal
          isOpen={modals.deleteOpen}
          subject={modals.selectedSubject}
          onClose={modals.closeDelete}
          onSubmit={mutations.remove}
        />
      )}
    </div>
  );
}
