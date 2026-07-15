import { formatDateShort } from "@/lib/utils";

type Customer = {
  email: string;
  name: string;
  phone: string;
  totalReservations: number;
  lastVisit: string;
  status: "active" | "inactive";
};

export default function RecentCustomersTable({ customers }: { customers: Customer[] }) {
  if (customers.length === 0) {
    return <div className="py-8 text-center text-sm text-muted">No customers in this period.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-card-border">
            <th className="px-4 py-2.5 text-xs font-bold tracking-[0.5px] text-muted uppercase">Name</th>
            <th className="px-4 py-2.5 text-xs font-bold tracking-[0.5px] text-muted uppercase">Phone</th>
            <th className="px-4 py-2.5 text-xs font-bold tracking-[0.5px] text-muted uppercase">Reservations</th>
            <th className="px-4 py-2.5 text-xs font-bold tracking-[0.5px] text-muted uppercase">Last Visit</th>
            <th className="px-4 py-2.5 text-xs font-bold tracking-[0.5px] text-muted uppercase">Status</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.email} className="border-b border-card-border last:border-b-0 hover:bg-cream-input/50">
              <td className="px-4 py-3">
                <div className="text-sm font-semibold text-heading">{c.name}</div>
                <div className="text-xs text-muted">{c.email}</div>
              </td>
              <td className="px-4 py-3 text-sm text-heading">{c.phone}</td>
              <td className="px-4 py-3 text-sm text-heading">{c.totalReservations}</td>
              <td className="px-4 py-3 text-sm text-muted">{formatDateShort(c.lastVisit)}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-[0.5px] ${
                    c.status === "active"
                      ? "border-green-500/30 bg-green-500/15 text-green-500"
                      : "border-card-border bg-cream-input text-muted"
                  }`}
                >
                  {c.status === "active" ? "ACTIVE" : "INACTIVE"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
