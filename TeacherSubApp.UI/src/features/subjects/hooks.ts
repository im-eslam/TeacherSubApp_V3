import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { SortOrder } from "../../components/controls/SortToggle";
import { useDelayedLoading } from "../../lib/useDelayedLoading";
import { subjectsApi } from "./api";
import type { SubjectReadDto, SubjectWriteDto } from "./types";

const subjectKeys = {
  all: ["subjects"] as const,
  list: () => [...subjectKeys.all, "list"] as const,
  detail: (id: number) => [...subjectKeys.all, "detail", id] as const,
};

export interface SubjectGridViewModel {
  subjects: SubjectReadDto[];
  isLoading: boolean;
  isAwaitingData: boolean;
  isError: boolean;
  searchQuery: string;
  onAdd: () => void;
  onEdit: (subject: SubjectReadDto) => void;
  onDelete: (subject: SubjectReadDto) => void;
}

export interface SubjectFilterViewModel {
  query: string;
  onQueryChange: (value: string) => void;
  sortOrder: SortOrder;
  onSortToggle: () => void;
  hasFilters: boolean;
  isDisabled: boolean;
  onClear: () => void;
}

export interface SubjectModalViewModel {
  createOpen: boolean;
  editOpen: boolean;
  deleteOpen: boolean;
  selectedSubject: SubjectReadDto | null;
  openCreate: () => void;
  closeCreate: () => void;
  openEdit: (subject: SubjectReadDto) => void;
  closeEdit: () => void;
  openDelete: (subject: SubjectReadDto) => void;
  closeDelete: () => void;
}

export interface SubjectMutationViewModel {
  create: (data: SubjectWriteDto) => Promise<void>;
  update: (id: number, data: SubjectWriteDto) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export interface SubjectPageViewModel {
  subjects: SubjectReadDto[];
  isDisabled: boolean;
  isError: boolean;
  error: unknown;
  retry: () => void;
  grid: SubjectGridViewModel;
  filters: SubjectFilterViewModel;
  modals: SubjectModalViewModel;
  mutations: SubjectMutationViewModel;
}

export function useSubjects() {
  return useQuery({
    queryKey: subjectKeys.list(),
    queryFn: ({ signal }) => subjectsApi.getAll({}, signal),
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

export function useSubjectsPage(): SubjectPageViewModel {
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] =
    useState<SubjectReadDto | null>(null);

  const {
    data: subjects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSubjects();
  const createMutation = useCreateSubject();
  const updateMutation = useUpdateSubject();
  const deleteMutation = useDeleteSubject();

  const displayedSubjects = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filteredSubjects = normalizedQuery
      ? subjects.filter((subject) =>
          subject.name.toLocaleLowerCase().includes(normalizedQuery),
        )
      : subjects;

    return [...filteredSubjects].sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name, "ar")
        : b.name.localeCompare(a.name, "ar"),
    );
  }, [query, sortOrder, subjects]);
  const showLoader = useDelayedLoading(isLoading, 200);
  const isAwaitingData = isLoading && subjects.length === 0;
  const isDisabled = isLoading;

  const openCreate = () => setCreateOpen(true);
  const closeCreate = () => setCreateOpen(false);
  const openEdit = (subject: SubjectReadDto) => {
    setSelectedSubject(subject);
    setEditOpen(true);
  };
  const closeEdit = () => {
    setEditOpen(false);
    setSelectedSubject(null);
  };
  const openDelete = (subject: SubjectReadDto) => {
    setSelectedSubject(subject);
    setDeleteOpen(true);
  };
  const closeDelete = () => {
    setDeleteOpen(false);
    setSelectedSubject(null);
  };

  const mutations: SubjectMutationViewModel = {
    create: async (data) => {
      await createMutation.mutateAsync(data);
      toast.success("تمت إضافة المادة بنجاح");
      closeCreate();
    },
    update: async (id, data) => {
      await updateMutation.mutateAsync({ id, dto: data });
      toast.success("تم حفظ التعديلات");
      closeEdit();
    },
    remove: async (id) => {
      await deleteMutation.mutateAsync(id);
      toast.success("تم حذف المادة");
      closeDelete();
    },
  };

  return {
    subjects,
    isDisabled,
    isError,
    error,
    retry: refetch,
    grid: {
      subjects: displayedSubjects,
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
      selectedSubject,
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
