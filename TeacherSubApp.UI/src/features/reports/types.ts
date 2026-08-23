// ════════════════════════════════════════════════════════════
// Query params (mirror backend Dtos/DailyReportQuery.cs, TeacherReportQuery.cs)
// ════════════════════════════════════════════════════════════

export interface DailyReportQuery {
  date: string;
}

export interface TeacherReportQuery {
  teacherId: number;
  fromDate?: string;
  toDate?: string;
}

// ════════════════════════════════════════════════════════════
// Daily report (mirror backend Dtos/DailyReportReadDto.cs)
// ════════════════════════════════════════════════════════════

export interface SubstituteInfoDto {
  substitutionId: number;
  teacherId: number;
  teacherName: string;
  subjectName: string | null;
  isAlgorithmMatch: boolean;
}

export interface FreedSlotDto {
  weeklyScheduleId: number;
  periodNumber: number;
  classId: number | null;
  classDisplayName: string | null;
  isCovered: boolean;
  substitute: SubstituteInfoDto | null;
}

export interface AbsentTeacherDto {
  teacherId: number;
  teacherName: string;
  subjectName: string | null;
  reason: string | null;
  freedSlotsCount: number;
  coveredSlotsCount: number;
  freedSlots: FreedSlotDto[];
}

export interface DailyReportReadDto {
  date: string;
  absentTeachersCount: number;
  absentTeachers: AbsentTeacherDto[];
}

// ════════════════════════════════════════════════════════════
// Teacher report (mirror backend Dtos/TeacherReportReadDto.cs)
// ════════════════════════════════════════════════════════════

export interface TeacherAbsenceLedgerDto {
  absenceId: number;
  absenceDate: string;
  reason: string | null;
  freedSlotsCount: number;
  coveredSlotsCount: number;
}

export interface TeacherSubstitutionLedgerDto {
  substitutionId: number;
  serviceDate: string;
  periodNumber: number;
  classNameAtTimeOfService: string;
  absentTeacherNameAtTimeOfService: string;
  isAlgorithmMatch: boolean;
}

export interface TeacherLoadAnalysisDto {
  baseWeeklyLoad: number;
  actualWeeklyLoad: number;
  totalFreedSlots: number;
  totalCoveredSlots: number;
  absenceDaysCount: number;
}

export interface TeacherReportReadDto {
  teacherId: number;
  teacherName: string;
  subjectName: string | null;
  isSupervisor: boolean;
  fromDate: string | null;
  toDate: string | null;
  absences: TeacherAbsenceLedgerDto[];
  substitutions: TeacherSubstitutionLedgerDto[];
  analysis: TeacherLoadAnalysisDto;
}

// ════════════════════════════════════════════════════════════
// UI-only shapes
// ════════════════════════════════════════════════════════════

export type ReportView = "daily" | "teacher";
