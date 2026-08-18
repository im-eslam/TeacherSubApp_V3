export interface SchoolClassReadDto {
  id: number;
  grade: number | null;
  section: number | null;
  displayName: string;
}

export interface SchoolClassWriteDto {
  displayName: string;
  grade: number | null;
  section: number | null;
}

export interface SchoolClassQuery {
  displayName?: string;
  grade?: number;
  section?: number;
}
