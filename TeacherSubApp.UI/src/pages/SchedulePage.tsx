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
import { ScheduleEditorModal } from "../features/schedules/components/ScheduleEditorModal";
import { useSchedulePage } from "../features/schedules/hooks";
import type {
  SlotCoordinate,
  WeeklyScheduleBulkEditRequest,
  WeeklyScheduleReadDto,
} from "../features/schedules/types";

type EditorTarget = {
  coordinate: SlotCoordinate;
  slot: WeeklyScheduleReadDto | null;
} | null;

const VIEW_MODE_OPTIONS = [
  { value: "teacher", label: "عرض المعلم" },
  { value: "class", label: "عرض الفصل" },
];

export default function SchedulePage() {
  const viewModel = useSchedulePage();
  const [editorTarget, setEditorTarget] = useState<EditorTarget>(null);
  const showLoader = useDelayedLoading(viewModel.isLoading, 200);

  const handleCellPress = (
    coordinate: SlotCoordinate,
    slot: WeeklyScheduleReadDto | null,
  ) => {
    setEditorTarget({ coordinate, slot });
    viewModel.openEditor();
  };

  const handleCloseEditor = () => {
    setEditorTarget(null);
    viewModel.closeEditor();
  };

  const handleSubmit = async (request: WeeklyScheduleBulkEditRequest) => {
    await viewModel.bulkEdit.mutateAsync(request);
    toast.success("تم حفظ تغييرات الجدول بنجاح");
  };

  const selectedLabel =
    viewModel.viewMode === "teacher"
      ? "اختر معلماً لعرض جدوله"
      : "اختر فصلاً لعرض جدوله";

  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            الجدول الأسبوعي
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-500">
            اعرض جدول أي معلم أو فصل عبر أيام الأسبوع والحصص السبع، ثم أضف أو
            عدّل أو احذف التعيينات من خلال محرر الجدول.
          </p>
        </div>
        <Button
          variant="primary"
          onPress={() => {
            setEditorTarget(null);
            viewModel.openEditor();
          }}
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
            placeholder={selectedLabel}
          />
        </div>
      </EntityToolbar>

      {viewModel.selectedId ? (
        <ScheduleGrid
          slots={viewModel.selectedSlots}
          viewMode={viewModel.viewMode}
          isLoading={showLoader}
          onCellPress={handleCellPress}
        />
      ) : (
        <ScheduleGridEmptyPrompt viewMode={viewModel.viewMode} />
      )}

      {viewModel.editorOpen && (
        <ScheduleEditorModal
          isOpen={viewModel.editorOpen}
          initialCoordinate={editorTarget?.coordinate ?? null}
          initialSlot={editorTarget?.slot ?? null}
          baseSlots={viewModel.allSlots}
          teachers={viewModel.teachers}
          classes={viewModel.classes}
          events={viewModel.events}
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
