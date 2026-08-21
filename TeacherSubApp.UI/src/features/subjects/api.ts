import { apiClient } from "../../lib/apiClient";
import type { SubjectQuery, SubjectReadDto, SubjectWriteDto } from "./types";

export function buildQueryString(query: SubjectQuery): string {
  const params = new URLSearchParams();

  if (query.name && query.name.trim() !== "") {
    params.set("name", query.name.trim());
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const subjectsApi = {
  getAll: (
    query: SubjectQuery = {},
    signal?: AbortSignal,
  ): Promise<SubjectReadDto[]> => {
    return apiClient.get<SubjectReadDto[]>(
      `/subjects${buildQueryString(query)}`,
      signal,
    );
  },

  getById: (id: number, signal?: AbortSignal): Promise<SubjectReadDto> => {
    return apiClient.get<SubjectReadDto>(`/subjects/${id}`, signal);
  },

  create: (
    dto: SubjectWriteDto,
    signal?: AbortSignal,
  ): Promise<SubjectReadDto> => {
    return apiClient.post<SubjectReadDto, SubjectWriteDto>(
      "/subjects",
      dto,
      signal,
    );
  },

  update: (
    id: number,
    dto: SubjectWriteDto,
    signal?: AbortSignal,
  ): Promise<SubjectReadDto> => {
    return apiClient.put<SubjectReadDto, SubjectWriteDto>(
      `/subjects/${id}`,
      dto,
      signal,
    );
  },

  delete: (id: number, signal?: AbortSignal): Promise<void> => {
    return apiClient.delete<void>(`/subjects/${id}`, signal);
  },
};
