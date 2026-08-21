import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { SortDescriptor } from "react-aria-components/Table";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useDelayedLoading } from "../../lib/useDelayedLoading";
import type { SearchableSelectOption } from "../../components/controls/SearchableSelect";
import type { SelectOption } from "../../components/controls/Select";
import { useSubjects } from "../subjects/hooks";
import { teachersApi } from "./api";
import type { TeacherQuery, TeacherReadDto, TeacherWriteDto } from "./types";

const ALL_VALUE = "all";
const SUPERVISOR_VALUE = "supervisor";
const TEACHER_VALUE = "teacher";

const ROLE_OPTIONS: SelectOption[] = [
  { value: ALL_VALUE, label: "كل الأدوار" },
  { value: SUPERVISOR_VALUE, label: "مشرفون فقط" },
  { value: TEACHER_VALUE, label: "معلمون فقط" },
];

const teacherKeys = {
  all: ["teachers"] as const,
  list: (query: TeacherQuery) => [...teacherKeys.all, "list", query] as const,
  detail: (id: number) => [...teacherKeys.all, "detail", id] as const,
};

export interface TeacherGridViewModel {
  teachers: TeacherReadDto[];
  isLoading: boolean;
  isAwaitingData: boolean;
  isError: boolean;
  searchQuery: string;
  isFiltered: boolean;
  sortDescriptor: SortDescriptor;
  onSortChange: (descriptor: SortDescriptor) => void;
  onAdd: () => void;
  onEdit: (teacher: TeacherReadDto) => void;
  onDelete: (teacher: TeacherReadDto) => void;
}

export interface TeacherFilterViewModel {
  query: string;
  onQueryChange: (value: string) => void;
  subjectFilter: string;
  onSubjectFilterChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  subjectOptions: SearchableSelectOption[];
  roleOptions: SelectOption[];
  hasFilters: boolean;
  isDisabled: boolean;
  onClear: () => void;
}

export interface TeacherModalViewModel {
  createOpen: boolean;
  editOpen: boolean;
  deleteOpen: boolean;
  selectedTeacher: TeacherReadDto | null;
  openCreate: () => void;
  closeCreate: () => void;
  openEdit: (teacher: TeacherReadDto) => void;
  closeEdit: () => void;
  openDelete: (teacher: TeacherReadDto) => void;
  closeDelete: () => void;
}

export interface TeacherMutationViewModel {
  create: (data: TeacherWriteDto) => Promise<void>;
  update: (id: number, data: TeacherWriteDto) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export interface TeacherPageViewModel {
  subjects: Awaited<ReturnType<typeof useSubjects>>["data"] extends infer T
    ? T extends (infer U)[]
      ? U[]
      : never
    : never;
  isDisabled: boolean;
  isError: boolean;
  error: unknown;
  retry: () => void;
  grid: TeacherGridViewModel;
  filters: TeacherFilterViewModel;
  modals: TeacherModalViewModel;
  mutations: TeacherMutationViewModel;
}

export function useTeachers(query: TeacherQuery = {}) {
  return useQuery({
    queryKey: teacherKeys.list(query),
    queryFn: ({ signal }) => teachersApi.getAll(query, signal),
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

export function useTeachersPage(): TeacherPageViewModel {
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState(ALL_VALUE);
  const [roleFilter, setRoleFilter] = useState(ALL_VALUE);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] =
    useState<TeacherReadDto | null>(null);

  const debouncedQuery = useDebouncedValue(query, 250);
  const requestQuery = useMemo<TeacherQuery>(
    () => ({
      name: debouncedQuery.trim() || undefined,
      subjectId:
        subjectFilter === ALL_VALUE ? undefined : Number(subjectFilter),
      isSupervisor:
        roleFilter === SUPERVISOR_VALUE
          ? true
          : roleFilter === TEACHER_VALUE
            ? false
            : undefined,
    }),
    [debouncedQuery, roleFilter, subjectFilter],
  );

  const {
    data: teachers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTeachers(requestQuery);
  const { data: subjects = [] } = useSubjects();
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const deleteMutation = useDeleteTeacher();

  const displayedTeachers = useMemo(() => {
    const key = String(sortDescriptor.column ?? "name") as keyof TeacherReadDto;
    const multiplier = sortDescriptor.direction === "ascending" ? 1 : -1;

    return [...teachers].sort((a, b) => {
      if (key === "isSupervisor") {
        return (
          (Number(a.isSupervisor) - Number(b.isSupervisor)) * multiplier
        );
      }

      const valueA = a[key] ?? "";
      const valueB = b[key] ?? "";
      return typeof valueA === "string" && typeof valueB === "string"
        ? valueA.localeCompare(valueB, "ar") * multiplier
        : 0;
    });
  }, [sortDescriptor, teachers]);

  const showLoader = useDelayedLoading(isLoading, 200);
  const isAwaitingData = isLoading && teachers.length === 0;
  const isDisabled = isLoading;
  const subjectOptions: SearchableSelectOption[] = [
    { value: ALL_VALUE, label: "كل المواد" },
    ...subjects.map((subject) => ({
      value: String(subject.id),
      label: subject.name,
    })),
  ];

  const openCreate = () => setCreateOpen(true);
  const closeCreate = () => setCreateOpen(false);
  const openEdit = (teacher: TeacherReadDto) => {
    setSelectedTeacher(teacher);
    setEditOpen(true);
  };
  const closeEdit = () => {
    setEditOpen(false);
    setSelectedTeacher(null);
  };
  const openDelete = (teacher: TeacherReadDto) => {
    setSelectedTeacher(teacher);
    setDeleteOpen(true);
  };
  const closeDelete = () => {
    setDeleteOpen(false);
    setSelectedTeacher(null);
  };

  const mutations: TeacherMutationViewModel = {
    create: async (data) => {
      await createMutation.mutateAsync(data);
      toast.success("تمت إضافة المعلم بنجاح");
      closeCreate();
    },
    update: async (id, data) => {
      await updateMutation.mutateAsync({ id, dto: data });
      toast.success("تم حفظ التعديلات");
      closeEdit();
    },
    remove: async (id) => {
      await deleteMutation.mutateAsync(id);
      toast.success("تم حذف المعلم");
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
      teachers: displayedTeachers,
      isLoading: showLoader,
      isAwaitingData,
      isError,
      searchQuery: debouncedQuery,
      isFiltered: subjectFilter !== ALL_VALUE || roleFilter !== ALL_VALUE,
      sortDescriptor,
      onSortChange: setSortDescriptor,
      onAdd: openCreate,
      onEdit: openEdit,
      onDelete: openDelete,
    },
    filters: {
      query,
      onQueryChange: setQuery,
      subjectFilter,
      onSubjectFilterChange: setSubjectFilter,
      roleFilter,
      onRoleFilterChange: setRoleFilter,
      subjectOptions,
      roleOptions: ROLE_OPTIONS,
      hasFilters:
        query.length > 0 ||
        subjectFilter !== ALL_VALUE ||
        roleFilter !== ALL_VALUE,
      isDisabled,
      onClear: () => {
        setQuery("");
        setSubjectFilter(ALL_VALUE);
        setRoleFilter(ALL_VALUE);
      },
    },
    modals: {
      createOpen,
      editOpen,
      deleteOpen,
      selectedTeacher,
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
