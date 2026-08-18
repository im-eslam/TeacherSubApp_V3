import { apiClient } from "../../lib/apiClient";
import type { TeacherReadDto, TeacherWriteDto } from "./types";

export const teachersApi = {
  getAll: (signal?: AbortSignal): Promise<TeacherReadDto[]> => {
    return apiClient.get<TeacherReadDto[]>("/teachers", signal);
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
