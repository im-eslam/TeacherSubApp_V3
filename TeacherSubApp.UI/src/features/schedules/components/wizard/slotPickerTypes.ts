// ════════════════════════════════════════════════════════════
// Shared SlotPicker value type + empty-state constant.
// ════════════════════════════════════════════════════════════

export interface SlotPickerValue {
  teacherId: string;
  dayOfWeek: string;
  periodNumber: string;
}

export const EMPTY_SLOT_PICKER: SlotPickerValue = {
  teacherId: "",
  dayOfWeek: "",
  periodNumber: "",
};
