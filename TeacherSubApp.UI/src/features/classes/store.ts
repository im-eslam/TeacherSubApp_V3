import { create } from "zustand";
import type { SortDescriptor } from "react-aria-components/Table";
import type { SchoolClassReadDto } from "./types";

export const ALL_VALUE = "all";

interface ClassesPageState {
  query: string;
  gradeFilter: string;
  sectionFilter: string;
  sortDescriptor: SortDescriptor;

  createOpen: boolean;
  editOpen: boolean;
  deleteOpen: boolean;
  selectedClass: SchoolClassReadDto | null;

  setQuery: (query: string) => void;
  setGradeFilter: (grade: string) => void;
  setSectionFilter: (section: string) => void;
  setSortDescriptor: (descriptor: SortDescriptor) => void;
  clearFilters: () => void;

  openCreate: () => void;
  closeCreate: () => void;
  openEdit: (schoolClass: SchoolClassReadDto) => void;
  closeEdit: () => void;
  openDelete: (schoolClass: SchoolClassReadDto) => void;
  closeDelete: () => void;
}

const INITIAL_FILTERS = {
  query: "",
  gradeFilter: ALL_VALUE,
  sectionFilter: ALL_VALUE,
  sortDescriptor: {
    column: "displayName",
    direction: "ascending",
  } as SortDescriptor,
};

export const useClassesPageStore = create<ClassesPageState>((set) => ({
  ...INITIAL_FILTERS,

  createOpen: false,
  editOpen: false,
  deleteOpen: false,
  selectedClass: null,

  setQuery: (query) => set({ query }),
  setGradeFilter: (gradeFilter) =>
    set({ gradeFilter, sectionFilter: ALL_VALUE }),
  setSectionFilter: (sectionFilter) => set({ sectionFilter }),
  setSortDescriptor: (sortDescriptor) => set({ sortDescriptor }),
  clearFilters: () => set(INITIAL_FILTERS),

  openCreate: () => set({ createOpen: true }),
  closeCreate: () => set({ createOpen: false }),
  openEdit: (schoolClass) =>
    set({ editOpen: true, selectedClass: schoolClass }),
  closeEdit: () => set({ editOpen: false, selectedClass: null }),
  openDelete: (schoolClass) =>
    set({ deleteOpen: true, selectedClass: schoolClass }),
  closeDelete: () => set({ deleteOpen: false, selectedClass: null }),
}));
