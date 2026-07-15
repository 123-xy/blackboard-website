"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const GOLD = "#F2A93B";
const GRID = "#35322C";
const AXIS_TEXT = "#B8B2A8";

type HourPoint = { label: string; value: number };

export default function PeakHoursChart({ data }: { data: HourPoint[] }) {
  if (data.length === 0) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-muted">No reservation times recorded yet.</div>;
  }

  const max = Math.max(...data.map((d) => d.value));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
        <XAxis dataKey="label" stroke={AXIS_TEXT} fontSize={11} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis stroke={AXIS_TEXT} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "rgba(242,169,59,0.08)" }}
          content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null;
            return (
              <div className="rounded-lg border border-card-border bg-dark px-3 py-2 text-xs shadow-lg">
                <div className="mb-0.5 font-semibold text-muted">{label}</div>
                <div className="font-bold text-gold-text">{payload[0].value} reservations</div>
              </div>
            );
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive animationDuration={600}>
          {data.map((d) => (
            <Cell key={d.label} fill={GOLD} fillOpacity={0.35 + 0.65 * (d.value / max)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
