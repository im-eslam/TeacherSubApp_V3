import { apiClient } from "../../lib/apiClient";
import type {
  SchoolClassQuery,
  SchoolClassReadDto,
  SchoolClassWriteDto,
} from "./types";

export function buildQueryString(query: SchoolClassQuery): string {
  const params = new URLSearchParams();

  if (query.displayName && query.displayName.trim() !== "") {
    params.set("displayName", query.displayName.trim());
  }

  if (query.grade !== undefined) {
    params.set("grade", String(query.grade));
  }

  if (query.section !== undefined) {
    params.set("section", String(query.section));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const classesApi = {
  getAll: (
    query: SchoolClassQuery = {},
    signal?: AbortSignal,
  ): Promise<SchoolClassReadDto[]> => {
    return apiClient.get<SchoolClassReadDto[]>(
      `/classes${buildQueryString(query)}`,
      signal,
    );
  },

  getById: (id: number, signal?: AbortSignal): Promise<SchoolClassReadDto> => {
    return apiClient.get<SchoolClassReadDto>(`/classes/${id}`, signal);
  },

  getGrades: (signal?: AbortSignal): Promise<number[]> => {
    return apiClient.get<number[]>("/classes/grades", signal);
  },

  getSectionsForGrade: (
    grade: number,
    signal?: AbortSignal,
  ): Promise<number[]> => {
    return apiClient.get<number[]>(`/classes/grades/${grade}/sections`, signal);
  },

  create: (
    dto: SchoolClassWriteDto,
    signal?: AbortSignal,
  ): Promise<SchoolClassReadDto> => {
    return apiClient.post<SchoolClassReadDto, SchoolClassWriteDto>(
      "/classes",
      dto,
      signal,
    );
  },

  update: (
    id: number,
    dto: SchoolClassWriteDto,
    signal?: AbortSignal,
  ): Promise<SchoolClassReadDto> => {
    return apiClient.put<SchoolClassReadDto, SchoolClassWriteDto>(
      `/classes/${id}`,
      dto,
      signal,
    );
  },

  delete: (id: number, signal?: AbortSignal): Promise<void> => {
    return apiClient.delete<void>(`/classes/${id}`, signal);
  },
};
