export interface TeacherAbsenceReadDto {
  id: number;
  teacherId: number;
  teacherName: string;
  absenceDate: string;
  reason: string | null;
}

export interface TeacherAbsenceWriteDto {
  teacherId: number;
  absenceDate: string;
  reason: string | null;
}

export interface WeeklyScheduleReadDto {
  id: number;
  teacherId: number;
  teacherName: string;
  subjectName: string | null;
  dayOfWeek: number;
  periodNumber: number;
  classId: number | null;
  classDisplayName: string | null;
  eventId: number | null;
  eventName: string | null;
}

export interface SubstitutionReadDto {
  id: number;
  absenceId: number;
  weeklyScheduleId: number;
  substituteTeacherId: number;
  serviceDate: string;
  isAlgorithmMatch: boolean;
  absentTeacherNameAtTimeOfService: string;
  absentTeacherSubjectAtTimeOfService: string;
  substituteTeacherNameAtTimeOfService: string;
  substituteTeacherSubjectAtTimeOfService: string;
  classNameAtTimeOfService: string;
  periodNumberAtTimeOfService: number;
}

export interface SubstitutionWriteDto {
  absenceId: number;
  weeklyScheduleId: number;
  substituteTeacherId: number;
  serviceDate: string;
  isAlgorithmMatch: boolean;
}

export type CandidateTier = 1 | 2 | 3 | 4 | 5;

export interface SubstituteCandidateDto {
  teacherId: number;
  teacherName: string;
  subjectName: string | null;
  tier: CandidateTier;
  totalScore: number;
}

export interface TeacherReadDto {
  id: number;
  name: string;
  subjectId: number | null;
  subjectName: string | null;
  isSupervisor: boolean;
}

export interface AbsenceQuery {
  fromDate?: string;
  toDate?: string;
  teacherId?: number;
}

export interface ScheduleQuery {
  teacherId?: number;
  classId?: number;
  eventId?: number;
  dayOfWeek?: number;
  periodNumber?: number;
}

export interface SubstitutionQuery {
  absenceId?: number;
  weeklyScheduleId?: number;
  substituteTeacherId?: number;
  fromDate?: string;
  toDate?: string;
  isAlgorithmMatch?: boolean;
}

export interface RecommendationQuery {
  absentTeacherId: number;
  serviceDate: string;
  periodNumber: number;
}

export interface TeacherQuery {
  name?: string;
  subjectId?: number;
}
