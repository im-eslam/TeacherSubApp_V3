import type { ReactNode } from "react";
import {
  Switch,
  composeRenderProps,
  type SwitchProps,
} from "react-aria-components";

const STYLES = {
  card:
    "flex items-center gap-3 px-4 py-3.5 bg-neutral-100 rounded-xl " +
    "cursor-pointer hover:bg-neutral-200/70 transition-colors " +
    "duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] outline-none " +
    "focus-visible:ring-2 focus-visible:ring-blue-500/30",

  track:
    "relative shrink-0 w-9 h-[22px] rounded-full border " +
    "transition-colors duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] " +
    "outline-none",
  trackOff: "bg-neutral-300 border-neutral-300",

  handle:
    "absolute left-0.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full " +
    "bg-white transition-transform duration-200 " +
    "ease-[cubic-bezier(0.25,1,0.5,1)]",
  handleOn: "translate-x-[14px]",

  title: "text-sm font-medium text-neutral-800",
  titleHint: "font-normal text-neutral-400",
  description: "text-xs text-neutral-500 leading-relaxed",
};

const TINTS = {
  emerald: {
    icon: "text-emerald-600",
    track: "bg-emerald-600 border-emerald-600",
  },
  amber: { icon: "text-amber-600", track: "bg-amber-600 border-amber-600" },
  blue: { icon: "text-blue-600", track: "bg-blue-600 border-blue-600" },
} as const;

// ════════════════════════════════════════════════════════════
// ToggleCard
// ════════════════════════════════════════════════════════════
// Usage (inside a feature modal, e.g. EventKeyFlagsField):
//
//   <ToggleCard
//     icon={<ShieldCheck size={16} />}
//     tint="emerald"
//     title="حدث دعم"
//     titleHint="(حدث نشط واحد فقط)"
//     description="يسمح بدخول معلمَين لنفس الحصة في نفس الوقت..."
//     isSelected={isSupport}
//     onChange={(checked) => setIsSupport(checked)}
//   />
// ════════════════════════════════════════════════════════════

interface ToggleCardProps extends Omit<SwitchProps, "children"> {
  icon: ReactNode;
  tint: keyof typeof TINTS;
  title: string;
  titleHint?: string;
  description: string;
}

export function ToggleCard({
  icon,
  tint,
  title,
  titleHint,
  description,
  ...rest
}: ToggleCardProps) {
  const colors = TINTS[tint];

  return (
    <Switch
      {...rest}
      className={composeRenderProps(rest.className, (className) =>
        [STYLES.card, className].filter(Boolean).join(" "),
      )}
    >
      {({ isSelected }) => (
        <>
          <span
            className={`${STYLES.track} ${
              isSelected ? colors.track : STYLES.trackOff
            }`}
          >
            <span
              className={`${STYLES.handle} ${isSelected ? STYLES.handleOn : ""}`}
            />
          </span>

          <span className={`shrink-0 mt-0.5 ${colors.icon}`}>{icon}</span>

          <span className="flex flex-col gap-0.5">
            <span className={STYLES.title}>
              {title}{" "}
              {titleHint && (
                <span className={STYLES.titleHint}>{titleHint}</span>
              )}
            </span>
            <span className={STYLES.description}>{description}</span>
          </span>
        </>
      )}
    </Switch>
  );
}
