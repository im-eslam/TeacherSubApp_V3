import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { substitutionsApi } from "./api";
import { getBackendDayOfWeekOrNull, toIsoDate } from "./dateUtils";
import { useSubstitutionsPageStore } from "./store";
import type {
  AbsenceQuery,
  RecommendationQuery,
  ScheduleQuery,
  SubstitutionQuery,
  SubstitutionReadDto,
  SubstitutionWriteDto,
  TeacherAbsenceReadDto,
  TeacherAbsenceWriteDto,
  TeacherQuery,
  WeeklyScheduleReadDto,
} from "./types";

// ════════════════════════════════════════════════════════════
// Query keys
// ════════════════════════════════════════════════════════════

export const substitutionKeys = {
  all: ["substitutions"] as const,
  absences: (query: AbsenceQuery) =>
    [...substitutionKeys.all, "absences", query] as const,
  teachers: (query: TeacherQuery) =>
    [...substitutionKeys.all, "teachers", query] as const,
  schedules: (query: ScheduleQuery) =>
    [...substitutionKeys.all, "schedules", query] as const,
  assignments: (query: SubstitutionQuery) =>
    [...substitutionKeys.all, "assignments", query] as const,
  recommendations: (query: RecommendationQuery) =>
    [...substitutionKeys.all, "recommendations", query] as const,
};

function scheduleQueryForTeacherOnDate(
  teacherId: number,
  serviceDate: string,
): ScheduleQuery {
  const date = new Date(`${serviceDate}T12:00:00`);
  const dayOfWeek = getBackendDayOfWeekOrNull(date);
  return { teacherId, dayOfWeek: dayOfWeek ?? undefined };
}

// ════════════════════════════════════════════════════════════
// Reads
// ════════════════════════════════════════════════════════════

export function useAbsences(serviceDate: string) {
  const query: AbsenceQuery = { fromDate: serviceDate, toDate: serviceDate };
  return useQuery({
    queryKey: substitutionKeys.absences(query),
    queryFn: ({ signal }) => substitutionsApi.getAbsences(query, signal),
  });
}

export function useTeachers() {
  const query: TeacherQuery = {};
  return useQuery({
    queryKey: substitutionKeys.teachers(query),
    queryFn: ({ signal }) => substitutionsApi.getTeachers(query, signal),
    staleTime: 60_000,
  });
}

export function useDailySchedule(
  teacherId: number,
  serviceDate: string,
  enabled: boolean,
) {
  const query = scheduleQueryForTeacherOnDate(teacherId, serviceDate);

  return useQuery({
    queryKey: substitutionKeys.schedules(query),
    queryFn: ({ signal }) => substitutionsApi.getSchedules(query, signal),
    enabled: enabled && teacherId > 0 && query.dayOfWeek !== undefined,
    staleTime: 30_000,
  });
}

export function useSubstitutions(serviceDate: string) {
  const query: SubstitutionQuery = {
    fromDate: serviceDate,
    toDate: serviceDate,
  };
  return useQuery({
    queryKey: substitutionKeys.assignments(query),
    queryFn: ({ signal }) => substitutionsApi.getSubstitutions(query, signal),
  });
}

export function useRecommendations(
  query: RecommendationQuery,
  enabled: boolean,
) {
  return useQuery({
    queryKey: substitutionKeys.recommendations(query),
    queryFn: ({ signal }) =>
      substitutionsApi.getRecommendations(query, signal),
    enabled,
    staleTime: 10_000,
  });
}

// ════════════════════════════════════════════════════════════
// Prefetching — the "instant accordion" trick
// ════════════════════════════════════════════════════════════
// Recommendations are deliberately NOT prefetched here — they're only
// fetched once the admin opens the Select Substitute modal, per spec.

function prefetchWeeklySchedule(
  queryClient: QueryClient,
  teacherId: number,
  serviceDate: string,
) {
  const query = scheduleQueryForTeacherOnDate(teacherId, serviceDate);
  if (query.dayOfWeek === undefined) return;

  void queryClient.prefetchQuery({
    queryKey: substitutionKeys.schedules(query),
    queryFn: ({ signal }) => substitutionsApi.getSchedules(query, signal),
    staleTime: 30_000,
  });
}

// ════════════════════════════════════════════════════════════
// Mutations
// ════════════════════════════════════════════════════════════

export function useCreateAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: TeacherAbsenceWriteDto) =>
      substitutionsApi.createAbsence(dto),
    onSuccess: (createdAbsence) => {
      queryClient.invalidateQueries({ queryKey: substitutionKeys.all });
      // Aggressively warm the new teacher's schedule for that date so the
      // accordion the admin is about to open expands instantly instead of
      // showing a spinner.
      prefetchWeeklySchedule(
        queryClient,
        createdAbsence.teacherId,
        createdAbsence.absenceDate,
      );
    },
  });
}

export function useDeleteAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (absence: TeacherAbsenceReadDto) =>
      substitutionsApi.deleteAbsence(absence.id),
    onMutate: async (absence) => {
      const query: AbsenceQuery = {
        fromDate: absence.absenceDate,
        toDate: absence.absenceDate,
      };
      const queryKey = substitutionKeys.absences(query);

      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<TeacherAbsenceReadDto[]>(queryKey);

      queryClient.setQueryData<TeacherAbsenceReadDto[]>(
        queryKey,
        (current) =>
          (current ?? []).filter((item) => item.id !== absence.id),
      );

      return { previous, queryKey };
    },
    onError: (_error, _absence, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: substitutionKeys.all });
    },
  });
}

