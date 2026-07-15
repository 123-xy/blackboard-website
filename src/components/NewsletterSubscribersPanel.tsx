"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDateShort } from "@/lib/utils";
import { getNewsletterSubscribersAction, deleteNewsletterSubscriberAction } from "@/app/actions/newsletter-actions";

type Subscriber = { id: string; email: string; subscribedAt: string };
type Pagination = { page: number; limit: number; total: number; totalPages: number };

const emptyPagination: Pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };

export default function NewsletterSubscribersPanel() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getNewsletterSubscribersAction({ page }).then((result) => {
      if (result.ok) {
        setSubscribers(result.subscribers);
        setPagination(result.pagination);
      }
    });
  }, [page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this subscriber?")) return;
    setBusyId(id);
    await deleteNewsletterSubscriberAction(id);
    setBusyId(null);
    refresh();
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted">{pagination.total} subscriber{pagination.total === 1 ? "" : "s"}</span>
        <a
          href="/api/newsletter/export"
          className="rounded-lg border border-card-border px-3.5 py-2.5 text-sm font-semibold text-muted no-underline transition-colors hover:border-gold hover:text-gold"
        >
          Export CSV
        </a>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-card-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-card-border">
                <th className="px-4 py-3 text-xs font-bold tracking-[0.5px] text-muted uppercase">Email</th>
                <th className="px-4 py-3 text-xs font-bold tracking-[0.5px] text-muted uppercase">Subscribed</th>
                <th className="px-4 py-3 text-xs font-bold tracking-[0.5px] text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted">
                    No subscribers yet.
                  </td>
                </tr>
              )}
              {subscribers.map((s) => (
                <tr key={s.id} className="border-b border-card-border last:border-b-0 hover:bg-cream-input/50">
                  <td className="px-4 py-3.5 text-sm text-heading">{s.email}</td>
                  <td className="px-4 py-3.5 text-sm text-muted">{formatDateShort(s.subscribedAt)}</td>
                  <td className="px-4 py-3.5">
                    <button
                      disabled={busyId === s.id}
                      onClick={() => handleDelete(s.id)}
                      className="rounded-lg border border-error/30 px-2.5 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/10"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-card-border px-4 py-3.5">
          <span className="text-xs text-muted">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)} · {pagination.total} total
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
