export interface DailyCoverageSlotDto {
  periodNumber: number;
  classId: number | null;
  classDisplayName: string | null;
  isCovered: boolean;
  substitutionId: number | null;
  substituteTeacherId: number | null;
  substituteTeacherName: string | null;
  isAlgorithmMatch: boolean | null;
}

export interface DailyAbsenceEntryDto {
  absenceId: number;
  teacherId: number;
  teacherName: string | null;
  subjectName: string | null;
  reason: string | null;
  slotsFreed: number;
  slotsCovered: number;
  uncoveredSlots: number;
  slots: DailyCoverageSlotDto[] | null;
}

export interface DailyReportDto {
  date: string;
  totalAbsences: number;
  totalSlotsFreed: number;
  totalSlotsCovered: number;
  totalUncoveredSlots: number;
  absences: DailyAbsenceEntryDto[] | null;
}

export interface TeacherAbsenceHistoryEntryDto {
  absenceId: number;
  absenceDate: string;
  reason: string | null;
  slotsFreed: number;
  slotsCovered: number;
  uncoveredSlots: number;
  slots: DailyCoverageSlotDto[] | null;
}

export interface TeacherAbsenceHistoryDto {
  teacherId: number;
  teacherName: string | null;
  subjectName: string | null;
  fromDate: string;
  toDate: string;
  totalAbsenceDays: number;
  totalSlotsFreed: number;
  totalSlotsCovered: number;
  totalUncoveredSlots: number;
  entries: TeacherAbsenceHistoryEntryDto[] | null;
}

export interface WeeklyLoadBucketDto {
  weekStart: string;
  weekEnd: string;
  baseWeeklyLoad: number;
  slotsLostToAbsence: number;
  slotsGainedSubstituting: number;
  netActualLoad: number;
  absenceDaysInWeek: number;
  substitutionsInWeek: number;
}

export interface TeacherWeeklyLoadReportDto {
  teacherId: number;
  teacherName: string | null;
  subjectName: string | null;
  baseWeeklyLoad: number;
  fromDate: string;
  toDate: string;
  weeks: WeeklyLoadBucketDto[] | null;
}

export interface TeacherAnalysisDto {
  teacherId: number;
  teacherName: string | null;
  subjectName: string | null;
  isSupervisor: boolean;
  fromDate: string;
  toDate: string;
  totalAbsenceDays: number;
  totalSlotsFreedByAbsence: number;
  totalSlotsCoveredForThisTeacher: number;
  totalUncoveredSlots: number;
  absenceCoverageRate: number;
  totalTimesSubstituted: number;
  totalDaysSubstituted: number;
  algorithmMatchRate: number;
  baseWeeklyLoad: number;
  averageActualWeeklyLoad: number;
  absenceDaysRankAmongAllTeachers: number | null;
  substitutionsRankAmongAllTeachers: number | null;
}

export interface DailyTrendPointDto {
  date: string;
  absenceCount: number;
  slotsFreed: number;
  slotsCovered: number;
}

export interface TeacherRankingEntryDto {
  teacherId: number;
  teacherName: string | null;
  count: number;
}

export interface SystemAnalysisDto {
  fromDate: string;
  toDate: string;
  totalActiveTeachers: number;
  totalAbsenceDays: number;
  totalSlotsFreed: number;
  totalSlotsCovered: number;
  totalUncoveredSlots: number;
  overallCoverageRate: number;
  totalSubstitutionsMade: number;
  overallAlgorithmMatchRate: number;
  dailyTrend: DailyTrendPointDto[] | null;
  topAbsentTeachers: TeacherRankingEntryDto[] | null;
  topSubstitutingTeachers: TeacherRankingEntryDto[] | null;
}

export type ReportTab =
  | "daily"
  | "absence-history"
  | "weekly-load"
  | "teacher-analysis"
  | "system-analysis";

export interface ReportDateRange {
  from: string;
  to: string;
}

export interface ReportsPageState {
  activeTab: ReportTab;
  dailyDate: string;
  teacherId: string;
  teacherRange: ReportDateRange;
  systemRange: ReportDateRange;
  topCount: string;
}
