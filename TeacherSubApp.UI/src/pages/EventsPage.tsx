import { X } from "lucide-react";
import {
  EntityErrorBanner,
  EntityPageHeader,
  EntityToolbar,
} from "../components/layout/EntityPageLayout";
import { Button } from "../components/controls/Button";
import { SearchInput } from "../components/controls/SearchInput";
import { SortToggle } from "../components/controls/SortToggle";
import { useEventsPage } from "../features/events/hooks";
import { EventKeyGrid } from "../features/events/components/EventGrid";
import {
  EventKeyCreateModal,
  EventKeyDeleteModal,
  EventKeyEditModal,
} from "../features/events/components/EventModals";

export default function EventKeysPage() {
  const page = useEventsPage();
  const { filters, grid, modals, mutations } = page;

  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <EntityPageHeader
        title="الأحداث"
        description="تمثل الحصص غير الدراسية كالاجتماعات. يمكن تخصيص حدث كـ«دعم» لدخول معلمَين معاً للحصة، أو كـ«احتياطي» لمنح صاحبه الأولوية عند اختياره كبديل لتغطية الغياب."
        addLabel="إضافة حدث"
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
          placeholder="بحث عن حدث..."
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
      <EventKeyGrid {...grid} />
      {modals.createOpen && (
        <EventKeyCreateModal
          isOpen={modals.createOpen}
          onClose={modals.closeCreate}
          onSubmit={mutations.create}
        />
      )}
      {modals.editOpen && modals.selectedEventKey && (
        <EventKeyEditModal
          isOpen={modals.editOpen}
          eventKey={modals.selectedEventKey}
          onClose={modals.closeEdit}
          onSubmit={mutations.update}
        />
      )}
      {modals.deleteOpen && modals.selectedEventKey && (
        <EventKeyDeleteModal
          isOpen={modals.deleteOpen}
          eventKey={modals.selectedEventKey}
          onClose={modals.closeDelete}
          onSubmit={mutations.remove}
        />
      )}
    </div>
  );
}
