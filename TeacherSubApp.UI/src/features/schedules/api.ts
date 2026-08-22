import { apiClient } from "../../lib/apiClient";
import type {
  SlotCoordinate,
  WeeklyScheduleBulkEditRequest,
  WeeklyScheduleQuery,
  WeeklyScheduleReadDto,
  WeeklyScheduleSwapEntry,
  WeeklyScheduleUpdateEntry,
  WeeklyScheduleWriteDto,
} from "./types";

function appendQueryParam(
  params: URLSearchParams,
  key: string,
  value: number | undefined,
) {
  if (value !== undefined) params.set(key, String(value));
}

export function buildScheduleQueryString(query: WeeklyScheduleQuery = {}) {
  const params = new URLSearchParams();
  appendQueryParam(params, "teacherId", query.teacherId);
  appendQueryParam(params, "classId", query.classId);
  appendQueryParam(params, "eventId", query.eventId);
  appendQueryParam(params, "dayOfWeek", query.dayOfWeek);
  appendQueryParam(params, "periodNumber", query.periodNumber);
  const value = params.toString();
  return value ? `?${value}` : "";
}

export const weeklySchedulesApi = {
  getAll(
    query: WeeklyScheduleQuery = {},
    signal?: AbortSignal,
  ): Promise<WeeklyScheduleReadDto[]> {
    return apiClient.get<WeeklyScheduleReadDto[]>(
      `/schedules${buildScheduleQueryString(query)}`,
      signal,
    );
  },

  getById(
    id: number,
    signal?: AbortSignal,
  ): Promise<WeeklyScheduleReadDto> {
    return apiClient.get<WeeklyScheduleReadDto>(`/schedules/${id}`, signal);
  },

  create(dto: WeeklyScheduleWriteDto): Promise<WeeklyScheduleReadDto> {
    return apiClient.post<WeeklyScheduleReadDto, WeeklyScheduleWriteDto>(
      "/schedules",
      dto,
    );
  },

  update(
    id: number,
    dto: WeeklyScheduleWriteDto,
  ): Promise<WeeklyScheduleReadDto> {
    return apiClient.put<WeeklyScheduleReadDto, WeeklyScheduleWriteDto>(
      `/schedules/${id}`,
      dto,
    );
  },

  delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/schedules/${id}`);
  },

  swap(
    slotA: SlotCoordinate,
    slotB: SlotCoordinate,
  ): Promise<void> {
    const request: WeeklyScheduleSwapEntry = { SlotA: slotA, SlotB: slotB };
    return apiClient.post<void, WeeklyScheduleSwapEntry>(
      "/schedules/swap",
      request,
    );
  },

  bulkEdit(request: WeeklyScheduleBulkEditRequest): Promise<void> {
    return apiClient.post<void, WeeklyScheduleBulkEditRequest>(
      "/schedules/bulk",
      request,
    );
  },
};

export function toScheduleUpdateEntry(
  id: number,
  payload: WeeklyScheduleWriteDto,
): WeeklyScheduleUpdateEntry {
  return { Id: id, Payload: payload };
}
