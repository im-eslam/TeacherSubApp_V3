import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { settingsApi } from "./api";
import type { AlgorithmSettingsDto } from "./types";

const settingsKeys = {
  all: ["settings"] as const,
  algorithm: () => [...settingsKeys.all, "algorithm"] as const,
};

export function useAlgorithmSettings() {
  return useQuery({
    queryKey: settingsKeys.algorithm(),
    queryFn: ({ signal }) => settingsApi.get(signal),
  });
}

export function useUpdateAlgorithmSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: AlgorithmSettingsDto) => settingsApi.update(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsKeys.algorithm() });
    },
  });
}

export function useSettingsPage() {
  const settings = useAlgorithmSettings();
  const updateMutation = useUpdateAlgorithmSettings();

  const save = async (dto: AlgorithmSettingsDto) => {
    await updateMutation.mutateAsync(dto);
    toast.success("تم حفظ إعدادات خوارزمية الاستبدال");
  };

  return {
    settings: settings.data ?? null,
    isLoading: settings.isLoading,
    isError: settings.isError,
    error: settings.error,
    retry: settings.refetch,
    isSaving: updateMutation.isPending,
    saveError: updateMutation.error,
    save,
    resetSaveError: updateMutation.reset,
  };
}
