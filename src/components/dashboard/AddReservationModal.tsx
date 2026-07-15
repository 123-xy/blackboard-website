"use client";

import { useState } from "react";
import { createReservationAction } from "@/app/actions/reservation-actions";

const fieldClasses =
  "w-full rounded-lg border border-card-border bg-cream-input px-3.5 py-2.5 text-sm text-heading focus:border-gold focus:outline-none";

export default function AddReservationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    guests: 2,
    reservationDate: "",
    reservationTime: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await createReservationAction(form);
    setSubmitting(false);
    if (result.ok) {
      onCreated();
      onClose();
    } else {
      setError(result.error || "Failed to create reservation");
    }
  };

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-5">
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-[480px] rounded-[20px] border border-card-border bg-surface p-7"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="m-0 font-display text-lg font-bold text-heading">Add Reservation</h2>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-muted hover:text-gold">
            ×
          </button>
        </div>

        <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <input
            required
            placeholder="Customer name"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            className={fieldClasses}
          />
          <input
            required
            type="number"
            min={1}
            max={10}
            placeholder="Guests"
            value={form.guests}
            onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
            className={fieldClasses}
          />
        </div>
        <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={fieldClasses}
          />
          <input
            required
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={fieldClasses}
          />
        </div>
        <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <input
            required
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={form.reservationDate}
            onChange={(e) => setForm({ ...form, reservationDate: e.target.value })}
            className={fieldClasses}
          />
          <input
            required
            type="time"
            value={form.reservationTime}
            onChange={(e) => setForm({ ...form, reservationTime: e.target.value })}
            className={fieldClasses}
          />
        </div>
        <textarea
          placeholder="Notes (optional)"
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className={`${fieldClasses} mb-4 resize-y`}
        />

        {error && <p className="mb-4 text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-gold px-6 py-3 text-sm font-bold tracking-[0.5px] text-dark shadow-[0_4px_0_#C97F16] disabled:opacity-50"
        >
          {submitting ? "CREATING…" : "CREATE RESERVATION"}
        </button>
      </form>
    </div>
  );
}
