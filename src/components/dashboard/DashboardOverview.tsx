"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  UserPlus,
  Users,
  Repeat,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Plus,
  Download,
  Printer,
} from "lucide-react";
import StatCard from "./StatCard";
import TrendCharts from "./TrendCharts";
import StatusPieChart from "./StatusPieChart";
import PeakHoursChart from "./PeakHoursChart";
import ActivityFeed from "./ActivityFeed";
import RecentCustomersTable from "./RecentCustomersTable";
import AddReservationModal from "./AddReservationModal";
import { getDashboardOverviewAction, type DashboardRange } from "@/app/actions/dashboard-actions";

const CARD_ICONS: Record<string, { icon: typeof CalendarCheck; accent: "gold" | "green" | "blue" | "red" }> = {
  reservationsToday: { icon: CalendarCheck, accent: "gold" },
  newCustomersToday: { icon: UserPlus, accent: "green" },
  totalCustomers: { icon: Users, accent: "blue" },
  repeatCustomers: { icon: Repeat, accent: "gold" },
  pendingReservations: { icon: Clock, accent: "gold" },
  confirmedReservations: { icon: CheckCircle2, accent: "green" },
  cancelledToday: { icon: XCircle, accent: "red" },
  newInquiriesToday: { icon: MessageSquare, accent: "blue" },
};

const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "3m", label: "Last 3 Months" },
  { value: "6m", label: "Last 6 Months" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

type Overview = Awaited<ReturnType<typeof getDashboardOverviewAction>>;

function CardsSkeleton() {
  return (
    <div className="mb-6 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-[124px] animate-pulse rounded-[16px] border border-card-border bg-surface" />
      ))}
    </div>
  );
}

export default function DashboardOverview() {
  const [range, setRange] = useState<DashboardRange>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddReservation, setShowAddReservation] = useState(false);

  const refresh = useCallback(() => {
    if (range === "custom" && (!customFrom || !customTo)) return;
    getDashboardOverviewAction(range, range === "custom" ? { from: customFrom, to: customTo } : undefined).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [range, customFrom, customTo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading || !data) {
    return <CardsSkeleton />;
  }

  if (!data.ok) {
    return (
      <div className="rounded-[16px] border border-error/30 bg-error/10 p-8 text-center text-sm text-error">
        {data.error}
      </div>
    );
  }

  return (
    <div>
      {/* Filters + Quick Actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-card-border p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === opt.value ? "bg-gold text-dark" : "text-muted hover:text-heading"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {range === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-card-border bg-cream-input px-3 py-2 text-xs text-heading focus:border-gold focus:outline-none"
            />
            <span className="text-xs text-muted">to</span>
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-card-border bg-cream-input px-3 py-2 text-xs text-heading focus:border-gold focus:outline-none"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddReservation(true)}
            className="flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-xs font-bold tracking-[0.3px] text-dark shadow-[0_3px_0_#C97F16]"
          >
            <Plus size={14} strokeWidth={2.5} /> Add Reservation
          </button>
          <Link
            href="/api/reservations/export"
            className="flex items-center gap-1.5 rounded-lg border border-card-border px-3.5 py-2 text-xs font-semibold text-muted no-underline transition-colors hover:border-gold hover:text-gold"
          >
            <Download size={14} /> Export CSV
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-card-border px-3.5 py-2 text-xs font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
          >
            <Printer size={14} /> Print Report
          </button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="mb-6 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {data.cards.map((c) => {
          const meta = CARD_ICONS[c.key] || { icon: CalendarCheck, accent: "gold" as const };
          return (
            <StatCard
              key={c.key}
              label={c.label}
              value={c.value}
              change={c.change}
              sub={c.sub}
              icon={meta.icon}
              accent={meta.accent}
            />
          );
        })}
      </div>

      {/* Trend charts */}
      <div className="mb-6">
        <TrendCharts daily={data.dailySeries} weekly={data.weeklySeries} monthly={data.monthlySeries} />
      </div>

      {/* Status breakdown + Peak hours */}
      <div className="mb-6 grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div className="rounded-[16px] border border-card-border bg-surface p-6">
          <h3 className="m-0 mb-2 font-display text-base font-bold text-heading">Reservation Status</h3>
          <StatusPieChart data={data.statusBreakdown} />
        </div>
        <div className="rounded-[16px] border border-card-border bg-surface p-6">
          <h3 className="m-0 mb-4 font-display text-base font-bold text-heading">Peak Hours</h3>
          <PeakHoursChart data={data.peakHours} />
        </div>
      </div>

      {/* Weekly / Monthly summary */}
      <div className="mb-6 grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div className="rounded-[16px] border border-card-border bg-surface p-6">
          <h3 className="m-0 mb-4 font-display text-base font-bold text-heading">This Week</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-display text-2xl font-extrabold text-gold">{data.weeklySummary.reservations}</div>
              <div className="text-xs text-muted">Reservations</div>
            </div>
            <div>
              <div className="font-display text-2xl font-extrabold text-gold">{data.weeklySummary.newCustomers}</div>
              <div className="text-xs text-muted">New Customers</div>
            </div>
            <div>
              <div className="font-display text-2xl font-extrabold text-gold">{data.weeklySummary.avgPartySize}</div>
              <div className="text-xs text-muted">Avg. Party Size</div>
            </div>
            <div>
              <div className="font-display text-2xl font-extrabold text-gold">{data.weeklySummary.repeatCustomers}</div>
              <div className="text-xs text-muted">Repeat Customers</div>
            </div>
          </div>
        </div>
        <div className="rounded-[16px] border border-card-border bg-surface p-6">
          <h3 className="m-0 mb-4 font-display text-base font-bold text-heading">This Month</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-display text-2xl font-extrabold text-gold">{data.monthlySummary.reservations}</div>
              <div className="text-xs text-muted">Reservations</div>
            </div>
            <div>
              <div className="font-display text-2xl font-extrabold text-gold">{data.monthlySummary.newCustomers}</div>
              <div className="text-xs text-muted">New Customers</div>
            </div>
            <div>
              <div className="font-display text-2xl font-extrabold text-gold">{data.monthlySummary.busiestDay}</div>
              <div className="text-xs text-muted">Busiest Day</div>
            </div>
            <div>
              <div className="font-display text-2xl font-extrabold text-gold">{data.monthlySummary.avgDailyReservations}</div>
              <div className="text-xs text-muted">Avg. Daily Reservations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity + Recent customers */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div className="rounded-[16px] border border-card-border bg-surface p-6">
          <h3 className="m-0 mb-2 font-display text-base font-bold text-heading">Recent Activity</h3>
          <ActivityFeed activity={data.activity} />
        </div>
        <div className="rounded-[16px] border border-card-border bg-surface p-6">
          <h3 className="m-0 mb-4 font-display text-base font-bold text-heading">Recent Customers</h3>
          <RecentCustomersTable customers={data.recentCustomers} />
        </div>
      </div>

      {showAddReservation && (
        <AddReservationModal onClose={() => setShowAddReservation(false)} onCreated={refresh} />
      )}
    </div>
  );
}
