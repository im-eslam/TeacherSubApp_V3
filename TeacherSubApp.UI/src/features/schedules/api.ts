import { apiClient } from "../../lib/apiClient";
import type {
  WeeklyScheduleBulkEditRequest,
  WeeklyScheduleQuery,
  WeeklyScheduleReadDto,
} from "./types";

export function buildQueryString(query: WeeklyScheduleQuery): string {
  const params = new URLSearchParams();

  if (query.teacherId !== undefined) {
    params.set("teacherId", String(query.teacherId));
  }

  if (query.classId !== undefined) {
    params.set("classId", String(query.classId));
  }

  if (query.eventId !== undefined) {
    params.set("eventId", String(query.eventId));
  }

  if (query.dayOfWeek !== undefined) {
    params.set("dayOfWeek", String(query.dayOfWeek));
  }

  if (query.periodNumber !== undefined) {
    params.set("periodNumber", String(query.periodNumber));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const schedulesApi = {
  getAll: (
    query: WeeklyScheduleQuery = {},
    signal?: AbortSignal,
  ): Promise<WeeklyScheduleReadDto[]> => {
    return apiClient.get<WeeklyScheduleReadDto[]>(
      `/schedules${buildQueryString(query)}`,
      signal,
    );
  },

  getById: (
    id: number,
    signal?: AbortSignal,
  ): Promise<WeeklyScheduleReadDto> => {
    return apiClient.get<WeeklyScheduleReadDto>(`/schedules/${id}`, signal);
  },

  bulkEdit: (
    request: WeeklyScheduleBulkEditRequest,
    signal?: AbortSignal,
  ): Promise<void> => {
    return apiClient.post<void, WeeklyScheduleBulkEditRequest>(
      "/schedules/bulk",
      request,
      signal,
    );
  },
};
