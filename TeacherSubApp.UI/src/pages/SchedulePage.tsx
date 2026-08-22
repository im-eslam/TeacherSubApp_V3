import { lazy, Suspense, useState } from "react";
import { CalendarDays, CalendarRange, Loader2 } from "lucide-react";
import {
  EntityErrorBanner,
  EntityPageHeader,
  EntityToolbar,
} from "../components/layout/EntityPageLayout";
import { useSchedulePage, type ScheduleViewMode } from "../features/schedules/hooks";
import { ScheduleGrid } from "../features/schedules/components/ScheduleGrid";
import { ScheduleToolbar } from "../features/schedules/components/ScheduleToolbar";

const BulkEditModal = lazy(() =>
  import("../features/schedules/components/BulkEditModal").then((module) => ({
    default: module.BulkEditModal,
  })),
);

export default function SchedulePage() {
  const viewModel = useSchedulePage();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <EntityPageHeader
        title="الجدول الأسبوعي"
        description="اعرض جدول المعلمين والفصول في مصفوفة أسبوعية واضحة، ثم جهّز تعديلات كاملة للجدول واحفظها دفعة واحدة من المحرر المركزي."
        addLabel="تعديل الجدول بالكامل"
        onAdd={() => setIsEditorOpen(true)}
        isDisabled={viewModel.isError}
      />

      {viewModel.isError && (
        <EntityErrorBanner
          error={viewModel.error}
          onRetry={viewModel.retry}
          isRetrying={viewModel.isLoading}
        />
      )}

      <EntityToolbar>
        <ScheduleToolbar
          viewMode={viewModel.viewMode}
          teacherOptions={viewModel.teacherOptions}
          classOptions={viewModel.classOptions}
          selectedTeacherId={viewModel.selectedTeacherId}
          selectedClassId={viewModel.selectedClassId}
          onViewModeChange={viewModel.onViewModeChange}
          onTeacherChange={viewModel.onTeacherChange}
          onClassChange={viewModel.onClassChange}
          isDisabled={viewModel.isError}
        />
      </EntityToolbar>

      {viewModel.isAwaitingSelection ? (
        <ScheduleEmptyPrompt viewMode={viewModel.viewMode} />
      ) : (
        <ScheduleGrid
          slots={viewModel.slots}
          viewMode={viewModel.viewMode}
          teacherSubjectById={viewModel.teacherSubjectById}
          isLoading={viewModel.isLoading}
        />
      )}

      {isEditorOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <BulkEditModal
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

function ScheduleEmptyPrompt({ viewMode }: { viewMode: ScheduleViewMode }) {
  const Icon = viewMode === "teacher" ? CalendarDays : CalendarRange;
  const text =
    viewMode === "teacher"
      ? "اختر معلماً لعرض جدوله الأسبوعي"
      : "اختر فصلاً لعرض جدوله الأسبوعي";

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-200/80 bg-white px-4 py-24 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-100 text-neutral-400">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-neutral-900">{text}</p>
      <p className="max-w-xs text-xs leading-relaxed text-neutral-400">
        ستظهر الخانات الفارغة تلقائياً في شبكة الأيام والحصص بعد الاختيار.
      </p>
    </div>
  );
}

function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 text-sm text-neutral-600 shadow-xl">
        <Loader2 className="animate-spin text-blue-600" size={18} />
        جارٍ تحميل محرر الجدول...
      </div>
    </div>
  );
}
