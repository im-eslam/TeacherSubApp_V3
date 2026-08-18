export interface TeacherReadDto {
  id: number;
  name: string;
  subjectId: number | null;
  isSupervisor: boolean;
  subjectName: string | null;
}

export interface TeacherWriteDto {
  name: string;
  subjectId: number | null;
  isSupervisor: boolean;
}

export interface TeacherQuery {
  name?: string;
  subjectId?: number;
  isSupervisor?: boolean;
}
