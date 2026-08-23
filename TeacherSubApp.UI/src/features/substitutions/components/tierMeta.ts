import type { CandidateTier, TierMeta } from "../types";

export const TIER_META: Record<CandidateTier, TierMeta> = {
  1: {
    tier: 1,
    label: "الأفضل تطابقاً",
    sublabel: "متفرغ الأن",
    group: "best",
  },
  2: {
    tier: 2,
    label: "متاح بأجر إضافي",
    sublabel: "يحتاج تعويض ساعات إضافية",
    group: "acceptable",
  },
  3: {
    tier: 3,
    label: "معلم دعم",
    sublabel: "تدريس مشترك بالحصة",
    group: "acceptable",
  },
  4: {
    tier: 4,
    label: "في اجتماع",
    sublabel: "غير متفرغ حالياً",
    group: "lastResort",
  },
  5: {
    tier: 5,
    label: "من فريق الإشراف",
    sublabel: "مشرف وليس معلم مادة",
    group: "lastResort",
  },
};

export const TIER_GROUP_STYLES = {
  best: {
    card: "border-emerald-200 bg-emerald-50/80 hover:border-emerald-400 hover:bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    avatar: "bg-emerald-100 text-emerald-700",
  },
  acceptable: {
    card: "border-amber-200 bg-amber-50/70 hover:border-amber-400 hover:bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    avatar: "bg-amber-100 text-amber-700",
  },
  lastResort: {
    card: "border-red-100 bg-red-50/40 text-neutral-600 hover:border-red-200 hover:bg-red-50",
    badge: "bg-red-100 text-red-600",
    avatar: "bg-red-100 text-red-600",
  },
} as const;

export const TIER_2_STYLES = {
  card: "border-amber-200 bg-amber-50/70 hover:border-amber-400 hover:bg-amber-50",
  badge: "bg-amber-100 text-amber-700",
  avatar: "bg-amber-100 text-amber-700",
} as const;

export const TIER_3_STYLES = {
  card: "border-blue-200 bg-blue-50/70 hover:border-blue-400 hover:bg-blue-50",
  badge: "bg-blue-100 text-blue-700",
  avatar: "bg-blue-100 text-blue-700",
} as const;

export function tierStyles(tier: CandidateTier) {
  const meta = TIER_META[tier];
  if (tier === 2) return TIER_2_STYLES;
  if (tier === 3) return TIER_3_STYLES;
  return TIER_GROUP_STYLES[meta.group];
}
