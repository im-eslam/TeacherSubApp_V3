import { apiClient } from "../../lib/apiClient";
import type {
  WeeklyScheduleGridDto,
  WeeklyScheduleQuery,
  WeeklyScheduleBulkUpdateDto,
} from "./types";

function buildQueryString(query: WeeklyScheduleQuery): string {
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

export const weeklySchedulesApi = {
  getGrid: (
    query: WeeklyScheduleQuery = {},
    signal?: AbortSignal,
  ): Promise<WeeklyScheduleGridDto> => {
    return apiClient.get<WeeklyScheduleGridDto>(
      `/schedules/grid${buildQueryString(query)}`,
      signal,
    );
  },

  bulkUpdate: (
    dto: WeeklyScheduleBulkUpdateDto,
    signal?: AbortSignal,
  ): Promise<void> => {
    return apiClient.put<void, WeeklyScheduleBulkUpdateDto>(
      "/schedules/bulk",
      dto,
      signal,
    );
  },
};
