import { create } from "zustand";
import type { SortOrder } from "../../components/controls/SortToggle";
import type { SubjectReadDto } from "./types";

interface SubjectsPageState {
  query: string;
  sortOrder: SortOrder;

  createOpen: boolean;
  editOpen: boolean;
  deleteOpen: boolean;
  selectedSubject: SubjectReadDto | null;

  setQuery: (query: string) => void;
  toggleSortOrder: () => void;
  clearFilters: () => void;

  openCreate: () => void;
  closeCreate: () => void;
  openEdit: (subject: SubjectReadDto) => void;
  closeEdit: () => void;
  openDelete: (subject: SubjectReadDto) => void;
  closeDelete: () => void;
}

const INITIAL_FILTERS = {
  query: "",
  sortOrder: "asc" as SortOrder,
};

export const useSubjectsPageStore = create<SubjectsPageState>((set) => ({
  ...INITIAL_FILTERS,

  createOpen: false,
  editOpen: false,
  deleteOpen: false,
  selectedSubject: null,

  setQuery: (query) => set({ query }),
  toggleSortOrder: () =>
    set((state) => ({
      sortOrder: state.sortOrder === "asc" ? "desc" : "asc",
    })),
  clearFilters: () => set(INITIAL_FILTERS),

  openCreate: () => set({ createOpen: true }),
  closeCreate: () => set({ createOpen: false }),
  openEdit: (subject) => set({ editOpen: true, selectedSubject: subject }),
  closeEdit: () => set({ editOpen: false, selectedSubject: null }),
  openDelete: (subject) => set({ deleteOpen: true, selectedSubject: subject }),
  closeDelete: () => set({ deleteOpen: false, selectedSubject: null }),
}));
