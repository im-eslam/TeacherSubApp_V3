import { create } from "zustand";
import { getTodayIsoDate } from "./dateUtils";
import type { SlotContext } from "./types";

// ════════════════════════════════════════════════════════════
// substitutions store
// ════════════════════════════════════════════════════════════
// Holds ONLY client-side UI state for the Command Center page:
//   - which date is currently being viewed ("activeDate")
//   - whether the Log Absence modal is open
//   - which slot (if any) the Recommendation modal is open for
//
// All server data (absences, schedules, substitutions, candidates)
// lives in TanStack Query — see hooks.ts. Keeping the two strictly
// separated is what lets the "jump to date X after logging an
// absence" fix be a single `setActiveDate` call from a mutation
// callback, with no prop drilling.
// ════════════════════════════════════════════════════════════

interface SubstitutionsPageState {
  activeDate: string;

  isLogAbsenceOpen: boolean;
  selectedSlotForSub: SlotContext | null;

  setActiveDate: (date: string) => void;

  openLogAbsence: () => void;
  closeLogAbsence: () => void;

  openRecommendation: (slot: SlotContext) => void;
  closeRecommendation: () => void;
}

export const useSubstitutionsPageStore = create<SubstitutionsPageState>(
  (set) => ({
    activeDate: getTodayIsoDate(),

    isLogAbsenceOpen: false,
    selectedSlotForSub: null,

    setActiveDate: (activeDate) => set({ activeDate }),

    openLogAbsence: () => set({ isLogAbsenceOpen: true }),
    closeLogAbsence: () => set({ isLogAbsenceOpen: false }),

    openRecommendation: (slot) => set({ selectedSlotForSub: slot }),
    closeRecommendation: () => set({ selectedSlotForSub: null }),
  }),
);
