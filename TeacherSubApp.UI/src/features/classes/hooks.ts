import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { SortDescriptor } from "react-aria-components/Table";
import type { SelectOption } from "../../components/controls/Select";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useDelayedLoading } from "../../lib/useDelayedLoading";
import { classesApi } from "./api";
import { ALL_VALUE, useClassesPageStore } from "./store";
import type { SchoolClassReadDto, SchoolClassWriteDto } from "./types";

const SEARCH_DEBOUNCE_MS = 150;

const classKeys = {
  all: ["classes"] as const,
  list: () => [...classKeys.all, "list"] as const,
  grades: () => [...classKeys.all, "grades"] as const,
  sections: (grade: number | null) =>
    [...classKeys.all, "sections", grade] as const,
  detail: (id: number) => [...classKeys.all, "detail", id] as const,
};

export interface ClassesGridViewModel {
  classes: SchoolClassReadDto[];
  isLoading: boolean;
  isAwaitingData: boolean;
  isError: boolean;
  searchQuery: string;
  isFiltered: boolean;
  sortDescriptor: SortDescriptor;
  onSortChange: (descriptor: SortDescriptor) => void;
  onAdd: () => void;
  onEdit: (schoolClass: SchoolClassReadDto) => void;
  onDelete: (schoolClass: SchoolClassReadDto) => void;
}

export interface ClassesFilterViewModel {
  query: string;
  onQueryChange: (value: string) => void;
  gradeFilter: string;
  onGradeFilterChange: (value: string) => void;
  sectionFilter: string;
  onSectionFilterChange: (value: string) => void;
  gradeOptions: SelectOption[];
  sectionOptions: SelectOption[];
  isSectionDisabled: boolean;
  isGradesLoading: boolean;
  isSectionsLoading: boolean;
  hasFilters: boolean;
  isDisabled: boolean;
  onClear: () => void;
}

export interface ClassesModalViewModel {
  createOpen: boolean;
  editOpen: boolean;
  deleteOpen: boolean;
  selectedClass: SchoolClassReadDto | null;
  openCreate: () => void;
  closeCreate: () => void;
  openEdit: (schoolClass: SchoolClassReadDto) => void;
  closeEdit: () => void;
  openDelete: (schoolClass: SchoolClassReadDto) => void;
  closeDelete: () => void;
}

