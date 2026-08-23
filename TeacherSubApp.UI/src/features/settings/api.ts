import { apiClient } from "../../lib/apiClient";
import type { AlgorithmSettingsDto } from "./types";

export const settingsApi = {
  get: (signal?: AbortSignal): Promise<AlgorithmSettingsDto> =>
    apiClient.get<AlgorithmSettingsDto>("/recommendations/settings", signal),

  update: (
    dto: AlgorithmSettingsDto,
    signal?: AbortSignal,
  ): Promise<void> =>
    apiClient.put<void, AlgorithmSettingsDto>(
      "/recommendations/settings",
      dto,
      signal,
    ),
};
