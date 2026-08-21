import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEventKeys } from "../events/hooks";
import { useSchoolClasses } from "../classes/hooks";
import { useTeachers } from "../teachers/hooks";
import { weeklySchedulesApi } from "./api";
import type {
  SlotCoordinate,
  WeeklyScheduleBulkEditRequest,
  WeeklyScheduleQuery,
  WeeklyScheduleReadDto,
  WeeklyScheduleWriteDto,
} from "./types";

const weeklyScheduleKeys = {
  all: ["weeklySchedules"] as const,
  list: (query: WeeklyScheduleQuery) =>
    [...weeklyScheduleKeys.all, "list", query] as const,
  detail: (id: number) => [...weeklyScheduleKeys.all, "detail", id] as const,
};

export function useWeeklySchedules(
  query: WeeklyScheduleQuery = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: weeklyScheduleKeys.list(query),
    queryFn: ({ signal }) => weeklySchedulesApi.getAll(query, signal),
    enabled: options?.enabled ?? true,
  });
}

export function useWeeklySchedule(id: number) {
  return useQuery({
    queryKey: weeklyScheduleKeys.detail(id),
    queryFn: ({ signal }) => weeklySchedulesApi.getById(id, signal),
    enabled: id > 0,
  });
}

export function useCreateWeeklySchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: WeeklyScheduleWriteDto) => weeklySchedulesApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weeklyScheduleKeys.all });
    },
  });
}

export function useUpdateWeeklySchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: WeeklyScheduleWriteDto }) =>
      weeklySchedulesApi.update(id, dto),
    onSuccess: (updatedSchedule: WeeklyScheduleReadDto) => {
      queryClient.invalidateQueries({ queryKey: weeklyScheduleKeys.all });
      queryClient.setQueryData(
        weeklyScheduleKeys.detail(updatedSchedule.id),
        updatedSchedule,
      );
    },
  });
}

export function useDeleteWeeklySchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => weeklySchedulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weeklyScheduleKeys.all });
    },
  });
}

export function useSwapWeeklySchedules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: { slotA: SlotCoordinate; slotB: SlotCoordinate }) =>
      weeklySchedulesApi.swap(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weeklyScheduleKeys.all });
    },
  });
}

export function useBulkEditWeeklySchedules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: WeeklyScheduleBulkEditRequest) =>
      weeklySchedulesApi.bulkEdit(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weeklyScheduleKeys.all });
    },
  });
}

export type ScheduleViewMode = "teacher" | "class";

export interface SchedulePageViewModel {
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  selectedId: string;
  onSelectedIdChange: (id: string) => void;
  selectionOptions: { value: string; label: string }[];
  selectedQuery: WeeklyScheduleQuery;
  selectedSlots: WeeklyScheduleReadDto[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  retry: () => void;
  editorOpen: boolean;
  openEditor: () => void;
  closeEditor: () => void;
  allSlots: WeeklyScheduleReadDto[];
  isAllSlotsLoading: boolean;
  teachers: Awaited<ReturnType<typeof useTeachers>>["data"] extends infer T
    ? T extends (infer U)[]
      ? U[]
      : never
    : never;
  classes: Awaited<ReturnType<typeof useSchoolClasses>>["data"] extends infer T
    ? T extends (infer U)[]
      ? U[]
      : never
    : never;
  events: Awaited<ReturnType<typeof useEventKeys>>["data"] extends infer T
    ? T extends (infer U)[]
      ? U[]
      : never
    : never;
  bulkEdit: ReturnType<typeof useBulkEditWeeklySchedules>;
}

export function useSchedulePage(): SchedulePageViewModel {
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("teacher");
  const [selectedId, setSelectedId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);

  const { data: teachers = [] } = useTeachers();
  const { data: classes = [] } = useSchoolClasses();
  const { data: events = [] } = useEventKeys();

  const selectionOptions = useMemo(() => {
    if (viewMode === "teacher") {
      return [...teachers]
        .sort((a, b) => a.name.localeCompare(b.name, "ar"))
        .map((teacher) => ({
          value: String(teacher.id),
          label: teacher.subjectName
            ? `${teacher.name} — ${teacher.subjectName}`
            : teacher.name,
        }));
    }

    return [...classes]
      .sort((a, b) => a.displayName.localeCompare(b.displayName, "ar"))
      .map((schoolClass) => ({
        value: String(schoolClass.id),
        label: schoolClass.displayName,
      }));
  }, [classes, teachers, viewMode]);

  const selectedQuery = useMemo<WeeklyScheduleQuery>(() => {
    if (!selectedId) return {};
    const id = Number(selectedId);
    return viewMode === "teacher" ? { teacherId: id } : { classId: id };
  }, [selectedId, viewMode]);

  const selectedSchedule = useWeeklySchedules(selectedQuery, {
    enabled: selectedId !== "",
  });
  const allSchedule = useWeeklySchedules({}, { enabled: editorOpen });
  const bulkEdit = useBulkEditWeeklySchedules();

  return {
    viewMode,
    onViewModeChange: (mode) => {
      setViewMode(mode);
      setSelectedId("");
    },
    selectedId,
    onSelectedIdChange: setSelectedId,
    selectionOptions,
    selectedQuery,
    selectedSlots: selectedSchedule.data ?? [],
    isLoading: selectedSchedule.isLoading,
    isError: selectedSchedule.isError,
    error: selectedSchedule.error,
    retry: selectedSchedule.refetch,
    editorOpen,
    openEditor: () => setEditorOpen(true),
    closeEditor: () => setEditorOpen(false),
    allSlots: allSchedule.data ?? [],
    isAllSlotsLoading: allSchedule.isLoading,
    teachers,
    classes,
    events,
    bulkEdit,
  };
}
