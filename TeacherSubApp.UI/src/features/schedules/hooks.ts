import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEventKeys } from "../events/hooks";
import { useSchoolClasses } from "../classes/hooks";
import { useTeachers } from "../teachers/hooks";
import { useDelayedLoading } from "../../lib/useDelayedLoading";
import { useShallow } from "zustand/react/shallow";
import { weeklySchedulesApi } from "./api";
import { draftsToBulkRequest, useScheduleDraftStore } from "./store";
import type {
  ScheduleDraft,
  ScheduleEditOperation,
  ScheduleWizardStep,
  WeeklyScheduleBulkEditRequest,
  WeeklyScheduleQuery,
  WeeklyScheduleReadDto,
} from "./types";

const scheduleKeys = {
  all: ["weeklySchedules"] as const,
  list: (query: WeeklyScheduleQuery) =>
    [...scheduleKeys.all, "list", query] as const,
  detail: (id: number) => [...scheduleKeys.all, "detail", id] as const,
};

export type ScheduleViewMode = "teacher" | "class";

export interface SchedulePageViewModel {
  viewMode: ScheduleViewMode;
  selectedTeacherId: number | null;
  selectedClassId: number | null;
  selectedId: number | null;
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
  teacherOptions: { value: string; label: string }[];
  classOptions: { value: string; label: string }[];
  teacherSubjectById: ReadonlyMap<number, string | null>;
  slots: WeeklyScheduleReadDto[];
  isLoading: boolean;
  isAwaitingSelection: boolean;
  isError: boolean;
  error: unknown;
  retry: () => void;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  onTeacherChange: (value: string) => void;
  onClassChange: (value: string) => void;
}

export interface ScheduleEditorViewModel {
  slots: WeeklyScheduleReadDto[];
  teachers: SchedulePageViewModel["teachers"];
  classes: SchedulePageViewModel["classes"];
  events: SchedulePageViewModel["events"];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  retry: () => void;
  submit: (request: WeeklyScheduleBulkEditRequest) => Promise<void>;
  isSubmitting: boolean;
  draftStore: {
    currentOperation: ScheduleEditOperation | null;
    currentDraft: ScheduleDraft | null;
    stagedEdits: ScheduleDraft[];
    currentStep: ScheduleWizardStep;
    startOperation: (operation: ScheduleEditOperation) => void;
    updateCurrentDraft: (patch: Partial<ScheduleDraft>) => void;
    addCurrentToDraft: () => { ok: true } | { ok: false; reason: string };
    editStagedDraft: (id: string) => void;
    removeStagedEdit: (id: string) => void;
    reset: () => void;
    setCurrentStep: (step: ScheduleWizardStep) => void;
  };
}

export function useWeeklySchedules(
  query: WeeklyScheduleQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: scheduleKeys.list(query),
    queryFn: ({ signal }) => weeklySchedulesApi.getAll(query, signal),
    enabled,
  });
}

export function useWeeklySchedule(id: number | null) {
  return useQuery({
    queryKey: scheduleKeys.detail(id ?? 0),
    queryFn: ({ signal }) => weeklySchedulesApi.getById(id!, signal),
    enabled: id !== null,
  });
}

export function useBulkEditSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: WeeklyScheduleBulkEditRequest) =>
      weeklySchedulesApi.bulkEdit(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useSchedulePage(): SchedulePageViewModel {
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("teacher");
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const { data: teachers = [] } = useTeachers();
  const { data: classes = [] } = useSchoolClasses();
  const { data: events = [] } = useEventKeys();

  const selectedId = viewMode === "teacher" ? selectedTeacherId : selectedClassId;
  const selectedQuery = useMemo<WeeklyScheduleQuery>(
    () =>
      viewMode === "teacher"
        ? selectedTeacherId === null
          ? {}
          : { teacherId: selectedTeacherId }
        : selectedClassId === null
          ? {}
          : { classId: selectedClassId },
    [selectedClassId, selectedTeacherId, viewMode],
  );
  const scheduleQuery = useWeeklySchedules(selectedQuery, selectedId !== null);
  const showLoader = useDelayedLoading(scheduleQuery.isLoading, 200);

  const teacherOptions = useMemo(
    () =>
      teachers
        .slice()
        .sort((a, b) =>
          (a.subjectName ?? "").localeCompare(b.subjectName ?? "", "ar") ||
          a.name.localeCompare(b.name, "ar"),
        )
        .map((teacher) => ({
          value: String(teacher.id),
          label: teacher.subjectName
            ? `${teacher.name} — ${teacher.subjectName}`
            : teacher.name,
        })),
    [teachers],
  );
  const classOptions = useMemo(
    () =>
      classes
        .slice()
        .sort((a, b) => a.displayName.localeCompare(b.displayName, "ar"))
        .map((schoolClass) => ({
          value: String(schoolClass.id),
          label: schoolClass.displayName,
        })),
    [classes],
  );
  const teacherSubjectById = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher.subjectName])),
    [teachers],
  );

  return {
    viewMode,
    selectedTeacherId,
    selectedClassId,
    selectedId,
    teachers,
    classes,
    events,
    teacherOptions,
    classOptions,
    teacherSubjectById,
    slots: scheduleQuery.data ?? [],
    isLoading: showLoader,
    isAwaitingSelection: selectedId === null,
    isError: scheduleQuery.isError,
    error: scheduleQuery.error,
    retry: scheduleQuery.refetch,
    onViewModeChange: (mode) => {
      setViewMode(mode);
      if (mode === "teacher") setSelectedClassId(null);
      else setSelectedTeacherId(null);
    },
    onTeacherChange: (value) =>
      setSelectedTeacherId(value ? Number(value) : null),
    onClassChange: (value) => setSelectedClassId(value ? Number(value) : null),
  };
}

export function useScheduleEditor(): ScheduleEditorViewModel {
  const scheduleQuery = useWeeklySchedules({}, true);
  const { data: teachers = [] } = useTeachers();
  const { data: classes = [] } = useSchoolClasses();
  const { data: events = [] } = useEventKeys();
  const bulkMutation = useBulkEditSchedule();
  const draftStore = useScheduleDraftStore(
    useShallow((state) => ({
    currentOperation: state.currentOperation,
    currentDraft: state.currentDraft,
    stagedEdits: state.stagedEdits,
    currentStep: state.currentStep,
    startOperation: state.startOperation,
    updateCurrentDraft: state.updateCurrentDraft,
    addCurrentToDraft: state.addCurrentToDraft,
    editStagedDraft: state.editStagedDraft,
    removeStagedEdit: state.removeStagedEdit,
    reset: state.reset,
    setCurrentStep: state.setCurrentStep,
    })),
  );

  return {
    slots: scheduleQuery.data ?? [],
    teachers,
    classes,
    events,
    isLoading: scheduleQuery.isLoading,
    isError: scheduleQuery.isError,
    error: scheduleQuery.error,
    retry: scheduleQuery.refetch,
    submit: async (request) => {
      await bulkMutation.mutateAsync(request);
    },
    isSubmitting: bulkMutation.isPending,
    draftStore,
  };
}

export { draftsToBulkRequest };
