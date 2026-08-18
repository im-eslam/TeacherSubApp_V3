export interface EventKeyReadDto {
  id: number;
  eventName: string;
  isSupport: boolean;
  isStandby: boolean;
}

export interface EventKeyWriteDto {
  eventName: string;
  isSupport: boolean;
  isStandby: boolean;
}

export interface EventKeyQuery {
  eventName?: string;
  isSupport?: boolean;
  isStandby?: boolean;
}
