import { create } from "zustand";
import type { ScheduleViewMode } from "./types";

interface SchedulePageState {
  viewMode: ScheduleViewMode;
  selectedId: string;

  setViewMode: (mode: ScheduleViewMode) => void;
  setSelectedId: (id: string) => void;
}

export const useSchedulePageStore = create<SchedulePageState>((set) => ({
  viewMode: "teacher",
  selectedId: "",

  // Strict isolation rule: switching view mode always resets the selection.
  setViewMode: (viewMode) => set({ viewMode, selectedId: "" }),
  setSelectedId: (selectedId) => set({ selectedId }),
}));
