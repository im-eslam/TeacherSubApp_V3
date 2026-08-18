import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { weeklySchedulesApi } from "./api";
import {
  draftKey,
  draftRowsToBulkDto,
  removeDraftRow,
  upsertDraftRow,
} from "./draft";
import type {
  DraftRow,
  DraftRowMap,
  NewDraftRow,
  NewDraftRowAdd,
  NewDraftRowDelete,
  NewDraftRowEdit,
  NewDraftRowSwap,
  WeeklyScheduleQuery,
} from "./types";

const weeklyScheduleKeys = {
  all: ["weeklySchedules"] as const,
  grid: (query: WeeklyScheduleQuery) =>
    [...weeklyScheduleKeys.all, "grid", query] as const,
};

export function useWeeklyScheduleGrid(
  query: WeeklyScheduleQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: weeklyScheduleKeys.grid(query),
    queryFn: ({ signal }) => weeklySchedulesApi.getGrid(query, signal),
    enabled: options?.enabled ?? true,
  });
}

export function useAllWeeklySchedules(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: weeklyScheduleKeys.grid({}),
    queryFn: ({ signal }) => weeklySchedulesApi.getGrid({}, signal),
    enabled: options?.enabled ?? true,
  });
}

export function useBulkUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: Parameters<typeof weeklySchedulesApi.bulkUpdate>[0]) =>
      weeklySchedulesApi.bulkUpdate(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weeklyScheduleKeys.all });
    },
  });
}

export function useWeeklyScheduleDraft() {
  const [rows, setRows] = useState<DraftRowMap>({});

  const stage = useCallback((row: NewDraftRow, replaceKey?: string) => {
    const fullRow: DraftRow = { ...row, key: draftKey(row) } as DraftRow;
    setRows((current) => upsertDraftRow(current, fullRow, replaceKey));
    return fullRow.key;
  }, []);

  const stageAdd = useCallback(
    (row: NewDraftRowAdd, options?: { replaceKey?: string }) =>
      stage(row, options?.replaceKey),
    [stage],
  );

  const stageEdit = useCallback(
    (row: NewDraftRowEdit, options?: { replaceKey?: string }) =>
      stage(row, options?.replaceKey),
    [stage],
  );

  const stageDelete = useCallback(
    (row: NewDraftRowDelete, options?: { replaceKey?: string }) =>
      stage(row, options?.replaceKey),
    [stage],
  );

  const stageSwap = useCallback(
    (row: NewDraftRowSwap, options?: { replaceKey?: string }) =>
      stage(row, options?.replaceKey),
    [stage],
  );

  const removeRow = useCallback((key: string) => {
    setRows((current) => removeDraftRow(current, key));
  }, []);

  const reset = useCallback(() => setRows({}), []);
  const rowList = useMemo(() => Object.values(rows), [rows]);
  const toBulkDto = useCallback(() => draftRowsToBulkDto(rowList), [rowList]);

  return {
    rows,
    rowList,
    isEmpty: rowList.length === 0,
    dirtyCount: rowList.length,
    stageAdd,
    stageEdit,
    stageDelete,
    stageSwap,
    removeRow,
    reset,
    toBulkDto,
  };
}

export type WeeklyScheduleDraft = ReturnType<typeof useWeeklyScheduleDraft>;
