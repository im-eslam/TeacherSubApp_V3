import { X } from "lucide-react";
import {
  EntityErrorBanner,
  EntityPageHeader,
  EntityToolbar,
} from "../components/layout/EntityPageLayout";
import { Button } from "../components/controls/Button";
import { SearchInput } from "../components/controls/SearchInput";
import { SearchableSelect } from "../components/controls/SearchableSelect";
import { Select } from "../components/controls/Select";
import { useTeachersPage } from "../features/teachers/hooks";
import { TeacherGrid } from "../features/teachers/components/TeacherTable";
import {
  TeacherCreateModal,
  TeacherDeleteModal,
  TeacherEditModal,
} from "../features/teachers/components/TeacherModals";

export default function TeachersPage() {
  const page = useTeachersPage();
  const { filters, grid, modals, mutations } = page;

  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <EntityPageHeader
        title="المعلمون"
        description="يشكلون أساس الجدول الأسبوعي. تعتمد خوارزمية الاستبدال على بياناتهم، كالمادة المسندة وحالة الإشراف، كمعايير دقيقة لاختيار المعلم الأنسب لتغطية الحصص الشاغرة."
        addLabel="إضافة معلم"
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
          placeholder="بحث عن معلم..."
          isDisabled={filters.isDisabled}
        />
        <div className="w-[180px]">
          <SearchableSelect
            isFilter
            value={filters.subjectFilter}
            onChange={filters.onSubjectFilterChange}
            options={filters.subjectOptions}
            placeholder="كل المواد"
            disabled={filters.isDisabled}
          />
        </div>
        <div className="w-[160px]">
          <Select
            isFilter
            value={filters.roleFilter}
            onChange={filters.onRoleFilterChange}
            options={filters.roleOptions}
            placeholder="كل الأدوار"
            disabled={filters.isDisabled}
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

      <TeacherGrid {...grid} />

      {modals.createOpen && (
        <TeacherCreateModal
          isOpen={modals.createOpen}
          subjects={page.subjects}
          onClose={modals.closeCreate}
          onSubmit={mutations.create}
        />
      )}
      {modals.editOpen && modals.selectedTeacher && (
        <TeacherEditModal
          isOpen={modals.editOpen}
          teacher={modals.selectedTeacher}
          subjects={page.subjects}
          onClose={modals.closeEdit}
          onSubmit={mutations.update}
        />
      )}
      {modals.deleteOpen && modals.selectedTeacher && (
        <TeacherDeleteModal
          isOpen={modals.deleteOpen}
          teacher={modals.selectedTeacher}
          onClose={modals.closeDelete}
          onSubmit={mutations.remove}
        />
      )}
    </div>
  );
}
