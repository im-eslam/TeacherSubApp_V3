import { apiClient } from "../../lib/apiClient";
import type { EventKeyReadDto, EventKeyWriteDto, EventKeyQuery } from "./types";

function buildQueryString(query: EventKeyQuery): string {
  const params = new URLSearchParams();

  if (query.eventName && query.eventName.trim() !== "") {
    params.set("eventName", query.eventName.trim());
  }

  if (query.isSupport !== undefined) {
    params.set("isSupport", String(query.isSupport));
  }

  if (query.isStandby !== undefined) {
    params.set("isStandby", String(query.isStandby));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const eventKeysApi = {
  getAll: (
    query: EventKeyQuery = {},
    signal?: AbortSignal,
  ): Promise<EventKeyReadDto[]> => {
    return apiClient.get<EventKeyReadDto[]>(
      `/events${buildQueryString(query)}`,
      signal,
    );
  },

  getById: (id: number, signal?: AbortSignal): Promise<EventKeyReadDto> => {
    return apiClient.get<EventKeyReadDto>(`/event-keys/${id}`, signal);
  },

  create: (
    dto: EventKeyWriteDto,
    signal?: AbortSignal,
  ): Promise<EventKeyReadDto> => {
    return apiClient.post<EventKeyReadDto, EventKeyWriteDto>(
      "/events",
      dto,
      signal,
    );
  },

  update: (
    id: number,
    dto: EventKeyWriteDto,
    signal?: AbortSignal,
  ): Promise<EventKeyReadDto> => {
    return apiClient.put<EventKeyReadDto, EventKeyWriteDto>(
      `/events/${id}`,
      dto,
      signal,
    );
  },

  delete: (id: number, signal?: AbortSignal): Promise<void> => {
    return apiClient.delete<void>(`/events/${id}`, signal);
  },
};
