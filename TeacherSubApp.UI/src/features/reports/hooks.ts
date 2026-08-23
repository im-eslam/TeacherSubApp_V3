import { useQuery } from "@tanstack/react-query";
import { useTeachers } from "../teachers/hooks";
import { reportsApi } from "./api";
import { useReportsPageStore } from "./store";
import type { DailyReportQuery, TeacherReportQuery } from "./types";

// ════════════════════════════════════════════════════════════
// Query keys
// ════════════════════════════════════════════════════════════

export const reportKeys = {
  all: ["reports"] as const,
  daily: (query: DailyReportQuery) =>
    [...reportKeys.all, "daily", query] as const,
  teacher: (query: TeacherReportQuery) =>
    [...reportKeys.all, "teacher", query] as const,
};

// ════════════════════════════════════════════════════════════
// Reads
// ════════════════════════════════════════════════════════════

export function useDailyReport(date: string) {
  const query: DailyReportQuery = { date };
  return useQuery({
    queryKey: reportKeys.daily(query),
    queryFn: ({ signal }) => reportsApi.getDailyReport(query, signal),
    enabled: date.length > 0,
  });
}

export function useTeacherReport(query: TeacherReportQuery, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.teacher(query),
    queryFn: ({ signal }) => reportsApi.getTeacherReport(query, signal),
    enabled,
  });
}

// ════════════════════════════════════════════════════════════
// View-model hook — everything the page needs, wired together
// ════════════════════════════════════════════════════════════

export function useReportsPage() {
  const activeView = useReportsPageStore((state) => state.activeView);
  const setActiveView = useReportsPageStore((state) => state.setActiveView);

  const dailyDate = useReportsPageStore((state) => state.dailyDate);
  const setDailyDate = useReportsPageStore((state) => state.setDailyDate);

  const teacherId = useReportsPageStore((state) => state.teacherId);
  const setTeacherId = useReportsPageStore((state) => state.setTeacherId);

  const teacherFromDate = useReportsPageStore((state) => state.teacherFromDate);
  const setTeacherFromDate = useReportsPageStore(
    (state) => state.setTeacherFromDate,
  );

  const teacherToDate = useReportsPageStore((state) => state.teacherToDate);
  const setTeacherToDate = useReportsPageStore(
    (state) => state.setTeacherToDate,
  );

  const clearTeacherRange = useReportsPageStore(
    (state) => state.clearTeacherRange,
  );

  const teachers = useTeachers();

  // Sorted by subject then name (Arabic locale) — same convention used in
  // LogAbsenceModal's teacher picker.
  const teacherOptions = [...(teachers.data ?? [])]
    .sort((left, right) => {
      const leftSubject = left.subjectName ?? "\uffff";
      const rightSubject = right.subjectName ?? "\uffff";
      return (
        leftSubject.localeCompare(rightSubject, "ar") ||
        left.name.localeCompare(right.name, "ar")
      );
    })
    .map((teacher) => ({
      value: String(teacher.id),
      label: `${teacher.name} — ${teacher.subjectName ?? "بلا مادة"}`,
    }));

  const dailyReport = useDailyReport(dailyDate);

  const teacherReportQuery: TeacherReportQuery = {
    teacherId: teacherId ?? 0,
    fromDate: teacherFromDate || undefined,
    toDate: teacherToDate || undefined,
  };
  const teacherReport = useTeacherReport(
    teacherReportQuery,
    teacherId !== null && teacherId > 0,
  );

  const dateRangeInvalid =
    !!teacherFromDate && !!teacherToDate && teacherFromDate > teacherToDate;

  return {
    activeView,
    setActiveView,

    // Teachers list for the teacher-picker (sorted by subject, then name)
    teacherOptions,
    isTeachersLoading: teachers.isLoading,

    // Daily report tab
    dailyDate,
    setDailyDate,
    dailyReport: dailyReport.data,
    isDailyLoading: dailyReport.isLoading,
    isDailyError: dailyReport.isError,
    dailyError: dailyReport.error,
    retryDaily: dailyReport.refetch,
    isDailyRetrying: dailyReport.isFetching,

    // Teacher report tab
    teacherId,
    setTeacherId,
    teacherFromDate,
    setTeacherFromDate,
    teacherToDate,
    setTeacherToDate,
    clearTeacherRange,
    dateRangeInvalid,
    teacherReport: teacherReport.data,
    isTeacherReportLoading: teacherReport.isLoading,
    isTeacherReportError: teacherReport.isError,
    teacherReportError: teacherReport.error,
    retryTeacherReport: teacherReport.refetch,
    isTeacherReportRetrying: teacherReport.isFetching,
    hasSelectedTeacher: teacherId !== null && teacherId > 0,
  };
}
