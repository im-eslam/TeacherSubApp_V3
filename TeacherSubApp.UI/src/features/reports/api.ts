import { apiClient } from "../../lib/apiClient";
import type {
  DailyReportDto,
  ReportDateRange,
  SystemAnalysisDto,
  TeacherAbsenceHistoryDto,
  TeacherWeeklyLoadReportDto,
  TeacherAnalysisDto,
} from "./types";

function buildQueryString(params: Record<string, string | number>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    query.set(key, String(value));
  });
  return `?${query.toString()}`;
}

export const reportsApi = {
  getDailyReport: (date: string, signal?: AbortSignal) =>
    apiClient.get<DailyReportDto>(
      `/reports/daily${buildQueryString({ date })}`,
      signal,
    ),

  getTeacherAbsenceHistory: (
    teacherId: number,
    range: ReportDateRange,
    signal?: AbortSignal,
  ) =>
    apiClient.get<TeacherAbsenceHistoryDto>(
      `/reports/teachers/${teacherId}/absence-history${buildQueryString({ fromDate: range.from, toDate: range.to })}`,
      signal,
    ),

  getTeacherWeeklyLoad: (
    teacherId: number,
    range: ReportDateRange,
    signal?: AbortSignal,
  ) =>
    apiClient.get<TeacherWeeklyLoadReportDto>(
      `/reports/teachers/${teacherId}/weekly-load${buildQueryString({ fromDate: range.from, toDate: range.to })}`,
      signal,
    ),

  getTeacherAnalysis: (
    teacherId: number,
    range: ReportDateRange,
    signal?: AbortSignal,
  ) =>
    apiClient.get<TeacherAnalysisDto>(
      `/reports/teachers/${teacherId}/analysis${buildQueryString({ fromDate: range.from, toDate: range.to })}`,
      signal,
    ),

  getSystemAnalysis: (
    range: ReportDateRange,
    topCount: number,
    signal?: AbortSignal,
  ) =>
    apiClient.get<SystemAnalysisDto>(
      `/reports/analysis${buildQueryString({ fromDate: range.from, toDate: range.to, topCount })}`,
      signal,
    ),
};
