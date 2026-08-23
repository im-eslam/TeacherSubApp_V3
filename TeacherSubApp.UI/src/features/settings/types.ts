export interface AlgorithmSettingsDto {
  subjectMatchWeight: number;
  weeklyLoadWeight: number;
  dailyLoadWeight: number;
  standbyWeight: number;
  subbedYesterdayWeight: number;
  consecutiveClassWeight: number;
  earlyLeaveWeight: number;
  overtimeThreshold: number;
  lowLoadThreshold: number;
  dailyLoadThreshold: number;
  restPeriodBreak: number;
}

export type WeightField =
  | "subjectMatchWeight"
  | "weeklyLoadWeight"
  | "dailyLoadWeight"
  | "standbyWeight"
  | "subbedYesterdayWeight"
  | "consecutiveClassWeight"
  | "earlyLeaveWeight";

export type ThresholdField =
  | "overtimeThreshold"
  | "lowLoadThreshold"
  | "dailyLoadThreshold"
  | "restPeriodBreak";

export type SettingsField = WeightField | ThresholdField;

export const SETTINGS_LIMITS: Record<SettingsField, { min: number; max: number; step: string }> = {
  subjectMatchWeight: { min: 0, max: 100, step: "0.01" },
  weeklyLoadWeight: { min: 0, max: 100, step: "0.01" },
  dailyLoadWeight: { min: 0, max: 100, step: "0.01" },
  standbyWeight: { min: 0, max: 100, step: "0.01" },
  subbedYesterdayWeight: { min: 0, max: 100, step: "0.01" },
  consecutiveClassWeight: { min: 0, max: 100, step: "0.01" },
  earlyLeaveWeight: { min: 0, max: 100, step: "0.01" },
  overtimeThreshold: { min: 1, max: 40, step: "1" },
  lowLoadThreshold: { min: 0, max: 20, step: "1" },
  dailyLoadThreshold: { min: 1, max: 12, step: "1" },
  restPeriodBreak: { min: 1, max: 7, step: "1" },
};

export const WEIGHT_FIELDS: readonly WeightField[] = [
  "subjectMatchWeight",
  "weeklyLoadWeight",
  "dailyLoadWeight",
  "standbyWeight",
  "subbedYesterdayWeight",
  "consecutiveClassWeight",
  "earlyLeaveWeight",
];

export const THRESHOLD_FIELDS: readonly ThresholdField[] = [
  "overtimeThreshold",
  "lowLoadThreshold",
  "dailyLoadThreshold",
  "restPeriodBreak",
];

export function sumWeights(settings: AlgorithmSettingsDto): number {
  return WEIGHT_FIELDS.reduce((total, field) => total + settings[field], 0);
}
