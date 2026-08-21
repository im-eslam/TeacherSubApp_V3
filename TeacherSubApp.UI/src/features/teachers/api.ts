import { apiClient } from "../../lib/apiClient";
import type { TeacherQuery, TeacherReadDto, TeacherWriteDto } from "./types";

export function buildQueryString(query: TeacherQuery): string {
  const params = new URLSearchParams();

  if (query.name && query.name.trim() !== "") {
    params.set("name", query.name.trim());
  }

  if (query.subjectId !== undefined) {
    params.set("subjectId", String(query.subjectId));
  }

  if (query.isSupervisor !== undefined) {
    params.set("isSupervisor", String(query.isSupervisor));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const teachersApi = {
  getAll: (
    query: TeacherQuery = {},
    signal?: AbortSignal,
  ): Promise<TeacherReadDto[]> => {
    return apiClient.get<TeacherReadDto[]>(
      `/teachers${buildQueryString(query)}`,
      signal,
    );
  },

  getById: (id: number, signal?: AbortSignal): Promise<TeacherReadDto> => {
    return apiClient.get<TeacherReadDto>(`/teachers/${id}`, signal);
  },

  create: (
    dto: TeacherWriteDto,
    signal?: AbortSignal,
  ): Promise<TeacherReadDto> => {
    return apiClient.post<TeacherReadDto, TeacherWriteDto>(
      "/teachers",
      dto,
      signal,
    );
  },

  update: (
    id: number,
    dto: TeacherWriteDto,
    signal?: AbortSignal,
  ): Promise<TeacherReadDto> => {
    return apiClient.put<TeacherReadDto, TeacherWriteDto>(
      `/teachers/${id}`,
      dto,
      signal,
    );
  },

  delete: (id: number, signal?: AbortSignal): Promise<void> => {
    return apiClient.delete<void>(`/teachers/${id}`, signal);
  },
};
