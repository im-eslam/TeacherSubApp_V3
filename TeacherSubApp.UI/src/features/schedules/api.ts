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

type RawScheduleRecord = Record<string, unknown>;

function readField(record: RawScheduleRecord, camelName: string): unknown {
  const pascalName = camelName.charAt(0).toUpperCase() + camelName.slice(1);
  return record[camelName] ?? record[pascalName];
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toNullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : toNumber(value);
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function normalizeScheduleResponse(
  payload: unknown,
): WeeklyScheduleReadDto[] {
  const candidate =
    Array.isArray(payload)
      ? payload
      : typeof payload === "object" && payload !== null
        ? ((payload as RawScheduleRecord).value ??
          (payload as RawScheduleRecord).Value ??
          (payload as RawScheduleRecord).items ??
          (payload as RawScheduleRecord).Items)
        : null;

  if (!Array.isArray(candidate)) return [];

  return candidate.flatMap((item): WeeklyScheduleReadDto[] => {
    if (typeof item !== "object" || item === null) return [];
    const record = item as RawScheduleRecord;
    const id = toNumber(readField(record, "id"));
    const teacherId = toNumber(readField(record, "teacherId"));
    const dayOfWeek = toNumber(readField(record, "dayOfWeek"));
    const periodNumber = toNumber(readField(record, "periodNumber"));
    if (id === null || teacherId === null || dayOfWeek === null || periodNumber === null) {
      return [];
    }

    return [
      {
        id,
        teacherId,
        teacherName: String(readField(record, "teacherName") ?? ""),
        dayOfWeek,
        periodNumber,
        classId: toNullableNumber(readField(record, "classId")),
        classDisplayName: toNullableString(
          readField(record, "classDisplayName"),
        ),
        eventId: toNullableNumber(readField(record, "eventId")),
        eventName: toNullableString(readField(record, "eventName")),
      },
    ];
  });
}

export const weeklySchedulesApi = {
  getAll: (
    query: WeeklyScheduleQuery = {},
    signal?: AbortSignal,
  ): Promise<WeeklyScheduleReadDto[]> => {
    return apiClient
      .get<unknown>(`/schedules${buildQueryString(query)}`, signal)
      .then(normalizeScheduleResponse);
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
