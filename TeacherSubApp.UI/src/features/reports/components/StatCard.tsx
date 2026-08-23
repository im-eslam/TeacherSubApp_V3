import type { LucideIcon } from "lucide-react";

const STYLES = {
  card: "flex flex-col gap-2 rounded-2xl border border-neutral-200/80 bg-white px-4 py-4 shadow-sm",
  iconWrap:
    "flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600",
  value: "text-xl font-bold text-neutral-900",
  label: "text-xs font-medium text-neutral-500",
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
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <div>
        <p className={STYLES.value}>{value}</p>
        <p className={STYLES.label}>{label}</p>
      </div>
    </div>
  );
}
