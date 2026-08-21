import { X } from "lucide-react";
import {
  EntityErrorBanner,
  EntityPageHeader,
  EntityToolbar,
} from "../components/layout/EntityPageLayout";
import { Button } from "../components/controls/Button";
import { SearchInput } from "../components/controls/SearchInput";
import { Select } from "../components/controls/Select";
import { useClassesPage } from "../features/classes/hooks";
import { SchoolClassGrid } from "../features/classes/components/ClassTable";
import {
  SchoolClassCreateModal,
  SchoolClassDeleteModal,
  SchoolClassEditModal,
} from "../features/classes/components/ClassModals";

export default function SchoolClassesPage() {
  const page = useClassesPage();
  const { filters, grid, modals, mutations } = page;

  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <EntityPageHeader
        title="الفصول الدراسية"
        description="تُستخدم الفصول لربط الطلاب بالمعلمين في الجدول الأسبوعي. تعتمد عليها خوارزمية الاستبدال كمعيار رئيسي لمنع تضارب الحصص وتأمين التغطية الفورية للغياب."
        addLabel="إضافة فصل"
        onAdd={modals.openCreate}
        isDisabled={page.isDisabled}
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
          placeholder="بحث عن فصل..."
          isDisabled={filters.isDisabled}
        />
        <div className="w-[160px]">
          <Select
            isFilter
            value={filters.gradeFilter}
            onChange={filters.onGradeFilterChange}
            options={filters.gradeOptions}
            placeholder="كل الصفوف"
            disabled={filters.isDisabled || filters.isGradesLoading}
          />
        </div>
        <div className="w-[160px]">
          <Select
            isFilter
            value={filters.sectionFilter}
            onChange={filters.onSectionFilterChange}
            options={filters.sectionOptions}
            placeholder="كل الشعب"
            disabled={
              filters.isDisabled ||
              filters.isSectionDisabled ||
              filters.isSectionsLoading
            }
          />
        </div>
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
      <SchoolClassGrid {...grid} />
      {modals.createOpen && (
        <SchoolClassCreateModal
          isOpen={modals.createOpen}
          onClose={modals.closeCreate}
          onSubmit={mutations.create}
        />
      )}
      {modals.editOpen && modals.selectedClass && (
        <SchoolClassEditModal
          isOpen={modals.editOpen}
          schoolClass={modals.selectedClass}
          onClose={modals.closeEdit}
          onSubmit={mutations.update}
        />
      )}
      {modals.deleteOpen && modals.selectedClass && (
        <SchoolClassDeleteModal
          isOpen={modals.deleteOpen}
          schoolClass={modals.selectedClass}
          onClose={modals.closeDelete}
          onSubmit={mutations.remove}
        />
      )}
    </div>
  );
}
