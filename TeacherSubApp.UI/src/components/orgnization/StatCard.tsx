import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  tone?: "neutral" | "blue" | "emerald" | "red" | "amber";
}

const toneStyles = {
  neutral: "bg-neutral-50 text-neutral-500",
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-600",
} as const;

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  tone = "neutral",
}: StatCardProps) {
  return (
    <article className="flex min-w-0 items-start justify-between gap-3 rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-neutral-500">{label}</p>
        <p className="mt-2 truncate text-2xl font-bold tracking-tight text-neutral-900">
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 truncate text-xs text-neutral-400">{subtitle}</p>
        )}
      </div>
      {Icon && (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}
        >
          <Icon size={19} strokeWidth={2} aria-hidden="true" />
        </span>
      )}
    </article>
  );
}
