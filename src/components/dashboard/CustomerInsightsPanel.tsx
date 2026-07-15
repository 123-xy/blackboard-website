"use client";

import { useEffect, useState } from "react";
import { Trophy, AlertTriangle } from "lucide-react";
import { getCustomerInsightsAction } from "@/app/actions/dashboard-actions";

type Insights = Awaited<ReturnType<typeof getCustomerInsightsAction>>;

export default function CustomerInsightsPanel() {
  const [data, setData] = useState<Insights | null>(null);

  useEffect(() => {
    getCustomerInsightsAction().then(setData);
  }, []);

  if (!data) {
    return <div className="mb-6 h-[220px] animate-pulse rounded-[16px] border border-card-border bg-surface" />;
  }
  if (!data.ok) return null;

  return (
    <div className="mb-6">
      <div className="mb-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className="rounded-[14px] border border-card-border bg-surface p-4">
          <div className="font-display text-2xl font-extrabold text-gold">{data.repeatRate}%</div>
          <div className="text-xs text-muted">Repeat Customer Rate</div>
        </div>
        <div className="rounded-[14px] border border-card-border bg-surface p-4">
          <div className="font-display text-2xl font-extrabold text-gold">
            {data.avgVisitFrequencyDays !== null ? `${data.avgVisitFrequencyDays}d` : "—"}
          </div>
          <div className="text-xs text-muted">Avg. Visit Frequency</div>
        </div>
        <div className="rounded-[14px] border border-card-border bg-surface p-4">
          <div className="font-display text-2xl font-extrabold text-gold">{data.repeatCustomerCount}</div>
          <div className="text-xs text-muted">Repeat Customers</div>
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <div className="rounded-[16px] border border-card-border bg-surface p-6">
          <div className="mb-3 flex items-center gap-2">
            <Trophy size={16} className="text-gold-text" />
            <h3 className="m-0 font-display text-base font-bold text-heading">Top Customers</h3>
          </div>
          {data.topCustomers.length === 0 ? (
            <p className="m-0 text-sm text-muted">No customer data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {data.topCustomers.map((c) => (
                <div key={c.email} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold text-heading">{c.name}</div>
                    <div className="text-xs text-muted">{c.email}</div>
                  </div>
                  <span className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold-text">
                    {c.visitCount} visits
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[16px] border border-card-border bg-surface p-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-error" />
            <h3 className="m-0 font-display text-base font-bold text-heading">Customers At Risk of Churning</h3>
          </div>
          {data.churnRisk.length === 0 ? (
            <p className="m-0 text-sm text-muted">No repeat customers overdue for a visit.</p>
          ) : (
            <div className="space-y-2.5">
              {data.churnRisk.map((c) => (
                <div key={c.email} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold text-heading">{c.name}</div>
                    <div className="text-xs text-muted">{c.visitCount} past visits</div>
                  </div>
                  <span className="rounded-full bg-error/15 px-2.5 py-1 text-xs font-bold text-error">
                    {c.daysSinceLastVisit}d since visit
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
