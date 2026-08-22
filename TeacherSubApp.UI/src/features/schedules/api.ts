import { apiClient } from "../../lib/apiClient";
import type {
  SlotCoordinate,
  WeeklyScheduleBulkEditRequest,
  WeeklyScheduleQuery,
  WeeklyScheduleReadDto,
  WeeklyScheduleSwapEntry,
  WeeklyScheduleWriteDto,
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

export const weeklySchedulesApi = {
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

  create: (
    dto: WeeklyScheduleWriteDto,
    signal?: AbortSignal,
  ): Promise<WeeklyScheduleReadDto> => {
    return apiClient.post<WeeklyScheduleReadDto, WeeklyScheduleWriteDto>(
      "/schedules",
      dto,
      signal,
    );
  },

  update: (
    id: number,
    dto: WeeklyScheduleWriteDto,
    signal?: AbortSignal,
  ): Promise<WeeklyScheduleReadDto> => {
    return apiClient.put<WeeklyScheduleReadDto, WeeklyScheduleWriteDto>(
      `/schedules/${id}`,
      dto,
      signal,
    );
  },

  delete: (id: number, signal?: AbortSignal): Promise<void> => {
    return apiClient.delete<void>(`/schedules/${id}`, signal);
  },

  swap: (request: WeeklyScheduleSwapEntry, signal?: AbortSignal): Promise<void> => {
    return apiClient.post<void, WeeklyScheduleSwapEntry>(
      "/schedules/swap",
      request,
      signal,
    );
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

export type ScheduleSlotCoordinate = SlotCoordinate;
