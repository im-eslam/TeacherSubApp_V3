import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { SortDescriptor } from "react-aria-components/Table";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useDelayedLoading } from "../../lib/useDelayedLoading";
import type { SelectOption } from "../../components/controls/Select";
import { useSubjects } from "../subjects/hooks";
import { teachersApi } from "./api";
import { ALL_VALUE, useTeachersPageStore } from "./store";
import type { TeacherReadDto, TeacherWriteDto } from "./types";

type TeacherSubjectOption = { value: string; label: string };

const SEARCH_DEBOUNCE_MS = 150;
const SUPERVISOR_VALUE = "supervisor";
const TEACHER_VALUE = "teacher";

const ROLE_OPTIONS: SelectOption[] = [
  { value: ALL_VALUE, label: "كل الأدوار" },
  { value: SUPERVISOR_VALUE, label: "مشرفون فقط" },
  { value: TEACHER_VALUE, label: "معلمون فقط" },
];

const teacherKeys = {
  all: ["teachers"] as const,
  list: () => [...teacherKeys.all, "list"] as const,
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
  subjectOptions: TeacherSubjectOption[];
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
  isBlocked: boolean;
  isError: boolean;
  error: unknown;
  retry: () => void;
  grid: TeacherGridViewModel;
  filters: TeacherFilterViewModel;
  modals: TeacherModalViewModel;
  mutations: TeacherMutationViewModel;
}

export function useTeachers() {
  return useQuery({
    queryKey: teacherKeys.list(),
    queryFn: ({ signal }) => teachersApi.getAll({}, signal),
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
  const {
    query,
    subjectFilter,
    roleFilter,
    sortDescriptor,
    setQuery,
    setSubjectFilter,
    setRoleFilter,
    setSortDescriptor,
    clearFilters,
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
  } = useTeachersPageStore();

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  const {
    data: teachers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTeachers();
  const { data: subjects = [] } = useSubjects();
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const deleteMutation = useDeleteTeacher();

  const displayedTeachers = useMemo(() => {
    const q = debouncedQuery.trim().toLocaleLowerCase();
    const key = String(sortDescriptor.column ?? "name") as keyof TeacherReadDto;
    const multiplier = sortDescriptor.direction === "ascending" ? 1 : -1;

    return teachers.filter((teacher) => {
      if (q && !teacher.name.toLocaleLowerCase().includes(q)) return false;
      if (
        subjectFilter !== ALL_VALUE &&
        String(teacher.subjectId) !== subjectFilter
      ) {
        return false;
      }
      if (roleFilter === SUPERVISOR_VALUE && !teacher.isSupervisor) return false;
      if (roleFilter === TEACHER_VALUE && teacher.isSupervisor) return false;
      return true;
    }).sort((a, b) => {
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
  }, [debouncedQuery, roleFilter, sortDescriptor, subjectFilter, teachers]);

  const showLoader = useDelayedLoading(isLoading, 200);
  const isAwaitingData = isLoading && teachers.length === 0;
  const isDisabled = isLoading;
  const isBlocked = isLoading || isError;
  const subjectOptions: TeacherSubjectOption[] = [
    { value: ALL_VALUE, label: "كل المواد" },
    ...subjects.map((subject) => ({
      value: String(subject.id),
      label: subject.name,
    })),
  ];

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
    isBlocked,
    isError,
    error,
    retry: refetch,
    grid: {
      teachers: displayedTeachers,
      isLoading: showLoader,
      isAwaitingData,
      isError,
      searchQuery: query,
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
      isDisabled: isBlocked,
      onClear: clearFilters,
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