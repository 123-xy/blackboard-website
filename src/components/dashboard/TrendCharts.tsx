"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const GOLD = "#F2A93B";
const GRID = "#35322C";
const AXIS_TEXT = "#B8B2A8";

type Point = { label: string; value: number };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-card-border bg-dark px-3 py-2 text-xs shadow-lg">
      <div className="mb-0.5 font-semibold text-muted">{label}</div>
      <div className="font-bold text-gold-text">{payload[0].value} reservations</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted">
      No reservation data yet for this period.
    </div>
  );
}

export default function TrendCharts({
  daily,
  weekly,
  monthly,
}: {
  daily: Point[];
  weekly: Point[];
  monthly: Point[];
}) {
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");

  const data = view === "daily" ? daily : view === "weekly" ? weekly : monthly;
  const hasData = data.some((d) => d.value > 0);

  return (
    <div className="rounded-[16px] border border-card-border bg-surface p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="m-0 font-display text-base font-bold text-heading">Reservation Trends</h3>
        <div className="flex gap-1 rounded-lg border border-card-border p-1">
          {(["daily", "weekly", "monthly"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                view === v ? "bg-gold text-dark" : "text-muted hover:text-heading"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          {view === "daily" ? (
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
              <XAxis dataKey="label" stroke={AXIS_TEXT} fontSize={12} tickLine={false} axisLine={{ stroke: GRID }} />
              <YAxis stroke={AXIS_TEXT} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID }} />
              <Line type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2} dot={{ r: 4, fill: GOLD }} activeDot={{ r: 6 }} isAnimationActive animationDuration={600} />
            </LineChart>
          ) : view === "weekly" ? (
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
              <XAxis dataKey="label" stroke={AXIS_TEXT} fontSize={11} tickLine={false} axisLine={{ stroke: GRID }} />
              <YAxis stroke={AXIS_TEXT} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(242,169,59,0.08)" }} />
              <Bar dataKey="value" fill={GOLD} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive animationDuration={600} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="monthlyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GOLD} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={GOLD} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
              <XAxis dataKey="label" stroke={AXIS_TEXT} fontSize={12} tickLine={false} axisLine={{ stroke: GRID }} />
              <YAxis stroke={AXIS_TEXT} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID }} />
              <Area type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2} fill="url(#monthlyFill)" isAnimationActive animationDuration={600} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
