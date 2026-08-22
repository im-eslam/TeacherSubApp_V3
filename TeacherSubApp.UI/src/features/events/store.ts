import { create } from "zustand";
import type { SortOrder } from "../../components/controls/SortToggle";
import type { EventKeyReadDto } from "./types";

interface EventsPageState {
  query: string;
  sortOrder: SortOrder;

  createOpen: boolean;
  editOpen: boolean;
  deleteOpen: boolean;
  selectedEventKey: EventKeyReadDto | null;

  setQuery: (query: string) => void;
  toggleSortOrder: () => void;
  clearFilters: () => void;

  openCreate: () => void;
  closeCreate: () => void;
  openEdit: (eventKey: EventKeyReadDto) => void;
  closeEdit: () => void;
  openDelete: (eventKey: EventKeyReadDto) => void;
  closeDelete: () => void;
}

const INITIAL_FILTERS = {
  query: "",
  sortOrder: "asc" as SortOrder,
};

export const useEventsPageStore = create<EventsPageState>((set) => ({
  ...INITIAL_FILTERS,

  createOpen: false,
  editOpen: false,
  deleteOpen: false,
  selectedEventKey: null,

  setQuery: (query) => set({ query }),
  toggleSortOrder: () =>
    set((state) => ({
      sortOrder: state.sortOrder === "asc" ? "desc" : "asc",
    })),
  clearFilters: () => set(INITIAL_FILTERS),

  openCreate: () => set({ createOpen: true }),
  closeCreate: () => set({ createOpen: false }),
  openEdit: (eventKey) => set({ editOpen: true, selectedEventKey: eventKey }),
  closeEdit: () => set({ editOpen: false, selectedEventKey: null }),
  openDelete: (eventKey) =>
    set({ deleteOpen: true, selectedEventKey: eventKey }),
  closeDelete: () => set({ deleteOpen: false, selectedEventKey: null }),
}));
