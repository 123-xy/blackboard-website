import { customAlphabet } from "nanoid";
import { format, parse, differenceInCalendarDays } from "date-fns";

// ---------- Confirmation code ----------
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0,O,1,I to avoid confusion
const nanoid = customAlphabet(alphabet, 8);

export function generateConfirmationCode(): string {
  return nanoid();
}

// ---------- Date / time helpers ----------
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMMM d, yyyy");
}

export function formatTime(time: string): string {
  const parsed = parse(time, "HH:mm", new Date());
  return format(parsed, "h:mm a");
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy");
}

// "today" / "tomorrow" / "yesterday" for near dates, otherwise a formatted date.
export function describeRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = differenceInCalendarDays(d, new Date());
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return `on ${formatDate(d)}`;
}

// Pulls the "Event date: YYYY-MM-DD" line the contact form prepends to an
// inquiry's message (see toInquiryPayload in the contact API route).
export function extractEventDateFromMessage(message: string): Date | null {
  const match = message.match(/Event date:\s*(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  const date = new Date(`${match[1]}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Splits the "Event date: ..." / "Estimated guest count: ..." lines the
// contact form prepends to an inquiry's message (see toInquiryPayload in the
// contact API route) back out into separate display fields.
export function parseInquiryDetails(rawMessage: string): { eventDate: string | null; guestCount: string | null; message: string } {
  let message = rawMessage;
  let eventDate: string | null = null;
  let guestCount: string | null = null;

  const eventDateMatch = message.match(/^Event date:\s*(.+)$/m);
  if (eventDateMatch) {
    eventDate = eventDateMatch[1].trim();
    message = message.replace(eventDateMatch[0], "");
  }

  const guestCountMatch = message.match(/^Estimated guest count:\s*(.+)$/m);
  if (guestCountMatch) {
    guestCount = guestCountMatch[1].trim();
    message = message.replace(guestCountMatch[0], "");
  }

  return { eventDate, guestCount, message: message.replace(/^\s+/, "").trim() };
}

// ---------- Classname merge ----------
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
