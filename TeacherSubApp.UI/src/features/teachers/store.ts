import { create } from "zustand";
import type { SortDescriptor } from "react-aria-components/Table";
import type { TeacherReadDto } from "./types";

export const ALL_VALUE = "all";

interface TeachersPageState {
  query: string;
  subjectFilter: string;
  roleFilter: string;
  sortDescriptor: SortDescriptor;

  createOpen: boolean;
  editOpen: boolean;
  deleteOpen: boolean;
  selectedTeacher: TeacherReadDto | null;

  setQuery: (query: string) => void;
  setSubjectFilter: (subject: string) => void;
  setRoleFilter: (role: string) => void;
  setSortDescriptor: (descriptor: SortDescriptor) => void;
  clearFilters: () => void;

  openCreate: () => void;
  closeCreate: () => void;
  openEdit: (teacher: TeacherReadDto) => void;
  closeEdit: () => void;
  openDelete: (teacher: TeacherReadDto) => void;
  closeDelete: () => void;
}

const INITIAL_FILTERS = {
  query: "",
  subjectFilter: ALL_VALUE,
  roleFilter: ALL_VALUE,
  sortDescriptor: {
    column: "subjectName",
    direction: "ascending",
  } as SortDescriptor,
};

export const useTeachersPageStore = create<TeachersPageState>((set) => ({
  ...INITIAL_FILTERS,

  createOpen: false,
  editOpen: false,
  deleteOpen: false,
  selectedTeacher: null,

  setQuery: (query) => set({ query }),
  setSubjectFilter: (subjectFilter) => set({ subjectFilter }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setSortDescriptor: (sortDescriptor) => set({ sortDescriptor }),
  clearFilters: () => set(INITIAL_FILTERS),

  openCreate: () => set({ createOpen: true }),
  closeCreate: () => set({ createOpen: false }),
  openEdit: (teacher) => set({ editOpen: true, selectedTeacher: teacher }),
  closeEdit: () => set({ editOpen: false, selectedTeacher: null }),
  openDelete: (teacher) => set({ deleteOpen: true, selectedTeacher: teacher }),
  closeDelete: () => set({ deleteOpen: false, selectedTeacher: null }),
}));
