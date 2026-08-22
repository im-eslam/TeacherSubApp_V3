import { Check } from "lucide-react";
import type { WizardStep } from "../../draftStore";

const STYLES = {
  row: "flex items-center gap-2 px-6 py-3 border-b border-neutral-200/60 bg-neutral-50/50",
  step: "flex items-center gap-2",
  bubble:
    "flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold shrink-0 transition-colors",
  bubbleDone: "bg-blue-600 text-white",
  bubbleActive: "bg-blue-100 text-blue-700 ring-2 ring-blue-200",
  bubbleIdle: "bg-neutral-200 text-neutral-500",
  label: "text-xs font-medium",
  labelActive: "text-blue-700",
  labelIdle: "text-neutral-400",
  connector: "flex-1 h-px bg-neutral-200 mx-1",
};

const STEPS: { step: WizardStep; label: string }[] = [
  { step: 1, label: "العملية" },
  { step: 2, label: "التفاصيل" },
  { step: 3, label: "المراجعة" },
];

export function StepIndicator({ current }: { current: WizardStep }) {
  return (
    <div className={STYLES.row}>
      {STEPS.map((s, index) => {
        const isDone = current > s.step;
        const isActive = current === s.step;

        return (
          <div key={s.step} className="flex items-center flex-1 last:flex-initial">
            <div className={STYLES.step}>
              <span
                className={[
                  STYLES.bubble,
                  isDone
                    ? STYLES.bubbleDone
                    : isActive
                      ? STYLES.bubbleActive
                      : STYLES.bubbleIdle,
                ].join(" ")}
              >
                {isDone ? <Check size={13} strokeWidth={3} /> : s.step}
              </span>
              <span
                className={[
                  STYLES.label,
                  isActive || isDone ? STYLES.labelActive : STYLES.labelIdle,
                ].join(" ")}
              >
                {s.label}
              </span>
            </div>
            {index < STEPS.length - 1 && <span className={STYLES.connector} />}
          </div>
        );
      })}
    </div>
  );
}
