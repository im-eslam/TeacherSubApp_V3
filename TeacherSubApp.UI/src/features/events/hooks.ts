import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventKeysApi } from "./api";
import type { EventKeyReadDto, EventKeyWriteDto } from "./types";

const eventKeyKeys = {
  all: ["eventKeys"] as const,
  list: () => [...eventKeyKeys.all, "list"] as const,
  detail: (id: number) => [...eventKeyKeys.all, "detail", id] as const,
};

export function useEventKeys() {
  return useQuery({
    queryKey: eventKeyKeys.list(),
    queryFn: ({ signal }) => eventKeysApi.getAll({}, signal),
  });
}

export function useEventKey(id: number) {
  return useQuery({
    queryKey: eventKeyKeys.detail(id),
    queryFn: ({ signal }) => eventKeysApi.getById(id, signal),
    enabled: id > 0,
  });
}

export function useCreateEventKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: EventKeyWriteDto) => eventKeysApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeyKeys.all });
    },
  });
}

export function useUpdateEventKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: EventKeyWriteDto }) =>
      eventKeysApi.update(id, dto),
    onSuccess: (updatedEventKey: EventKeyReadDto) => {
      queryClient.invalidateQueries({ queryKey: eventKeyKeys.all });
      queryClient.setQueryData(
        eventKeyKeys.detail(updatedEventKey.id),
        updatedEventKey,
      );
    },
  });
}

export function useDeleteEventKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => eventKeysApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeyKeys.all });
    },
  });
}
