"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatDateShort, formatTime } from "@/lib/utils";
import {
  updateReservationStatusAction,
  deleteReservationAction,
  resendReservationConfirmationAction,
  bulkUpdateReservationStatusAction,
  bulkDeleteReservationsAction,
} from "@/app/actions/reservation-actions";

export type ReservationRow = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  guests: number;
  reservationDate: string;
  reservationTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  confirmationCode: string;
  createdAt: string;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

const statusBadge = (s: string) => {
  if (s === "CONFIRMED") return "bg-green-500/15 text-green-600 border-green-500/30";
  if (s === "COMPLETED") return "bg-blue-500/15 text-blue-500 border-blue-500/30";
  if (s === "CANCELLED") return "bg-error/15 text-error border-error/30";
  return "bg-gold/15 text-gold-text border-gold/30";
};

const columnHelper = createColumnHelper<ReservationRow>();

export default function ReservationTable({
  rows,
  pagination,
  onChange,
  onRefresh,
  canDelete = true,
}: {
  rows: ReservationRow[];
  pagination: Pagination;
  onChange: (page: number) => void;
  onRefresh: () => void;
  canDelete?: boolean;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; message: string; error?: boolean } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  const toggleSelected = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));
  }, [rows]);

  const handleBulkStatus = useCallback(
    async (status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED") => {
      setBulkBusy(true);
      setBulkFeedback(null);
      const result = await bulkUpdateReservationStatusAction(Array.from(selected), status);
      setBulkBusy(false);
      setSelected(new Set());
      onRefresh();
      if (result.ok) {
        setBulkFeedback(
          status === "CONFIRMED"
            ? `Updated. Notified ${result.notifiedCount}/${result.notifiedCount + result.failedCount} customers.`
            : "Status updated."
        );
      } else {
        setBulkFeedback(result.error || "Bulk update failed");
      }
    },
    [selected, onRefresh]
  );

  const handleBulkDelete = useCallback(async () => {
    if (!confirm(`Delete ${selected.size} reservations? This cannot be undone.`)) return;
    setBulkBusy(true);
    setBulkFeedback(null);
    const result = await bulkDeleteReservationsAction(Array.from(selected));
    setBulkBusy(false);
    setSelected(new Set());
    onRefresh();
    setBulkFeedback(result.ok ? `Deleted ${result.deletedCount} reservations.` : result.error || "Bulk delete failed");
  }, [selected, onRefresh]);

  const handleStatusChange = useCallback(
    async (id: string, status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED") => {
      setBusyId(id);
      setFeedback(null);
      const result = await updateReservationStatusAction(id, status);
      setBusyId(null);
      onRefresh();

      if (result.ok && status === "CONFIRMED" && result.notified) {
        const { email, whatsapp } = result.notified;
        const message =
          email && whatsapp
            ? "Confirmed — email & WhatsApp sent"
            : email
              ? "Confirmed — email sent, WhatsApp failed"
              : whatsapp
                ? "Confirmed — WhatsApp sent, email failed"
                : "Confirmed — notifications failed to send";
        setFeedback({ id, message, error: !email && !whatsapp });
        setTimeout(() => setFeedback((current) => (current?.id === id ? null : current)), 5000);
      }
    },
    [onRefresh]
  );

  const handleResend = useCallback(
    async (id: string) => {
      setBusyId(id);
      setFeedback(null);
      const result = await resendReservationConfirmationAction(id);
      setBusyId(null);
      setFeedback({
        id,
        message: result.ok ? "Email sent" : result.error || "Failed to send",
        error: !result.ok,
      });
      setTimeout(() => setFeedback((current) => (current?.id === id ? null : current)), 4000);
    },
    []
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this reservation? This cannot be undone.")) return;
      setBusyId(id);
      await deleteReservationAction(id);
      setBusyId(null);
      onRefresh();
    },
    [onRefresh]
  );

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: () => (
          <input
            type="checkbox"
            checked={rows.length > 0 && selected.size === rows.length}
            onChange={toggleSelectAll}
            aria-label="Select all"
          />
        ),
        cell: (info) => (
          <input
            type="checkbox"
            checked={selected.has(info.row.original.id)}
            onChange={() => toggleSelected(info.row.original.id)}
            aria-label={`Select ${info.row.original.customerName}`}
          />
        ),
      }),
      columnHelper.accessor("confirmationCode", {
        header: "Code",
        cell: (info) => <span className="font-display text-xs font-bold tracking-[1px] text-gold-text">{info.getValue()}</span>,
      }),
      columnHelper.accessor("customerName", {
        header: "Customer",
        cell: (info) => (
          <div>
            <div className="text-sm font-semibold text-heading">{info.getValue()}</div>
            <div className="text-xs text-muted">{info.row.original.email}</div>
          </div>
        ),
      }),
      columnHelper.accessor("reservationDate", {
        header: "Date / Time",
        cell: (info) => (
          <div className="text-sm text-heading">
            {formatDateShort(info.getValue())} · {formatTime(info.row.original.reservationTime)}
          </div>
        ),
      }),
      columnHelper.accessor("guests", {
        header: "Guests",
        cell: (info) => <span className="text-sm text-heading">{info.getValue()}</span>,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => (
          <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-[0.5px] ${statusBadge(info.getValue())}`}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const row = info.row.original;
          const busy = busyId === row.id;
          return (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={row.status}
                disabled={busy}
                onChange={(e) => handleStatusChange(row.id, e.target.value as "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED")}
                className="rounded-lg border border-card-border bg-cream-input px-2 py-1.5 text-xs text-heading"
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <button
                disabled={busy}
                onClick={() => handleResend(row.id)}
                className="rounded-lg border border-card-border px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-gold hover:text-gold"
              >
                Resend Email
              </button>
              {canDelete && (
                <button
                  disabled={busy}
                  onClick={() => handleDelete(row.id)}
                  className="rounded-lg border border-error/30 px-2.5 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/10"
                >
                  Delete
                </button>
              )}
              {feedback?.id === row.id && (
                <span className={`text-xs font-semibold ${feedback.error ? "text-error" : "text-green-600"}`}>
                  {feedback.message}
                </span>
              )}
            </div>
          );
        },
      }),
    ],
    [busyId, feedback, selected, rows, canDelete, toggleSelected, toggleSelectAll, handleStatusChange, handleResend, handleDelete]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  return (
    <div className="overflow-hidden rounded-[16px] border border-card-border bg-surface">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-card-border bg-gold/10 px-4 py-3">
          <span className="text-sm font-semibold text-gold-text">{selected.size} selected</span>
          <select
            disabled={bulkBusy}
            defaultValue=""
            onChange={(e) => {
              const value = e.target.value as "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
              if (value) handleBulkStatus(value);
              e.target.value = "";
            }}
            className="rounded-lg border border-card-border bg-cream-input px-2.5 py-1.5 text-xs text-heading"
          >
            <option value="" disabled>
              Set status…
            </option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          {canDelete && (
            <button
              disabled={bulkBusy}
              onClick={handleBulkDelete}
              className="rounded-lg border border-error/30 px-2.5 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/10"
            >
              Delete Selected
            </button>
          )}
          <button
            disabled={bulkBusy}
            onClick={() => setSelected(new Set())}
            className="text-xs font-semibold text-muted hover:text-heading"
          >
            Clear
          </button>
          {bulkFeedback && <span className="text-xs text-muted">{bulkFeedback}</span>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-card-border">
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-xs font-bold tracking-[0.5px] text-muted uppercase">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted">
                  No reservations found.
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-card-border last:border-b-0 hover:bg-cream-input/50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3.5 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4 border-t border-card-border px-4 py-3.5">
        <span className="text-xs text-muted">
          Page {pagination.page} of {Math.max(1, pagination.totalPages)} · {pagination.total} total
        </span>
        <div className="flex gap-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => onChange(pagination.page - 1)}
            className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onChange(pagination.page + 1)}
            className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
