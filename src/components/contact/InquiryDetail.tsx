"use client";

import { useState } from "react";
import { formatDate, parseInquiryDetails } from "@/lib/utils";
import { updateInquiryStatus, deleteInquiry } from "@/app/actions/contact-actions";
import type { InquiryRow } from "./InquiryTable";

export default function InquiryDetail({
  inquiry,
  onClose,
  onRefresh,
}: {
  inquiry: InquiryRow;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [resolveFeedback, setResolveFeedback] = useState<{ message: string; error?: boolean } | null>(null);

  const { eventDate, guestCount, message: cleanMessage } = parseInquiryDetails(inquiry.message);

  const handleResolve = async () => {
    setBusy(true);
    setResolveFeedback(null);
    const result = await updateInquiryStatus(inquiry.id, "RESOLVED");
    setBusy(false);
    onRefresh();

    if (result.ok && result.notified) {
      const { email, whatsapp } = result.notified;
      const message =
        email && whatsapp
          ? "Resolved — email & WhatsApp sent to customer"
          : email
            ? "Resolved — email sent, WhatsApp not sent"
            : whatsapp
              ? "Resolved — WhatsApp sent, email not sent"
              : "Resolved — notifications failed to send";
      setResolveFeedback({ message, error: !email && !whatsapp });
    } else {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this inquiry? This cannot be undone.")) return;
    setBusy(true);
    await deleteInquiry(inquiry.id);
    setBusy(false);
    onRefresh();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] rounded-[20px] border border-card-border bg-surface p-8 sm:p-9"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 font-display text-xl font-bold text-heading">{inquiry.subject}</h2>
            <p className="m-0 mt-1 text-sm text-muted">{formatDate(inquiry.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-muted hover:text-gold">
            ×
          </button>
        </div>

        {inquiry.isSpam && (
          <div className="mb-5 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            Flagged as likely spam (score {inquiry.spamScore}/100). The owner was not notified for this inquiry.
          </div>
        )}

        {resolveFeedback && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              resolveFeedback.error ? "border-error/30 bg-error/10 text-error" : "border-gold/30 bg-gold/10 text-gold-text"
            }`}
          >
            {resolveFeedback.message}
          </div>
        )}

        <div className="mb-5 space-y-3">
          <div className="rounded-xl border border-card-border bg-cream-input px-5 py-3.5">
            <div className="text-xs text-muted">Name</div>
            <div className="text-sm font-semibold text-heading">{inquiry.name}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-cream-input px-5 py-3.5">
            <div className="text-xs text-muted">Email</div>
            <div className="text-sm font-semibold text-heading">{inquiry.email}</div>
          </div>
          {inquiry.phone && (
            <div className="rounded-xl border border-card-border bg-cream-input px-5 py-3.5">
              <div className="text-xs text-muted">Phone</div>
              <div className="text-sm font-semibold text-heading">{inquiry.phone}</div>
            </div>
          )}
          {eventDate && (
            <div className="rounded-xl border border-card-border bg-cream-input px-5 py-3.5">
              <div className="text-xs text-muted">Event Date</div>
              <div className="text-sm font-semibold text-heading">{eventDate}</div>
            </div>
          )}
          {guestCount && (
            <div className="rounded-xl border border-card-border bg-cream-input px-5 py-3.5">
              <div className="text-xs text-muted">Estimated Guest Count</div>
              <div className="text-sm font-semibold text-heading">{guestCount}</div>
            </div>
          )}
          <div className="rounded-xl border border-card-border bg-cream-input px-5 py-3.5">
            <div className="mb-1 text-xs text-muted">Message</div>
            <div className="text-sm leading-[1.7] whitespace-pre-wrap break-words text-heading">{cleanMessage}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-cream-input px-5 py-3.5">
            <div className="text-xs text-muted">Spam Score</div>
            <div className="text-sm font-semibold text-heading">{inquiry.spamScore} / 100</div>
          </div>
          {inquiry.status === "RESOLVED" && (
            <div className="rounded-xl border border-card-border bg-cream-input px-5 py-3.5">
              <div className="text-xs text-muted">Resolved On</div>
              <div className="text-sm font-semibold text-heading">{formatDate(inquiry.updatedAt)}</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={`mailto:${inquiry.email}?subject=${encodeURIComponent("Re: " + inquiry.subject)}`}
            className="flex-1 rounded-lg bg-gold px-6 py-3 text-center text-sm font-bold tracking-[0.5px] text-dark shadow-[0_4px_0_#C97F16] transition-colors hover:bg-gold-hover-2 no-underline"
          >
            Reply via Email App
          </a>
          <a
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(inquiry.email)}&su=${encodeURIComponent("Re: " + inquiry.subject)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg border border-card-border px-6 py-3 text-center text-sm font-semibold text-heading transition-colors hover:border-gold hover:text-gold no-underline"
          >
            Reply via Gmail
          </a>
          {inquiry.status !== "RESOLVED" && !resolveFeedback && (
            <button
              disabled={busy}
              onClick={handleResolve}
              className="flex-1 rounded-lg border border-card-border px-6 py-3 text-sm font-semibold text-heading transition-colors hover:border-gold hover:text-gold"
            >
              Mark Resolved
            </button>
          )}
          <button
            disabled={busy}
            onClick={handleDelete}
            className="flex-1 rounded-lg border border-error/30 px-6 py-3 text-sm font-semibold text-error transition-colors hover:bg-error/10"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