export interface ClassesMutationViewModel {
  create: (data: SchoolClassWriteDto) => Promise<void>;
  update: (id: number, data: SchoolClassWriteDto) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export interface ClassesPageViewModel {
  isDisabled: boolean;
  isBlocked: boolean;
  isError: boolean;
  error: unknown;
  retry: () => void;
  grid: ClassesGridViewModel;
  filters: ClassesFilterViewModel;
  modals: ClassesModalViewModel;
  mutations: ClassesMutationViewModel;
}

export function useSchoolClasses() {
  return useQuery({
    queryKey: classKeys.list(),
    queryFn: ({ signal }) => classesApi.getAll({}, signal),
  });
}

export function useGrades() {
  return useQuery({
    queryKey: classKeys.grades(),
    queryFn: ({ signal }) => classesApi.getGrades(signal),
  });
}

export function useSectionsForGrade(grade: number | null) {
  return useQuery({
    queryKey: classKeys.sections(grade),
    queryFn: ({ signal }) => classesApi.getSectionsForGrade(grade!, signal),
    enabled: grade !== null,
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

export function useClassesPage(): ClassesPageViewModel {
  const {
    query,
    gradeFilter,
    sectionFilter,
    sortDescriptor,
    setQuery,
    setGradeFilter,
    setSectionFilter,
    setSortDescriptor,
    clearFilters,
    createOpen,
    editOpen,
    deleteOpen,
    selectedClass,
    openCreate,
    closeCreate,
    openEdit,
    closeEdit,
    openDelete,
    closeDelete,
  } = useClassesPageStore();

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  const selectedGrade = gradeFilter === ALL_VALUE ? null : Number(gradeFilter);
  const {
    data: classes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSchoolClasses();
  const { data: grades = [], isLoading: isGradesLoading } = useGrades();
  const { data: sections = [], isLoading: isSectionsLoading } =
    useSectionsForGrade(selectedGrade);
  const createMutation = useCreateSchoolClass();
  const updateMutation = useUpdateSchoolClass();
  const deleteMutation = useDeleteSchoolClass();

  const displayedClasses = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLocaleLowerCase();
    const key = String(
      sortDescriptor.column ?? "displayName",
    ) as keyof SchoolClassReadDto;
    const multiplier = sortDescriptor.direction === "ascending" ? 1 : -1;

    return classes
      .filter((schoolClass) => {
        if (
          normalizedQuery &&
          !schoolClass.displayName.toLocaleLowerCase().includes(normalizedQuery)
        ) {
          return false;
        }
        if (selectedGrade !== null && schoolClass.grade !== selectedGrade) {
          return false;
        }
        if (
          sectionFilter !== ALL_VALUE &&
          schoolClass.section !== Number(sectionFilter)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (key === "displayName") {
          return a.displayName.localeCompare(b.displayName, "ar") * multiplier;
        }

        const valueA = a[key];
        const valueB = b[key];
        if (valueA === null && valueB === null) return 0;
        if (valueA === null) return 1;
        if (valueB === null) return -1;
        return typeof valueA === "number" && typeof valueB === "number"
          ? (valueA - valueB) * multiplier
          : 0;
      });
  }, [classes, debouncedQuery, sectionFilter, selectedGrade, sortDescriptor]);

  const showLoader = useDelayedLoading(isLoading, 200);
  const isAwaitingData = isLoading && classes.length === 0;
  const isDisabled = isLoading;
  const isBlocked = isLoading || isError;
  const gradeOptions: SelectOption[] = [
    { value: ALL_VALUE, label: "كل الصفوف" },
    ...grades.map((grade) => ({
      value: String(grade),
      label: `الصف ${grade}`,
    })),
  ];
  const sectionOptions: SelectOption[] = [
    { value: ALL_VALUE, label: "كل الشعب" },
    ...sections.map((section) => ({
      value: String(section),
      label: `الشعبة ${section}`,
    })),
  ];

  const mutations: ClassesMutationViewModel = {
    create: async (data) => {
      await createMutation.mutateAsync(data);
      toast.success("تمت إضافة الفصل بنجاح");
      closeCreate();
    },
    update: async (id, data) => {
      await updateMutation.mutateAsync({ id, dto: data });
      toast.success("تم حفظ التعديلات");
      closeEdit();
    },
    remove: async (id) => {
      await deleteMutation.mutateAsync(id);
      toast.success("تم حذف الفصل");
      closeDelete();
    },
  };

  return {
    isDisabled,
    isBlocked,
    isError,
    error,
    retry: refetch,
    grid: {
      classes: displayedClasses,
      isLoading: showLoader,
      isAwaitingData,
      isError,
      searchQuery: query,
      isFiltered: gradeFilter !== ALL_VALUE || sectionFilter !== ALL_VALUE,
      sortDescriptor,
      onSortChange: setSortDescriptor,
      onAdd: openCreate,
      onEdit: openEdit,
      onDelete: openDelete,
    },
    filters: {
      query,
      onQueryChange: setQuery,
      gradeFilter,
      onGradeFilterChange: setGradeFilter,
      sectionFilter,
      onSectionFilterChange: setSectionFilter,
      gradeOptions,
      sectionOptions,
      isSectionDisabled: selectedGrade === null,
      isGradesLoading,
      isSectionsLoading,
      hasFilters:
        query.length > 0 ||
        gradeFilter !== ALL_VALUE ||
        sectionFilter !== ALL_VALUE,
      isDisabled: isBlocked,
      onClear: clearFilters,
    },
    modals: {
      createOpen,
      editOpen,
      deleteOpen,
      selectedClass,
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
