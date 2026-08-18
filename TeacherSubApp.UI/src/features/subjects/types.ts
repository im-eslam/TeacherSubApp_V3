export interface SubjectReadDto {
  id: number;
  name: string;
}

export interface SubjectWriteDto {
  name: string;
}

export interface SubjectQuery {
  name?: string;
}
