import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { SortOrder } from "../../components/controls/SortToggle";
import { useDelayedLoading } from "../../lib/useDelayedLoading";
import { eventKeysApi } from "./api";
import type {
  EventKeyReadDto,
  EventKeyWriteDto,
} from "./types";

const eventKeyKeys = {
  all: ["eventKeys"] as const,
  list: () => [...eventKeyKeys.all, "list"] as const,
  detail: (id: number) => [...eventKeyKeys.all, "detail", id] as const,
};

export interface EventGridViewModel {
  eventKeys: EventKeyReadDto[];
  isLoading: boolean;
  isAwaitingData: boolean;
  isError: boolean;
  searchQuery: string;
  onAdd: () => void;
  onEdit: (eventKey: EventKeyReadDto) => void;
  onDelete: (eventKey: EventKeyReadDto) => void;
}

export interface EventFilterViewModel {
  query: string;
  onQueryChange: (value: string) => void;
  sortOrder: SortOrder;
  onSortToggle: () => void;
  hasFilters: boolean;
  isDisabled: boolean;
  onClear: () => void;
}

export interface EventModalViewModel {
  createOpen: boolean;
  editOpen: boolean;
  deleteOpen: boolean;
  selectedEventKey: EventKeyReadDto | null;
  openCreate: () => void;
  closeCreate: () => void;
  openEdit: (eventKey: EventKeyReadDto) => void;
  closeEdit: () => void;
  openDelete: (eventKey: EventKeyReadDto) => void;
  closeDelete: () => void;
}

export interface EventMutationViewModel {
  create: (data: EventKeyWriteDto) => Promise<void>;
  update: (id: number, data: EventKeyWriteDto) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export interface EventPageViewModel {
  isDisabled: boolean;
  isError: boolean;
  error: unknown;
  retry: () => void;
  grid: EventGridViewModel;
  filters: EventFilterViewModel;
  modals: EventModalViewModel;
  mutations: EventMutationViewModel;
}

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

export function useEventsPage(): EventPageViewModel {
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEventKey, setSelectedEventKey] =
    useState<EventKeyReadDto | null>(null);

  const {
    data: eventKeys = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useEventKeys();
  const createMutation = useCreateEventKey();
  const updateMutation = useUpdateEventKey();
  const deleteMutation = useDeleteEventKey();

  const displayedEventKeys = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filteredEventKeys = normalizedQuery
      ? eventKeys.filter((eventKey) =>
          eventKey.eventName.toLocaleLowerCase().includes(normalizedQuery),
        )
      : eventKeys;

    return [...filteredEventKeys].sort((a, b) =>
      sortOrder === "asc"
        ? a.eventName.localeCompare(b.eventName, "ar")
        : b.eventName.localeCompare(a.eventName, "ar"),
    );
  }, [eventKeys, query, sortOrder]);
  const showLoader = useDelayedLoading(isLoading, 200);
  const isAwaitingData = isLoading && eventKeys.length === 0;
  const isDisabled = isLoading;

  const openCreate = () => setCreateOpen(true);
  const closeCreate = () => setCreateOpen(false);
  const openEdit = (eventKey: EventKeyReadDto) => {
    setSelectedEventKey(eventKey);
    setEditOpen(true);
  };
  const closeEdit = () => {
    setEditOpen(false);
    setSelectedEventKey(null);
  };
  const openDelete = (eventKey: EventKeyReadDto) => {
    setSelectedEventKey(eventKey);
    setDeleteOpen(true);
  };
  const closeDelete = () => {
    setDeleteOpen(false);
    setSelectedEventKey(null);
  };

  const mutations: EventMutationViewModel = {
    create: async (data) => {
      await createMutation.mutateAsync(data);
      toast.success("تمت إضافة الحدث بنجاح");
      closeCreate();
    },
    update: async (id, data) => {
      await updateMutation.mutateAsync({ id, dto: data });
      toast.success("تم حفظ التعديلات");
      closeEdit();
    },
    remove: async (id) => {
      await deleteMutation.mutateAsync(id);
      toast.success("تم حذف الحدث");
      closeDelete();
    },
  };

  return {
    isDisabled,
    isError,
    error,
    retry: refetch,
    grid: {
      eventKeys: displayedEventKeys,
      isLoading: showLoader,
      isAwaitingData,
      isError,
      searchQuery: query,
      onAdd: openCreate,
      onEdit: openEdit,
      onDelete: openDelete,
    },
    filters: {
      query,
      onQueryChange: setQuery,
      sortOrder,
      onSortToggle: () =>
        setSortOrder((current) => (current === "asc" ? "desc" : "asc")),
      hasFilters: query.length > 0 || sortOrder !== "asc",
      isDisabled,
      onClear: () => {
        setQuery("");
        setSortOrder("asc");
      },
    },
    modals: {
      createOpen,
      editOpen,
      deleteOpen,
      selectedEventKey,
      openCreate,
      closeCreate,
      openEdit,
      closeEdit,
      openDelete,
      closeDelete,
    },
    mutations,
  };
}
