import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classesApi } from "./api";
import type { SchoolClassReadDto, SchoolClassWriteDto } from "./types";

const classKeys = {
  all: ["classes"] as const,
  list: () => [...classKeys.all, "list"] as const,
  detail: (id: number) => [...classKeys.all, "detail", id] as const,
};

export function useSchoolClasses() {
  return useQuery({
    queryKey: classKeys.list(),
    queryFn: ({ signal }) => classesApi.getAll(signal),
  });
}

export function useSchoolClass(id: number) {
  return useQuery({
    queryKey: classKeys.detail(id),
    queryFn: ({ signal }) => classesApi.getById(id, signal),
    enabled: id > 0,
  });
}

export function useCreateSchoolClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: SchoolClassWriteDto) => classesApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}

export function useUpdateSchoolClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: SchoolClassWriteDto }) =>
      classesApi.update(id, dto),
    onSuccess: (updatedClass: SchoolClassReadDto) => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
      queryClient.setQueryData(classKeys.detail(updatedClass.id), updatedClass);
    },
  });
}

export function useDeleteSchoolClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => classesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}
