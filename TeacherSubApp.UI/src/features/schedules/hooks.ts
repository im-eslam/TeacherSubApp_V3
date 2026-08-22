import { useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTeachers } from "../teachers/hooks";
import { useSchoolClasses } from "../classes/hooks";
import { useDelayedLoading } from "../../lib/useDelayedLoading";
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

export function useWeeklySchedule(
  query: WeeklyScheduleQuery,
  enabled: boolean,
) {
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
  isError: boolean;
  error: unknown;
  isFetching: boolean;
  refetch: () => unknown;
} {
  const {
    data: teachers = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useTeachers();

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

  return { options, isLoading, isError, error, isFetching, refetch };
}

export function useClassSelectorOptions(): {
  options: SelectorOption[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isFetching: boolean;
  refetch: () => unknown;
} {
  const {
    data: classes = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useSchoolClasses();

  const options = useMemo(() => {
    return classes.map((schoolClass) => ({
      value: String(schoolClass.id),
      label: schoolClass.displayName,
    }));
  }, [classes]);

  return { options, isLoading, isError, error, isFetching, refetch };
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
  isAwaitingData: boolean;
  isError: boolean;
  error: unknown;
  isRetrying: boolean;
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
    isPlaceholderData,
    isError: scheduleIsError,
    error: scheduleError,
    refetch,
  } = useWeeklySchedule(query, hasSelection);

  const isError =
    teacherOptions.isError || classOptions.isError || scheduleIsError;
  const error = teacherOptions.error ?? classOptions.error ?? scheduleError;
  const isRetrying =
    teacherOptions.isFetching || classOptions.isFetching || isFetching;

  const retry = () => {
    void teacherOptions.refetch();
    void classOptions.refetch();
    void refetch();
  };

  const isSwitchingSelection = isFetching && isPlaceholderData;
  const showLoader = useDelayedLoading(isLoading || isSwitchingSelection, 200);
  const isAwaitingData = showLoader;

  return {
    viewMode,
    onViewModeChange: setViewMode,
    selectedId,
    onSelectedIdChange: setSelectedId,
    selectorOptions,
    isSelectorLoading,
    slots: hasSelection && !isSwitchingSelection ? slots : [],
    isLoading: showLoader,
    isAwaitingData,
    isError,
    error,
    isRetrying,
    retry,
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
