import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({
  label,
  value,
  change,
  sub,
  icon: Icon,
  accent = "gold",
}: {
  label: string;
  value: string | number;
  change?: number | null;
  sub?: string;
  icon: LucideIcon;
  accent?: "gold" | "green" | "blue" | "red";
}) {
  const accentClasses: Record<string, string> = {
    gold: "bg-gold/15 text-gold-text",
    green: "bg-green-500/15 text-green-500",
    blue: "bg-blue-500/15 text-blue-500",
    red: "bg-error/15 text-error",
  };

  const trendPositive = typeof change === "number" && change > 0;
  const trendNegative = typeof change === "number" && change < 0;

  return (
    <div className="relative overflow-hidden rounded-[16px] border border-card-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${accentClasses[accent]}`}>
          <Icon size={18} strokeWidth={2.25} />
        </span>
        {typeof change === "number" && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-bold ${
              trendPositive ? "bg-green-500/15 text-green-500" : trendNegative ? "bg-error/15 text-error" : "bg-cream-input text-muted"
            }`}
          >
            {trendPositive && <ArrowUpRight size={12} strokeWidth={2.5} />}
            {trendNegative && <ArrowDownRight size={12} strokeWidth={2.5} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="font-display text-[26px] font-extrabold text-heading">{value}</div>
      <div className="mt-1 text-xs font-semibold tracking-[0.3px] text-muted">{label}</div>
      {sub && <div className="mt-1.5 text-[11px] text-muted-on-dark-2">{sub}</div>}
    </div>
  );
}
