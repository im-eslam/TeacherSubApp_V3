import { apiClient } from "../../lib/apiClient";
import type {
  AbsenceQuery,
  RecommendationQuery,
  ScheduleQuery,
  SubstituteCandidateDto,
  SubstitutionQuery,
  SubstitutionReadDto,
  SubstitutionWriteDto,
  TeacherAbsenceReadDto,
  TeacherAbsenceWriteDto,
  TeacherQuery,
  TeacherReadDto,
  WeeklyScheduleReadDto,
} from "./types";

function buildQueryString(query: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const substitutionsApi = {
  getAbsences: (
    query: AbsenceQuery,
    signal?: AbortSignal,
  ): Promise<TeacherAbsenceReadDto[]> =>
    apiClient.get<TeacherAbsenceReadDto[]>(
      `/absences${buildQueryString({
        TeacherId: query.teacherId,
        FromDate: query.fromDate,
        ToDate: query.toDate,
      })}`,
      signal,
    ),

  createAbsence: (
    dto: TeacherAbsenceWriteDto,
    signal?: AbortSignal,
  ): Promise<TeacherAbsenceReadDto> =>
    apiClient.post<TeacherAbsenceReadDto, TeacherAbsenceWriteDto>(
      "/absences",
      dto,
      signal,
    ),

  deleteAbsence: (id: number, signal?: AbortSignal): Promise<void> =>
    apiClient.delete<void>(`/absences/${id}`, signal),

  getTeachers: (
    query: TeacherQuery = {},
    signal?: AbortSignal,
  ): Promise<TeacherReadDto[]> =>
    apiClient.get<TeacherReadDto[]>(
      `/teachers${buildQueryString({
        Name: query.name,
        SubjectId: query.subjectId,
      })}`,
      signal,
    ),

  getSchedules: (
    query: ScheduleQuery,
    signal?: AbortSignal,
  ): Promise<WeeklyScheduleReadDto[]> =>
    apiClient.get<WeeklyScheduleReadDto[]>(
      `/schedules${buildQueryString({
        TeacherId: query.teacherId,
        ClassId: query.classId,
        EventId: query.eventId,
        DayOfWeek: query.dayOfWeek,
        PeriodNumber: query.periodNumber,
      })}`,
      signal,
    ),

  getSubstitutions: (
    query: SubstitutionQuery,
    signal?: AbortSignal,
  ): Promise<SubstitutionReadDto[]> =>
    apiClient.get<SubstitutionReadDto[]>(
      `/substitutions${buildQueryString({
        AbsenceId: query.absenceId,
        WeeklyScheduleId: query.weeklyScheduleId,
        SubstituteTeacherId: query.substituteTeacherId,
        FromDate: query.fromDate,
        ToDate: query.toDate,
        IsAlgorithmMatch: query.isAlgorithmMatch,
      })}`,
      signal,
    ),

  getRecommendations: (
    query: RecommendationQuery,
    signal?: AbortSignal,
  ): Promise<SubstituteCandidateDto[]> =>
    apiClient.get<SubstituteCandidateDto[]>(
      `/recommendations/recommendations${buildQueryString({
        AbsentTeacherId: query.absentTeacherId,
        ServiceDate: query.serviceDate,
        PeriodNumber: query.periodNumber,
      })}`,
      signal,
    ),

  createSubstitution: (
    dto: SubstitutionWriteDto,
    signal?: AbortSignal,
  ): Promise<SubstitutionReadDto> =>
    apiClient.post<SubstitutionReadDto, SubstitutionWriteDto>(
      "/substitutions",
      dto,
      signal,
    ),

  updateSubstitution: (
    id: number,
    dto: SubstitutionWriteDto,
    signal?: AbortSignal,
  ): Promise<SubstitutionReadDto> =>
    apiClient.put<SubstitutionReadDto, SubstitutionWriteDto>(
      `/substitutions/${id}`,
      dto,
      signal,
    ),

  deleteSubstitution: (id: number, signal?: AbortSignal): Promise<void> =>
    apiClient.delete<void>(`/substitutions/${id}`, signal),
};
