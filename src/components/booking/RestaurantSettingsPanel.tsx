"use client";

import { useEffect, useState } from "react";
import { getSettingsAction, updateSettingsAction } from "@/app/actions/settings-actions";

type Settings = {
  openingTime: string;
  closingTime: string;
  tablesAvailable: number;
  slotDuration: number;
  maxGuestsPerBooking: number;
};

const fieldClasses =
  "w-full rounded-lg border border-card-border bg-cream-input px-3.5 py-2.5 text-sm text-heading focus:border-gold focus:outline-none";

export default function RestaurantSettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    getSettingsAction().then((result) => {
      if (result.ok) setSettings(result.settings);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setFeedback(null);
    setFieldErrors({});

    const result = await updateSettingsAction(settings);
    setSaving(false);

    if (result.ok) {
      setSettings(result.settings);
      setFeedback({ message: "Settings saved" });
    } else {
      setFeedback({ message: result.error || "Failed to save settings", error: true });
      if ("fieldErrors" in result && result.fieldErrors) {
        setFieldErrors(result.fieldErrors as Record<string, string[]>);
      }
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-sm text-muted">Loading settings…</div>;
  }

  if (!settings) {
    return <div className="py-10 text-center text-sm text-error">Failed to load settings.</div>;
  }

  return (
    <div className="max-w-[560px] rounded-[16px] border border-card-border bg-surface p-6 sm:p-8">
      <h2 className="m-0 mb-1 font-display text-xl font-bold text-heading">Restaurant Settings</h2>
      <p className="m-0 mb-6 text-sm text-muted">
        Controls booking hours, table capacity, and slot rules used across the reservation system.
      </p>

      {feedback && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            feedback.error ? "border-error/30 bg-error/10 text-error" : "border-gold/30 bg-gold/10 text-gold-text"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="mb-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-heading">Opening Time</label>
          <input
            type="time"
            value={settings.openingTime}
            onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
            className={fieldClasses}
          />
          {fieldErrors.openingTime && <p className="mt-1 text-xs text-error">{fieldErrors.openingTime[0]}</p>}
        </div>
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-heading">Closing Time</label>
          <input
            type="time"
            value={settings.closingTime}
            onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
            className={fieldClasses}
          />
          {fieldErrors.closingTime && <p className="mt-1 text-xs text-error">{fieldErrors.closingTime[0]}</p>}
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-[13px] font-semibold text-heading">Tables Available</label>
        <input
          type="number"
          min={1}
          max={500}
          value={settings.tablesAvailable}
          onChange={(e) => setSettings({ ...settings, tablesAvailable: Number(e.target.value) })}
          className={fieldClasses}
        />
        <p className="mt-1 text-xs text-muted">Number of tables that can be booked per time slot.</p>
        {fieldErrors.tablesAvailable && <p className="mt-1 text-xs text-error">{fieldErrors.tablesAvailable[0]}</p>}
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-[13px] font-semibold text-heading">Slot Duration (minutes)</label>
        <input
          type="number"
          min={15}
          max={240}
          step={15}
          value={settings.slotDuration}
          onChange={(e) => setSettings({ ...settings, slotDuration: Number(e.target.value) })}
          className={fieldClasses}
        />
        <p className="mt-1 text-xs text-muted">How far apart bookable time slots are (e.g. 30 = every half hour).</p>
        {fieldErrors.slotDuration && <p className="mt-1 text-xs text-error">{fieldErrors.slotDuration[0]}</p>}
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-[13px] font-semibold text-heading">Max Guests per Booking</label>
        <input
          type="number"
          min={1}
          max={100}
          value={settings.maxGuestsPerBooking}
          onChange={(e) => setSettings({ ...settings, maxGuestsPerBooking: Number(e.target.value) })}
          className={fieldClasses}
        />
        {fieldErrors.maxGuestsPerBooking && (
          <p className="mt-1 text-xs text-error">{fieldErrors.maxGuestsPerBooking[0]}</p>
        )}
      </div>

      <button
        disabled={saving}
        onClick={handleSave}
        className="rounded-lg bg-gold px-6 py-3 text-sm font-bold tracking-[0.5px] text-dark shadow-[0_4px_0_#C97F16] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "SAVING…" : "SAVE SETTINGS"}
      </button>
    </div>
  );
}
