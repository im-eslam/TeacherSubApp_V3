import {
  EntityErrorBanner,
  EntityPageHeader,
  EntityToolbar,
} from "../components/layout/EntityPageLayout";
import { ScheduleToolbar } from "../features/schedules/components/ScheduleToolbar";
import { ScheduleGrid } from "../features/schedules/components/ScheduleGrid";
import { BulkEditModal } from "../features/schedules/components/wizard/BulkEditModal";
import { useSchedulesPage } from "../features/schedules/hooks";
import { useScheduleDraftStore } from "../features/schedules/draftStore";

export default function SchedulesPage() {
  const page = useSchedulesPage();
  const { isOpen, open, close } = useScheduleDraftStore();

  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <EntityPageHeader
        title="الجدول الأسبوعي"
        description="استعرض الجدول الأسبوعي لكل معلم أو فصل دراسي، أو استخدم المحرر المركزي لإجراء تعديلات جماعية (إضافة، تعديل، تبديل، حذف) في دفعة واحدة."
        addLabel="تعديل"
        onAdd={open}
        isDisabled={page.isError}
      />

      {page.isError && (
        <EntityErrorBanner
          error={page.error}
          onRetry={page.retry}
          isRetrying={page.isRetrying}
        />
      )}

      <EntityToolbar>
        <ScheduleToolbar
          viewMode={page.viewMode}
          onViewModeChange={page.onViewModeChange}
          selectedId={page.selectedId}
          onSelectedIdChange={page.onSelectedIdChange}
          options={page.selectorOptions}
          isDisabled={page.isSelectorLoading || page.isError}
        />
      </EntityToolbar>

      <ScheduleGrid
        slots={page.slots}
        viewMode={page.viewMode}
        isLoading={page.isLoading}
        isAwaitingData={page.isAwaitingData}
        isError={page.isError}
        hasSelection={page.hasSelection}
      />

      {isOpen && <BulkEditModal isOpen={isOpen} onClose={close} />}
    </div>
  );
}
