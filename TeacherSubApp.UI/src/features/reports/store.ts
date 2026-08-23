import { create } from "zustand";
import { getTodayIsoDate } from "../substitutions/dateUtils";
import type { ReportView } from "./types";

// ════════════════════════════════════════════════════════════
// reports store
// ════════════════════════════════════════════════════════════
// Holds ONLY client-side UI state for the Reports page:
//   - which view is active ("daily" vs "teacher")
//   - the daily report's selected date
//   - the teacher report's selected teacher + optional date range
//
// All server data (the reports themselves) lives in TanStack Query —
// see hooks.ts. Kept separate so switching tabs never refetches data
// that's still cached and valid.
// ════════════════════════════════════════════════════════════

interface ReportsPageState {
  activeView: ReportView;
  setActiveView: (view: ReportView) => void;

  dailyDate: string;
  setDailyDate: (date: string) => void;

  teacherId: number | null;
  setTeacherId: (id: number | null) => void;

  teacherFromDate: string;
  setTeacherFromDate: (date: string) => void;

  teacherToDate: string;
  setTeacherToDate: (date: string) => void;

  clearTeacherRange: () => void;
}

export const useReportsPageStore = create<ReportsPageState>((set) => ({
  activeView: "daily",
  setActiveView: (activeView) => set({ activeView }),

  dailyDate: getTodayIsoDate(),
  setDailyDate: (dailyDate) => set({ dailyDate }),

  teacherId: null,
  setTeacherId: (teacherId) => set({ teacherId }),

  teacherFromDate: "",
  setTeacherFromDate: (teacherFromDate) => set({ teacherFromDate }),

  teacherToDate: "",
  setTeacherToDate: (teacherToDate) => set({ teacherToDate }),

  clearTeacherRange: () => set({ teacherFromDate: "", teacherToDate: "" }),
}));
