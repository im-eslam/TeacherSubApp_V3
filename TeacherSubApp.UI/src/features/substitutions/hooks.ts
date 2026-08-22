import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { substitutionsApi } from "./api";
import {
  getBackendDayOfWeekOrNull,
  toIsoDate,
} from "./dateUtils";
import type {
  AbsenceQuery,
  RecommendationQuery,
  ScheduleQuery,
  SubstitutionQuery,
  SubstitutionWriteDto,
  TeacherAbsenceWriteDto,
  TeacherQuery,
} from "./types";

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

export function useTodayAbsences(serviceDate: string) {
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
  const date = new Date(`${serviceDate}T12:00:00`);
  const dayOfWeek = getBackendDayOfWeekOrNull(date);
  const query: ScheduleQuery = { teacherId, dayOfWeek: dayOfWeek ?? undefined };

  return useQuery({
    queryKey: substitutionKeys.schedules(query),
    queryFn: ({ signal }) => substitutionsApi.getSchedules(query, signal),
    enabled: enabled && teacherId > 0 && dayOfWeek !== null,
    staleTime: 30_000,
  });
}

export function useTodaySubstitutions(serviceDate: string) {
  const query: SubstitutionQuery = {
    fromDate: serviceDate,
    toDate: serviceDate,
  };
  return useQuery({
    queryKey: substitutionKeys.assignments(query),
    queryFn: ({ signal }) => substitutionsApi.getSubstitutions(query, signal),
  });
}

export function useRecommendations(query: RecommendationQuery, enabled: boolean) {
  return useQuery({
    queryKey: substitutionKeys.recommendations(query),
    queryFn: ({ signal }) => substitutionsApi.getRecommendations(query, signal),
    enabled,
    staleTime: 10_000,
  });
}

export function useCreateAbsence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: TeacherAbsenceWriteDto) =>
      substitutionsApi.createAbsence(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: substitutionKeys.all });
    },
  });
}

export function useCreateSubstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: SubstitutionWriteDto) =>
      substitutionsApi.createSubstitution(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: substitutionKeys.all });
    },
  });
}

export function useSubstituteMutations() {
  const absenceMutation = useCreateAbsence();
  const substitutionMutation = useCreateSubstitution();

  return {
    createAbsence: async (dto: TeacherAbsenceWriteDto) => {
      await absenceMutation.mutateAsync(dto);
      toast.success("تم تسجيل الغياب بنجاح");
    },
    createSubstitution: async (dto: SubstitutionWriteDto) => {
      await substitutionMutation.mutateAsync(dto);
      toast.success("تم تعيين البديل بنجاح");
    },
    isAbsencePending: absenceMutation.isPending,
    isSubstitutionPending: substitutionMutation.isPending,
  };
}

export function getServiceDate(date: Date = new Date()): string {
  return toIsoDate(date);
}
