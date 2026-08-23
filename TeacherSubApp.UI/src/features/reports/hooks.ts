import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SelectOption } from "../../components/controls/Select";
import { useDelayedLoading } from "../../lib/useDelayedLoading";
import { useTeachers } from "../teachers/hooks";
import { reportsApi } from "./api";
import { useReportsPageStore } from "./store";
import { getRangeError } from "./utils";
import type { ReportDateRange, ReportTab } from "./types";

export const reportKeys = {
  all: ["reports"] as const,
  daily: (date: string) => [...reportKeys.all, "daily", date] as const,
  teacherAbsenceHistory: (teacherId: number, range: ReportDateRange) =>
    [...reportKeys.all, "teacher-absence-history", teacherId, range] as const,
  teacherWeeklyLoad: (teacherId: number, range: ReportDateRange) =>
    [...reportKeys.all, "teacher-weekly-load", teacherId, range] as const,
  teacherAnalysis: (teacherId: number, range: ReportDateRange) =>
    [...reportKeys.all, "teacher-analysis", teacherId, range] as const,
  systemAnalysis: (range: ReportDateRange, topCount: number) =>
    [...reportKeys.all, "system-analysis", range, topCount] as const,
};

export function useDailyReport(date: string, enabled = true) {
  return useQuery({
    queryKey: reportKeys.daily(date),
    queryFn: ({ signal }) => reportsApi.getDailyReport(date, signal),
    enabled: enabled && Boolean(date),
  });
}

export function useTeacherAbsenceHistory(
  teacherId: number,
  range: ReportDateRange,
  enabled = true,
) {
  return useQuery({
    queryKey: reportKeys.teacherAbsenceHistory(teacherId, range),
    queryFn: ({ signal }) =>
      reportsApi.getTeacherAbsenceHistory(teacherId, range, signal),
    enabled: enabled && teacherId > 0 && getRangeError(range) === null,
  });
}

export function useTeacherWeeklyLoad(
  teacherId: number,
  range: ReportDateRange,
  enabled = true,
) {
  return useQuery({
    queryKey: reportKeys.teacherWeeklyLoad(teacherId, range),
    queryFn: ({ signal }) => reportsApi.getTeacherWeeklyLoad(teacherId, range, signal),
    enabled: enabled && teacherId > 0 && getRangeError(range) === null,
  });
}

export function useTeacherAnalysis(
  teacherId: number,
  range: ReportDateRange,
  enabled = true,
) {
  return useQuery({
    queryKey: reportKeys.teacherAnalysis(teacherId, range),
    queryFn: ({ signal }) => reportsApi.getTeacherAnalysis(teacherId, range, signal),
    enabled: enabled && teacherId > 0 && getRangeError(range) === null,
  });
}

export function useSystemAnalysis(
  range: ReportDateRange,
  topCount: number,
  enabled = true,
) {
  return useQuery({
    queryKey: reportKeys.systemAnalysis(range, topCount),
    queryFn: ({ signal }) => reportsApi.getSystemAnalysis(range, topCount, signal),
    enabled: enabled && getRangeError(range) === null,
  });
}

function buildTeacherOptions(
  teachers: Awaited<ReturnType<typeof useTeachers>>["data"],
): SelectOption[] {
  return [...(teachers ?? [])]
    .sort((a, b) => {
      const subjectA = a.subjectName ?? "";
      const subjectB = b.subjectName ?? "";
      return (
        subjectA.localeCompare(subjectB, "ar") ||
        a.name.localeCompare(b.name, "ar")
      );
    })
    .map((teacher) => ({
      value: String(teacher.id),
      label: teacher.subjectName
        ? `${teacher.subjectName} — ${teacher.name}`
        : teacher.name,
    }));
}

export function useReportsPage() {
  const {
    activeTab,
    dailyDate,
    teacherId,
    teacherRange,
    systemRange,
    topCount,
    setActiveTab,
    setDailyDate,
    setTeacherId,
    setTeacherRange,
    setSystemRange,
    setTopCount,
  } = useReportsPageStore();

  const teachersQuery = useTeachers();
  const teacherOptions = useMemo(
    () => buildTeacherOptions(teachersQuery.data),
    [teachersQuery.data],
  );
  const selectedTeacherId = Number(teacherId);
  const parsedTopCount = Number(topCount) || 10;

  const dailyQuery = useDailyReport(dailyDate, activeTab === "daily");
  const historyQuery = useTeacherAbsenceHistory(
    selectedTeacherId,
    teacherRange,
    activeTab === "absence-history",
  );
  const weeklyLoadQuery = useTeacherWeeklyLoad(
    selectedTeacherId,
    teacherRange,
    activeTab === "weekly-load",
  );
  const teacherAnalysisQuery = useTeacherAnalysis(
    selectedTeacherId,
    teacherRange,
    activeTab === "teacher-analysis",
  );
  const systemQuery = useSystemAnalysis(
    systemRange,
    parsedTopCount,
    activeTab === "system-analysis",
  );

  const activeQuery = {
    daily: dailyQuery,
    "absence-history": historyQuery,
    "weekly-load": weeklyLoadQuery,
    "teacher-analysis": teacherAnalysisQuery,
    "system-analysis": systemQuery,
  }[activeTab];
  const isLoading = useDelayedLoading(activeQuery.isLoading, 200);
  const isTeacherPickerLoading = useDelayedLoading(teachersQuery.isLoading, 200);

  const setTab = (tab: string) => {
    if (tab) setActiveTab(tab as ReportTab);
  };

  return {
    activeTab,
    onTabChange: setTab,
    teachers: {
      options: teacherOptions,
      isLoading: isTeacherPickerLoading,
      isError: teachersQuery.isError,
    },
    daily: {
      date: dailyDate,
      onDateChange: setDailyDate,
      query: dailyQuery,
    },
    teacherReports: {
      teacherId,
      onTeacherChange: setTeacherId,
      teacherRange,
      onRangeChange: setTeacherRange,
      isTeacherSelected: selectedTeacherId > 0,
      rangeError: getRangeError(teacherRange),
      history: historyQuery,
      weeklyLoad: weeklyLoadQuery,
      analysis: teacherAnalysisQuery,
    },
    system: {
      range: systemRange,
      onRangeChange: setSystemRange,
      topCount,
      onTopCountChange: setTopCount,
      parsedTopCount,
      rangeError: getRangeError(systemRange),
      query: systemQuery,
    },
    active: {
      isLoading,
      isError: activeQuery.isError,
      error: activeQuery.error,
      refetch: activeQuery.refetch,
    },
  };
}
