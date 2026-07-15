"use client";

import { useEffect, useState } from "react";
import { formatDateShort, formatTime } from "@/lib/utils";
import { getReservationOpsAction } from "@/app/actions/dashboard-actions";

type Ops = Awaited<ReturnType<typeof getReservationOpsAction>>;

function OccupancyGauge({ booked, total, label }: { booked: number; total: number; label: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-muted">{label}</span>
        <span className="font-bold text-heading">
          {booked} / {total} tables
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-cream-input">
        <div
          className={`h-full rounded-full transition-[width] ${pct >= 90 ? "bg-error" : pct >= 60 ? "bg-gold" : "bg-green-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ReservationOpsPanel() {
  const [data, setData] = useState<Ops | null>(null);

  useEffect(() => {
    getReservationOpsAction().then(setData);
  }, []);

  if (!data) {
    return <div className="mb-6 h-[180px] animate-pulse rounded-[16px] border border-card-border bg-surface" />;
  }
  if (!data.ok) {
    return null;
  }

  return (
    <div className="mb-6 grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
      <div className="rounded-[16px] border border-card-border bg-surface p-6">
        <h3 className="m-0 mb-4 font-display text-base font-bold text-heading">Table Occupancy</h3>
        <div className="space-y-4">
          {data.currentSlot && (
            <OccupancyGauge
              label={`Now (${formatTime(data.currentSlot.time)})`}
              booked={data.currentSlot.booked}
              total={data.currentSlot.total}
            />
          )}
          {data.peakSlotToday && (
            <OccupancyGauge
              label={`Peak today (${formatTime(data.peakSlotToday.time)})`}
              booked={data.peakSlotToday.booked}
              total={data.peakSlotToday.total}
            />
          )}
          {!data.currentSlot && !data.peakSlotToday && (
            <p className="m-0 text-sm text-muted">No bookable slots configured for today.</p>
          )}
        </div>
      </div>

      <div className="rounded-[16px] border border-card-border bg-surface p-6">
        <h3 className="m-0 mb-3 font-display text-base font-bold text-heading">Today&apos;s Reservations ({data.todayReservations.length})</h3>
        {data.todayReservations.length === 0 ? (
          <p className="m-0 text-sm text-muted">No reservations scheduled for today.</p>
        ) : (
          <div className="max-h-[180px] space-y-2 overflow-y-auto">
            {data.todayReservations.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-heading">{r.customerName}</span>
                <span className="text-muted">
                  {formatTime(r.reservationTime)} · {r.guests}g
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[16px] border border-card-border bg-surface p-6">
        <h3 className="m-0 mb-3 font-display text-base font-bold text-heading">Upcoming (Next 7 Days)</h3>
        {data.upcomingReservations.length === 0 ? (
          <p className="m-0 text-sm text-muted">No upcoming reservations.</p>
        ) : (
          <div className="max-h-[180px] space-y-2 overflow-y-auto">
            {data.upcomingReservations.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-heading">{r.customerName}</span>
                <span className="text-muted">
                  {formatDateShort(r.reservationDate)} · {formatTime(r.reservationTime)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[16px] border border-card-border bg-surface p-6">
        <h3 className="m-0 mb-3 font-display text-base font-bold text-heading">Recent Cancellations</h3>
        {data.recentCancellations.length === 0 ? (
          <p className="m-0 text-sm text-muted">No recent cancellations.</p>
        ) : (
          <div className="max-h-[180px] space-y-2 overflow-y-auto">
            {data.recentCancellations.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-heading">{r.customerName}</span>
                <span className="text-muted">was {formatDateShort(r.reservationDate)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
