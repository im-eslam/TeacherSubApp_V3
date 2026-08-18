import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teachersApi } from "./api";
import type { TeacherReadDto, TeacherWriteDto } from "./types";

const teacherKeys = {
  all: ["teachers"] as const,
  list: () => [...teacherKeys.all, "list"] as const,
  detail: (id: number) => [...teacherKeys.all, "detail", id] as const,
};

export function useTeachers() {
  return useQuery({
    queryKey: teacherKeys.list(),
    queryFn: ({ signal }) => teachersApi.getAll(signal),
  });
}

export function useTeacher(id: number) {
  return useQuery({
    queryKey: teacherKeys.detail(id),
    queryFn: ({ signal }) => teachersApi.getById(id, signal),
    enabled: id > 0,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: TeacherWriteDto) => teachersApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all });
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: TeacherWriteDto }) =>
      teachersApi.update(id, dto),
    onSuccess: (updatedTeacher: TeacherReadDto) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all });
      queryClient.setQueryData(
        teacherKeys.detail(updatedTeacher.id),
        updatedTeacher,
      );
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => teachersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all });
    },
  });
}
