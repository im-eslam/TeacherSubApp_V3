import { apiClient } from "../../lib/apiClient";
import type { SubjectReadDto, SubjectWriteDto } from "./types";

export const subjectsApi = {
  getAll: (signal?: AbortSignal): Promise<SubjectReadDto[]> => {
    return apiClient.get<SubjectReadDto[]>(`/subjects`, signal);
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
