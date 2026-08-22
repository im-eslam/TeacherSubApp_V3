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
  appendQueryParam(params, "TeacherId", query.teacherId);
  appendQueryParam(params, "ClassId", query.classId);
  appendQueryParam(params, "EventId", query.eventId);
  appendQueryParam(params, "DayOfWeek", query.dayOfWeek);
  appendQueryParam(params, "PeriodNumber", query.periodNumber);
  const value = params.toString();
  return value ? `?${value}` : "";
}

type RawScheduleRecord = Record<string, unknown>;

function valueOf(raw: RawScheduleRecord, camelName: string, pascalName: string) {
  return raw[camelName] ?? raw[pascalName];
}

export function normalizeScheduleRecord(raw: unknown): WeeklyScheduleReadDto {
  const record = raw as RawScheduleRecord;
  return {
    id: Number(valueOf(record, "id", "Id")),
    teacherId: Number(valueOf(record, "teacherId", "TeacherId")),
    teacherName: String(valueOf(record, "teacherName", "TeacherName") ?? ""),
    dayOfWeek: Number(valueOf(record, "dayOfWeek", "DayOfWeek")),
    periodNumber: Number(valueOf(record, "periodNumber", "PeriodNumber")),
    classId: (valueOf(record, "classId", "ClassId") as number | null | undefined) ?? null,
    classDisplayName:
      (valueOf(record, "classDisplayName", "ClassDisplayName") as string | null | undefined) ?? null,
    eventId: (valueOf(record, "eventId", "EventId") as number | null | undefined) ?? null,
    eventName:
      (valueOf(record, "eventName", "EventName") as string | null | undefined) ?? null,
  };
}

export function normalizeScheduleRecords(response: unknown): WeeklyScheduleReadDto[] {
  if (!Array.isArray(response)) return [];
  return response.map((record) => normalizeScheduleRecord(record as RawScheduleRecord));
}

export const weeklySchedulesApi = {
  async getAll(
    query: WeeklyScheduleQuery = {},
    signal?: AbortSignal,
  ): Promise<WeeklyScheduleReadDto[]> {
    const response = await apiClient.get<unknown>(
      `/schedules${buildScheduleQueryString(query)}`,
      signal,
    );
    return normalizeScheduleRecords(response);
  },

  async getById(
    id: number,
    signal?: AbortSignal,
  ): Promise<WeeklyScheduleReadDto> {
    const response = await apiClient.get<RawScheduleRecord>(`/schedules/${id}`, signal);
    return normalizeScheduleRecord(response);
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
    const request: WeeklyScheduleSwapEntry = { slotA, slotB };
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
  return { id, payload };
}
