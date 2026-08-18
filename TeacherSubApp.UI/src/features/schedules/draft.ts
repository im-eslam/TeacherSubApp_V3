import type {
  DraftRow,
  DraftRowMap,
  NewDraftRow,
  WeeklyScheduleBulkUpdateDto,
} from "./types";

export function draftKey(row: DraftRow | NewDraftRow): string {
  if (row.type === "add") {
    return `add:${row.teacherId}:${row.dayOfWeek}:${row.periodNumber}`;
  }

  if (row.type === "edit" || row.type === "delete") {
    return `slot:${row.slotId}`;
  }

  return `swap:${[row.slotIdA, row.slotIdB].sort((a, b) => a - b).join(":")}`;
}

export function affectedSlotIds(row: DraftRow): number[] {
  switch (row.type) {
    case "add":
      return [];
    case "edit":
    case "delete":
      return [row.slotId];
    case "swap":
      return [row.slotIdA, row.slotIdB];
  }
}

export function upsertDraftRow(
  current: DraftRowMap,
  row: DraftRow,
  replaceKey?: string,
): DraftRowMap {
  const key = draftKey(row);
  const next: DraftRowMap = { ...current };

  if (replaceKey && replaceKey !== key) {
    delete next[replaceKey];
  }

  const affected = new Set(affectedSlotIds(row));
  for (const [existingKey, existingRow] of Object.entries(current)) {
    if (existingKey === key || existingKey === replaceKey) continue;

    const conflictsBySlot = affectedSlotIds(existingRow).some((id) =>
      affected.has(id),
    );
    const conflictsByIdentity = existingKey === key;

    if (conflictsBySlot || conflictsByIdentity) {
      delete next[existingKey];
    }
  }

  next[key] = row;
  return next;
}

export function removeDraftRow(current: DraftRowMap, key: string): DraftRowMap {
  if (!(key in current)) return current;
  const next = { ...current };
  delete next[key];
  return next;
}

export function draftRowsToBulkDto(
  rows: Iterable<DraftRow>,
): WeeklyScheduleBulkUpdateDto {
  const dto: WeeklyScheduleBulkUpdateDto = {
    adds: [],
    edits: [],
    deletes: [],
    swaps: [],
  };

  for (const row of rows) {
    switch (row.type) {
      case "add":
        dto.adds.push({
          teacherId: row.teacherId,
          dayOfWeek: row.dayOfWeek,
          periodNumber: row.periodNumber,
          classId: row.content.classId,
          eventId: row.content.eventId,
        });
        break;
      case "edit":
        dto.edits.push({
          id: row.slotId,
          classId: row.content.classId,
          eventId: row.content.eventId,
        });
        break;
      case "delete":
        dto.deletes.push(row.slotId);
        break;
      case "swap":
        dto.swaps.push({
          scheduleIdA: row.slotIdA,
          scheduleIdB: row.slotIdB,
        });
        break;
    }
  }

  return dto;
}
