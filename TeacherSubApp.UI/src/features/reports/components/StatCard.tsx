import type { LucideIcon } from "lucide-react";

const STYLES = {
  card: "flex items-center gap-2.5 rounded-2xl border border-neutral-200/80 bg-white px-3.5 py-2.5",
  iconWrap: "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
  value: "text-sm font-bold leading-tight text-neutral-900",
  label: "text-[11px] font-medium leading-tight text-neutral-500",
};

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  accent?: "blue" | "emerald" | "red" | "neutral";
}

const ACCENT_ICON_WRAP: Record<NonNullable<StatCardProps["accent"]>, string> = {
  blue: "bg-blue-500/10 text-blue-600",
  emerald: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-600",
  neutral: "bg-neutral-100 text-neutral-600",
};

export function StatCard({
  icon: Icon,
  value,
  label,
  accent = "blue",
}: StatCardProps) {
  return (
    <div className={STYLES.card}>
      <span className={`${STYLES.iconWrap} ${ACCENT_ICON_WRAP[accent]}`}>
        <Icon size={15} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className={STYLES.value}>{value}</p>
        <p className={`${STYLES.label} truncate`}>{label}</p>
      </div>
    </div>
  );
}
