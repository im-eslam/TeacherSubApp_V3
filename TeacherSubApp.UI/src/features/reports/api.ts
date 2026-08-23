import { apiClient } from "../../lib/apiClient";
import type {
  DailyReportQuery,
  DailyReportReadDto,
  TeacherReportQuery,
  TeacherReportReadDto,
} from "./types";

function buildQueryString(query: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const reportsApi = {
  getDailyReport: (
    query: DailyReportQuery,
    signal?: AbortSignal,
  ): Promise<DailyReportReadDto> =>
    apiClient.get<DailyReportReadDto>(
      `/reports/daily${buildQueryString({ date: query.date })}`,
      signal,
    ),

  getTeacherReport: (
    query: TeacherReportQuery,
    signal?: AbortSignal,
  ): Promise<TeacherReportReadDto> =>
    apiClient.get<TeacherReportReadDto>(
      `/reports/teacher${buildQueryString({
        teacherId: query.teacherId,
        fromDate: query.fromDate,
        toDate: query.toDate,
      })}`,
      signal,
    ),
};
