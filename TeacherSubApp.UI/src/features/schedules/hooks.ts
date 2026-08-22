import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEventKeys } from "../events/hooks";
import { useSchoolClasses } from "../classes/hooks";
import { useTeachers } from "../teachers/hooks";
import { weeklySchedulesApi } from "./api";
import type {
  ScheduleDraftRow,
  ScheduleEditMode,
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

export function useWeeklyScheduleEditDraft(baseSlots: WeeklyScheduleReadDto[]) {
  const [rows, setRows] = useState<ScheduleDraftRow[]>([]);

  const addRow = useCallback((mode: ScheduleEditMode = "create") => {
    const row: ScheduleDraftRow = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      mode,
      slotId: "",
      teacherId: "",
      dayOfWeek: "1",
      periodNumber: "1",
      classId: "none",
      eventId: "none",
      targetTeacherId: "",
      targetDayOfWeek: "1",
      targetPeriodNumber: "1",
    };
    setRows((current) => [...current, row]);
    return row.id;
  }, []);

  const updateRow = useCallback(
    (id: string, patch: Partial<Omit<ScheduleDraftRow, "id">>) => {
      setRows((current) =>
        current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      );
    },
    [],
  );

  const removeRow = useCallback((id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
  }, []);

  const reset = useCallback(() => setRows([]), []);
  const slotById = useMemo(
    () => new Map(baseSlots.map((slot) => [String(slot.id), slot])),
    [baseSlots],
  );

  const getSelectedSlot = useCallback(
    (row: ScheduleDraftRow) => slotById.get(row.slotId),
    [slotById],
  );

  const isRowValid = useCallback(
    (row: ScheduleDraftRow) => {
      const coordinateIsValid =
        Number(row.teacherId) > 0 &&
        Number(row.dayOfWeek) >= 1 &&
        Number(row.dayOfWeek) <= 5 &&
        Number(row.periodNumber) >= 1 &&
        Number(row.periodNumber) <= 7;
      const contentIsValid = row.classId !== "none" || row.eventId !== "none";

      if (row.mode === "delete") return Boolean(getSelectedSlot(row));
      if (row.mode === "swap") {
        const targetIsValid =
          Number(row.targetTeacherId) > 0 &&
          Number(row.targetDayOfWeek) >= 1 &&
          Number(row.targetDayOfWeek) <= 5 &&
          Number(row.targetPeriodNumber) >= 1 &&
          Number(row.targetPeriodNumber) <= 7;
        const source = getSelectedSlot(row);
        if (!source || !targetIsValid) return false;
        return !(
          source.teacherId === Number(row.targetTeacherId) &&
          source.dayOfWeek === Number(row.targetDayOfWeek) &&
          source.periodNumber === Number(row.targetPeriodNumber)
        );
      }

      return (
        coordinateIsValid &&
        contentIsValid &&
        (row.mode === "create" || Boolean(getSelectedSlot(row)))
      );
    },
    [getSelectedSlot],
  );

  const request = useMemo<WeeklyScheduleBulkEditRequest>(() => {
    const result: WeeklyScheduleBulkEditRequest = {
      creates: [],
      updates: [],
      deletes: [],
      swaps: [],
    };

    for (const row of rows) {
      const selectedSlot = getSelectedSlot(row);
      if (!isRowValid(row)) continue;

      if (row.mode === "delete") {
        result.deletes.push(selectedSlot!.id);
        continue;
      }
      if (row.mode === "swap") {
        result.swaps.push({
          slotA: {
            teacherId: selectedSlot!.teacherId,
            dayOfWeek: selectedSlot!.dayOfWeek,
            periodNumber: selectedSlot!.periodNumber,
          },
          slotB: {
            teacherId: Number(row.targetTeacherId),
            dayOfWeek: Number(row.targetDayOfWeek),
            periodNumber: Number(row.targetPeriodNumber),
          },
        });
        continue;
      }

      const payload: WeeklyScheduleWriteDto = {
        teacherId: Number(row.teacherId),
        dayOfWeek: Number(row.dayOfWeek),
        periodNumber: Number(row.periodNumber),
        classId: row.classId === "none" ? null : Number(row.classId),
        eventId: row.eventId === "none" ? null : Number(row.eventId),
      };

      if (row.mode === "create") {
        result.creates.push(payload);
      } else {
        result.updates.push({ id: selectedSlot!.id, payload });
      }
    }

    return result;
  }, [getSelectedSlot, isRowValid, rows]);

  return {
    rows,
    addRow,
    updateRow,
    removeRow,
    reset,
    isRowValid,
    request,
    canSubmit: rows.length > 0 && rows.every(isRowValid),
  };
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
