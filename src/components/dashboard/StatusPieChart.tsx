"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS: Record<string, string> = {
  Pending: "#F2A93B",
  Confirmed: "#22c55e",
  Completed: "#3b82f6",
  Cancelled: "#E5484D",
};

type Slice = { label: string; value: number };

export default function StatusPieChart({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted">No reservations yet.</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          isAnimationActive
          animationDuration={600}
        >
          {data.map((d) => (
            <Cell key={d.label} fill={COLORS[d.label] || "#8A8478"} stroke="#242220" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const p = payload[0];
            return (
              <div className="rounded-lg border border-card-border bg-dark px-3 py-2 text-xs shadow-lg">
                <div className="font-bold text-heading">
                  {p.name}: {p.value} ({Math.round(((p.value as number) / total) * 100)}%)
                </div>
              </div>
            );
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span className="text-xs text-muted">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
