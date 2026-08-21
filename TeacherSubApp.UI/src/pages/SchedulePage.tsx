import { useCallback, useMemo, useState } from "react";
import { CalendarDays, CalendarRange, Pencil } from "lucide-react";
import { useDelayedLoading } from "../lib/useDelayedLoading";
import {
  EntityErrorBanner,
  EntityToolbar,
} from "../components/layout/EntityPageLayout";
import { Button } from "../components/controls/Button";
import { SearchableSelect } from "../components/controls/SearchableSelect";
import { SegmentedToggle } from "../components/controls/SegmentedToggle";
import { useTeachers } from "../features/teachers/hooks";
import { useSchoolClasses } from "../features/classes/hooks";
import { useEventKeys } from "../features/events/hooks";
import {
  useAllWeeklySchedules,
  useWeeklyScheduleGrid,
} from "../features/schedules/hooks";
import { ScheduleGrid } from "../features/schedules/components/ScheduleGrid";
import { BulkEditModal } from "../features/schedules/components/BulkEditModal";
import type {
  WeeklyScheduleQuery,
  WeeklyScheduleReadDto,
} from "../features/schedules/types";

type ViewMode = "teacher" | "class";

const VIEW_MODE_OPTIONS = [
  { value: "teacher", label: "عرض المعلم" },
  { value: "class", label: "عرض الفصل" },
];

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("teacher");
  const [selectedId, setSelectedId] = useState<string>("");
  const [editOpen, setEditOpen] = useState(false);

  const { data: teachers = [] } = useTeachers();
  const { data: classes = [] } = useSchoolClasses();
  const { data: eventKeys = [] } = useEventKeys();

  const selectOptions = useMemo(() => {
    if (viewMode === "teacher") {
      return [...teachers]
        .sort((a, b) => {
          const bySubject = (a.subjectName ?? "").localeCompare(
            b.subjectName ?? "",
            "ar",
          );
          return bySubject !== 0 ? bySubject : a.name.localeCompare(b.name, "ar");
        })
        .map((t) => ({
          value: String(t.id),
          label: t.subjectName ? `${t.name} — ${t.subjectName}` : t.name,
        }));
    }
    return classes.map((c) => ({ value: String(c.id), label: c.displayName }));
  }, [viewMode, teachers, classes]);

  const handleViewModeChange = (next: string) => {
    setViewMode(next as ViewMode);
    setSelectedId("");
  };

  const query: WeeklyScheduleQuery = useMemo(() => {
    if (!selectedId) return {};
    const id = Number(selectedId);
    return viewMode === "teacher" ? { teacherId: id } : { classId: id };
  }, [viewMode, selectedId]);

  const hasSelection = selectedId !== "";

  const {
    data: grid,
    isLoading,
    isError,
    error,
    refetch,
  } = useWeeklyScheduleGrid(query, { enabled: hasSelection });

  const showLoader = useDelayedLoading(isLoading, 200);

  // Full slot list — loaded lazily when the edit modal opens
  const { data: allSlotsGrid, refetch: refetchAllSlots } =
    useAllWeeklySchedules({ enabled: editOpen });

  const allSlots = useMemo<WeeklyScheduleReadDto[]>(
    () => allSlotsGrid?.slots ?? [],
    [allSlotsGrid],
  );

  const getTeacherSlots = useCallback(
    (teacherId: number) => allSlots.filter((s) => s.teacherId === teacherId),
    [allSlots],
  );

  const handleSaved = () => {
    refetch();
    refetchAllSlots();
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            الجدول الأسبوعي
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed max-w-2xl mt-1">
            اعرض جدول أي معلم أو فصل عبر أيام الأسبوع وحصصه السبع، وأدر
            التعيينات دفعة واحدة من خلال زر التعديل.
          </p>
        </div>

        <Button
          variant="primary"
          onPress={() => setEditOpen(true)}
          isDisabled={showLoader}
        >
          <Pencil size={16} strokeWidth={2.5} />
          تعديل
        </Button>
      </div>

      {hasSelection && isError && (
        <EntityErrorBanner
          error={error}
          onRetry={refetch}
          isRetrying={isLoading}
        />
      )}

      <EntityToolbar>
        <SegmentedToggle
          value={viewMode}
          onChange={handleViewModeChange}
          options={VIEW_MODE_OPTIONS}
        />

        <div className="w-[300px]">
          <SearchableSelect
            value={selectedId}
            onChange={setSelectedId}
            options={selectOptions}
            placeholder={viewMode === "teacher" ? "اختر معلماً" : "اختر فصلاً"}
          />
        </div>
      </EntityToolbar>

      {hasSelection ? (
        <ScheduleGrid
          slots={grid?.slots ?? []}
          viewMode={viewMode}
          isLoading={showLoader}
        />
      ) : (
        <ScheduleGridEmptyPrompt viewMode={viewMode} />
      )}

      {editOpen && (
        <BulkEditModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          teachers={teachers}
          classes={classes}
          events={eventKeys}
          getTeacherSlots={getTeacherSlots}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Empty prompt before selecting a teacher/class
// ════════════════════════════════════════════════════════════

function ScheduleGridEmptyPrompt({ viewMode }: { viewMode: ViewMode }) {
  const Icon = viewMode === "teacher" ? CalendarDays : CalendarRange;
  const message =
    viewMode === "teacher"
      ? "اختر معلماً لعرض جدوله الأسبوعي الكامل"
      : "اختر فصلاً لعرض جدوله الأسبوعي";

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center px-4 bg-white border border-neutral-200/80 rounded-2xl">
      <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-neutral-100 text-neutral-400">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-neutral-900 mt-1">{message}</p>
      <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">
        استخدم القائمة أعلاه لتحديد معلم أو فصل والبدء بعرض الجدول.
      </p>
    </div>
  );
}