import { apiClient } from "../../lib/apiClient";
import type { SchoolClassReadDto, SchoolClassWriteDto } from "./types";

export const classesApi = {
  getAll: (signal?: AbortSignal): Promise<SchoolClassReadDto[]> => {
    return apiClient.get<SchoolClassReadDto[]>("/classes", signal);
  },

  getById: (id: number, signal?: AbortSignal): Promise<SchoolClassReadDto> => {
    return apiClient.get<SchoolClassReadDto>(`/classes/${id}`, signal);
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
