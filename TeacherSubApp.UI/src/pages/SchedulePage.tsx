import { useState } from "react";
import { CalendarDays, CalendarRange, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { useDelayedLoading } from "../lib/useDelayedLoading";
import {
  EntityErrorBanner,
  EntityToolbar,
} from "../components/layout/EntityPageLayout";
import { Button } from "../components/controls/Button";
import { SearchableSelect } from "../components/controls/SearchableSelect";
import { SegmentedToggle } from "../components/controls/SegmentedToggle";
import {
  ScheduleGrid,
  type ScheduleGridViewMode,
} from "../features/schedules/components/ScheduleGrid";
import { ScheduleEditWorkspace } from "../features/schedules/components/ScheduleEditWorkspace";
import { useSchedulePage } from "../features/schedules/hooks";
import type { WeeklyScheduleBulkEditRequest } from "../features/schedules/types";

const VIEW_MODE_OPTIONS = [
  { value: "teacher", label: "عرض المعلم" },
  { value: "class", label: "عرض الفصل" },
];

export default function SchedulePage() {
  const viewModel = useSchedulePage();
  const [editorOpen, setEditorOpen] = useState(false);
  const showLoader = useDelayedLoading(viewModel.isLoading, 200);

  const handleCloseEditor = () => setEditorOpen(false);

  const handleSubmit = async (request: WeeklyScheduleBulkEditRequest) => {
    await viewModel.bulkEdit.mutateAsync(request);
    toast.success("تم حفظ تغييرات الجدول بنجاح");
  };

  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            الجدول الأسبوعي
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-500">
            اعرض جدول أي معلم أو فصل عبر أيام الأسبوع والحصص السبع. استخدم محرر
            التعديلات المركزي لتحضير عدة تغييرات ثم حفظها دفعة واحدة.
          </p>
        </div>
        <Button
          variant="primary"
          onPress={() => setEditorOpen(true)}
          isDisabled={viewModel.bulkEdit.isPending}
        >
          <Pencil size={16} strokeWidth={2.5} />
          تعديل الجدول
        </Button>
      </div>

      {viewModel.isError && (
        <EntityErrorBanner
          error={viewModel.error}
          onRetry={viewModel.retry}
          isRetrying={viewModel.isLoading}
        />
      )}

      <EntityToolbar>
        <SegmentedToggle
          value={viewModel.viewMode}
          onChange={(value) =>
            viewModel.onViewModeChange(value as ScheduleGridViewMode)
          }
          options={VIEW_MODE_OPTIONS}
        />
        <div className="w-[300px]">
          <SearchableSelect
            value={viewModel.selectedId}
            onChange={viewModel.onSelectedIdChange}
            options={viewModel.selectionOptions}
            placeholder={
              viewModel.viewMode === "teacher"
                ? "اختر معلماً لعرض جدوله"
                : "اختر فصلاً لعرض جدوله"
            }
          />
        </div>
      </EntityToolbar>

      {viewModel.selectedId ? (
        <ScheduleGrid
          slots={viewModel.selectedSlots}
          viewMode={viewModel.viewMode}
          isLoading={showLoader}
        />
      ) : (
        <ScheduleGridEmptyPrompt viewMode={viewModel.viewMode} />
      )}

      {editorOpen && (
        <ScheduleEditWorkspace
          isOpen={editorOpen}
          baseSlots={viewModel.allSlots}
          teachers={viewModel.teachers}
          classes={viewModel.classes}
          events={viewModel.events}
          isLoading={viewModel.isAllSlotsLoading}
          onClose={handleCloseEditor}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function ScheduleGridEmptyPrompt({
  viewMode,
}: {
  viewMode: ScheduleGridViewMode;
}) {
  const Icon = viewMode === "teacher" ? CalendarDays : CalendarRange;
  const message =
    viewMode === "teacher"
      ? "اختر معلماً لعرض جدوله الأسبوعي الكامل"
      : "اختر فصلاً لعرض جدوله الأسبوعي";

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-200/80 bg-white px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-100 text-neutral-400">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <p className="mt-1 text-sm font-medium text-neutral-900">{message}</p>
      <p className="max-w-xs text-xs leading-relaxed text-neutral-400">
        استخدم القائمة أعلاه لتحديد معلم أو فصل والبدء بعرض الجدول.
      </p>
    </div>
  );
}
