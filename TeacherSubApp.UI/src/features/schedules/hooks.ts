import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTeachers } from "../teachers/hooks";
import { useSchoolClasses } from "../classes/hooks";
import { schedulesApi } from "./api";
import { useSchedulePageStore } from "./store";
import type {
  ScheduleViewMode,
  WeeklyScheduleBulkEditRequest,
  WeeklyScheduleQuery,
  WeeklyScheduleReadDto,
} from "./types";

const scheduleKeys = {
  all: ["schedules"] as const,
  list: (query: WeeklyScheduleQuery) =>
    [...scheduleKeys.all, "list", query] as const,
};

// ════════════════════════════════════════════════════════════
// Queries / mutation
// ════════════════════════════════════════════════════════════

export function useWeeklySchedule(query: WeeklyScheduleQuery, enabled: boolean) {
  return useQuery({
    queryKey: scheduleKeys.list(query),
    queryFn: ({ signal }) => schedulesApi.getAll(query, signal),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useTeacherSlotsLookup(teacherId: number | null) {
  return useQuery({
    queryKey: scheduleKeys.list({ teacherId: teacherId ?? undefined }),
    queryFn: ({ signal }) =>
      schedulesApi.getAll({ teacherId: teacherId ?? undefined }, signal),
    enabled: teacherId !== null,
    staleTime: 10_000,
  });
}

export function useBulkEditSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: WeeklyScheduleBulkEditRequest) =>
      schedulesApi.bulkEdit(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

// ════════════════════════════════════════════════════════════
// Lookup option builders
// ════════════════════════════════════════════════════════════

export interface SelectorOption {
  value: string;
  label: string;
}

export function useTeacherSelectorOptions(): {
  options: SelectorOption[];
  isLoading: boolean;
} {
  const { data: teachers = [], isLoading } = useTeachers();

  const options = useMemo(() => {
    return [...teachers]
      .sort((a, b) =>
        (a.subjectName ?? "").localeCompare(b.subjectName ?? "", "ar"),
      )
      .map((teacher) => ({
        value: String(teacher.id),
        label: `${teacher.name} — ${teacher.subjectName ?? "بلا مادة"}`,
      }));
  }, [teachers]);

  return { options, isLoading };
}

export function useClassSelectorOptions(): {
  options: SelectorOption[];
  isLoading: boolean;
} {
  const { data: classes = [], isLoading } = useSchoolClasses();

  const options = useMemo(() => {
    return classes.map((schoolClass) => ({
      value: String(schoolClass.id),
      label: schoolClass.displayName,
    }));
  }, [classes]);

  return { options, isLoading };
}

// ════════════════════════════════════════════════════════════
// Page-level view model
// ════════════════════════════════════════════════════════════

export interface SchedulePageViewModel {
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  selectedId: string;
  onSelectedIdChange: (id: string) => void;
  selectorOptions: SelectorOption[];
  isSelectorLoading: boolean;
  slots: WeeklyScheduleReadDto[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  retry: () => void;
  hasSelection: boolean;
}

export function useSchedulesPage(): SchedulePageViewModel {
  const { viewMode, selectedId, setViewMode, setSelectedId } =
    useSchedulePageStore();

  const teacherOptions = useTeacherSelectorOptions();
  const classOptions = useClassSelectorOptions();

  const selectorOptions =
    viewMode === "teacher" ? teacherOptions.options : classOptions.options;
  const isSelectorLoading =
    viewMode === "teacher" ? teacherOptions.isLoading : classOptions.isLoading;

  const hasSelection = selectedId !== "";
  const numericId = hasSelection ? Number(selectedId) : null;

  const query: WeeklyScheduleQuery =
    viewMode === "teacher"
      ? { teacherId: numericId ?? undefined }
      : { classId: numericId ?? undefined };

  const {
    data: slots = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useWeeklySchedule(query, hasSelection);

  return {
    viewMode,
    onViewModeChange: setViewMode,
    selectedId,
    onSelectedIdChange: setSelectedId,
    selectorOptions,
    isSelectorLoading,
    slots: hasSelection ? slots : [],
    isLoading,
    isFetching,
    isError,
    error,
    retry: refetch,
    hasSelection,
  };
}

// ════════════════════════════════════════════════════════════
// Bulk-edit submit
// ════════════════════════════════════════════════════════════

export function useSubmitBulkEdit() {
  const mutation = useBulkEditSchedule();

  const submit = async (request: WeeklyScheduleBulkEditRequest) => {
    await mutation.mutateAsync(request);
    toast.success("تم حفظ تعديلات الجدول بنجاح");
  };

  return { submit, isPending: mutation.isPending };
}
