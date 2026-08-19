import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subjectsApi } from "./api";
import type { SubjectReadDto, SubjectWriteDto } from "./types";

const subjectKeys = {
  all: ["subjects"] as const,
  list: () => [...subjectKeys.all, "list"] as const,
  detail: (id: number) => [...subjectKeys.all, "detail", id] as const,
};

export function useSubjects() {
  return useQuery({
    queryKey: subjectKeys.list(),
    queryFn: ({ signal }) => subjectsApi.getAll(signal),
  });
}

export function useSubject(id: number) {
  return useQuery({
    queryKey: subjectKeys.detail(id),
    queryFn: ({ signal }) => subjectsApi.getById(id, signal),
    enabled: id > 0,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: SubjectWriteDto) => subjectsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: SubjectWriteDto }) =>
      subjectsApi.update(id, dto),
    onSuccess: (updatedSubject: SubjectReadDto) => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all });
      queryClient.setQueryData(
        subjectKeys.detail(updatedSubject.id),
        updatedSubject,
      );
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => subjectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all });
    },
  });
}
