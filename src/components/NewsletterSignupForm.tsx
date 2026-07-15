"use client";

import { useState } from "react";
import { subscribeToNewsletterAction } from "@/app/actions/newsletter-actions";

export default function NewsletterSignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");

    const result = await subscribeToNewsletterAction(email);
    if (result.ok) {
      setStatus("success");
      setEmail("");
    } else {
      setStatus("error");
      setError(result.error || "Failed to subscribe");
    }
  };

  if (status === "success") {
    return <p className="m-0 text-sm text-gold">You&apos;re subscribed! Keep an eye on your inbox.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="w-full min-w-0 rounded-lg border border-[#3a362f] bg-dark-2 px-3.5 py-2.5 text-sm text-white placeholder:text-muted-on-dark-2 focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="flex-none rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending" ? "…" : "Join"}
        </button>
      </div>
      {status === "error" && <p className="m-0 text-xs text-error">{error}</p>}
    </form>
  );
}