interface CreateSubstitutionContext {
  assignmentsQueryKey: ReturnType<typeof substitutionKeys.assignments>;
  previousAssignments: SubstitutionReadDto[] | undefined;
}

export function useCreateSubstitution() {
  const queryClient = useQueryClient();

  return useMutation<
    SubstitutionReadDto,
    unknown,
    SubstitutionWriteDto & { optimisticName: string; optimisticSubject: string },
    CreateSubstitutionContext
  >({
    mutationFn: (dto) => substitutionsApi.createSubstitution(dto),

    // Turn the slot green and show the sub's name the instant the admin
    // clicks a candidate card — don't make them wait for the round trip.
    onMutate: async (dto) => {
      const query: SubstitutionQuery = {
        fromDate: dto.serviceDate,
        toDate: dto.serviceDate,
      };
      const assignmentsQueryKey = substitutionKeys.assignments(query);

      await queryClient.cancelQueries({ queryKey: assignmentsQueryKey });
      const previousAssignments =
        queryClient.getQueryData<SubstitutionReadDto[]>(assignmentsQueryKey);

      const optimisticEntry: SubstitutionReadDto = {
        id: -Date.now(),
        absenceId: dto.absenceId,
        weeklyScheduleId: dto.weeklyScheduleId,
        substituteTeacherId: dto.substituteTeacherId,
        serviceDate: dto.serviceDate,
        isAlgorithmMatch: dto.isAlgorithmMatch,
        absentTeacherNameAtTimeOfService: "",
        absentTeacherSubjectAtTimeOfService: "",
        substituteTeacherNameAtTimeOfService: dto.optimisticName,
        substituteTeacherSubjectAtTimeOfService: dto.optimisticSubject,
        classNameAtTimeOfService: "",
        periodNumberAtTimeOfService: 0,
      };

      queryClient.setQueryData<SubstitutionReadDto[]>(
        assignmentsQueryKey,
        (current) => [
          ...(current ?? []).filter(
            (item) => item.weeklyScheduleId !== dto.weeklyScheduleId,
          ),
          optimisticEntry,
        ],
      );

      return { assignmentsQueryKey, previousAssignments };
    },

    onError: (_error, _dto, context) => {
      if (context) {
        queryClient.setQueryData(
          context.assignmentsQueryKey,
          context.previousAssignments,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: substitutionKeys.all });
    },
  });
}

// ════════════════════════════════════════════════════════════
// View-model hook — everything the page needs, wired together
// ════════════════════════════════════════════════════════════

export function useSubstitutionsPage() {
  const activeDate = useSubstitutionsPageStore((state) => state.activeDate);
  const setActiveDate = useSubstitutionsPageStore(
    (state) => state.setActiveDate,
  );
  const isLogAbsenceOpen = useSubstitutionsPageStore(
    (state) => state.isLogAbsenceOpen,
  );
  const openLogAbsence = useSubstitutionsPageStore(
    (state) => state.openLogAbsence,
  );
  const closeLogAbsence = useSubstitutionsPageStore(
    (state) => state.closeLogAbsence,
  );
  const selectedSlotForSub = useSubstitutionsPageStore(
    (state) => state.selectedSlotForSub,
  );
  const openRecommendation = useSubstitutionsPageStore(
    (state) => state.openRecommendation,
  );
  const closeRecommendation = useSubstitutionsPageStore(
    (state) => state.closeRecommendation,
  );

  const absences = useAbsences(activeDate);
  const substitutions = useSubstitutions(activeDate);
  const teachers = useTeachers();

  const createAbsenceMutation = useCreateAbsence();
  const deleteAbsenceMutation = useDeleteAbsence();

  const isInitialLoading =
    absences.isLoading || substitutions.isLoading || teachers.isLoading;
  const isError = absences.isError || substitutions.isError || teachers.isError;
  const error = absences.error ?? substitutions.error ?? teachers.error;

  const retry = () => {
    void absences.refetch();
    void substitutions.refetch();
    void teachers.refetch();
  };

  return {
    activeDate,
    setActiveDate,

    absenceList: absences.data ?? [],
    substitutionList: substitutions.data ?? [],
    teacherList: teachers.data ?? [],

    isInitialLoading,
    isError,
    error,
    isRetrying:
      absences.isFetching || substitutions.isFetching || teachers.isFetching,
    retry,

    isLogAbsenceOpen,
    openLogAbsence,
    closeLogAbsence,

    selectedSlotForSub,
    openRecommendation,
    closeRecommendation,

    createAbsence: async (dto: TeacherAbsenceWriteDto) => {
      const created = await createAbsenceMutation.mutateAsync(dto);
      toast.success("تم تسجيل الغياب بنجاح");
      // Fix for the "black hole" date bug: jump the page to the date the
      // absence was actually logged for, so it's visible immediately even
      // if that's not "today".
      setActiveDate(created.absenceDate);
      closeLogAbsence();
    },
    isCreatingAbsence: createAbsenceMutation.isPending,

    deleteAbsence: async (absence: TeacherAbsenceReadDto) => {
      await deleteAbsenceMutation.mutateAsync(absence);
      toast.success("تم حذف الغياب");
    },
    isDeletingAbsence: deleteAbsenceMutation.isPending,
  };
}

export function getServiceDate(date: Date = new Date()): string {
  return toIsoDate(date);
}
