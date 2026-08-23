import { create } from "zustand";
import { getTodayIsoDate } from "../substitutions/dateUtils";
import { getCurrentWeekRange } from "./utils";
import type { ReportDateRange, ReportTab } from "./types";

interface ReportsPageState {
  activeTab: ReportTab;
  dailyDate: string;
  teacherId: string;
  teacherRange: ReportDateRange;
  systemRange: ReportDateRange;
  topCount: string;
  setActiveTab: (tab: ReportTab) => void;
  setDailyDate: (date: string) => void;
  setTeacherId: (teacherId: string) => void;
  setTeacherRange: (range: ReportDateRange) => void;
  setSystemRange: (range: ReportDateRange) => void;
  setTopCount: (topCount: string) => void;
}

const defaultRange = getCurrentWeekRange();

export const useReportsPageStore = create<ReportsPageState>((set) => ({
  activeTab: "daily",
  dailyDate: getTodayIsoDate(),
  teacherId: "",
  teacherRange: defaultRange,
  systemRange: defaultRange,
  topCount: "10",
  setActiveTab: (activeTab) => set({ activeTab }),
  setDailyDate: (dailyDate) => set({ dailyDate }),
  setTeacherId: (teacherId) => set({ teacherId }),
  setTeacherRange: (teacherRange) => set({ teacherRange }),
  setSystemRange: (systemRange) => set({ systemRange }),
  setTopCount: (topCount) => set({ topCount }),
}));
