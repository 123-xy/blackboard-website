import { formatDate, formatTime, describeRelativeDate, extractEventDateFromMessage } from "@/lib/utils";

export async function sendReservationWhatsApp(reservation: {
  phone: string;
  customerName: string;
  guests: number;
  reservationDate: Date | string;
  reservationTime: string;
  confirmationCode: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromWhatsApp) {
    console.error("[whatsapp] Twilio WhatsApp credentials not configured");
    return;
  }

  const dateStr = formatDate(reservation.reservationDate);
  const timeStr = formatTime(reservation.reservationTime);

  const body = [
    `🎉 *Reservation Confirmed!*`,
    ``,
    `Hi ${reservation.customerName}, your table at *Blackboard Cafe* is booked!`,
    ``,
    `📅 *Date:* ${dateStr}`,
    `🕐 *Time:* ${timeStr}`,
    `👥 *Guests:* ${reservation.guests}`,
    `🔖 *Confirmation:* ${reservation.confirmationCode}`,
    ``,
    `📍 _Blackboard Cafe, Hyderabad, Telangana_`,
    ``,
    `Great Food, Great Life ☕`,
  ].join("\n");

  // Normalize phone to E.164 format
  let toNumber = reservation.phone.replace(/[\s-]/g, "");
  if (!toNumber.startsWith("+")) {
    toNumber = "+91" + toNumber;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams({
      To: `whatsapp:${toNumber}`,
      From: `whatsapp:${fromWhatsApp}`,
      Body: body,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[whatsapp] Twilio error", res.status, detail);
    }
  } catch (err) {
    console.error("[whatsapp] Failed to send", err);
  }
}

// Sent when staff confirm a reservation from the admin dashboard.
export async function sendReservationConfirmedNoticeWhatsApp(reservation: {
  phone: string;
  customerName: string;
  guests: number;
  reservationDate: Date | string;
  reservationTime: string;
  confirmationCode: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromWhatsApp) {
    console.error("[whatsapp] Twilio WhatsApp credentials not configured");
    return { ok: false as const, error: "Twilio WhatsApp credentials not configured" };
  }

  const relativeDay = describeRelativeDate(reservation.reservationDate);
  const dateStr = formatDate(reservation.reservationDate);
  const timeStr = formatTime(reservation.reservationTime);

  const body = [
    `✅ *You're all set!*`,
    ``,
    `Hi ${reservation.customerName}, your table at *Blackboard Cafe* is confirmed for *${relativeDay}*. We look forward to having you!`,
    ``,
    `📅 *Date:* ${dateStr}`,
    `🕐 *Time:* ${timeStr}`,
    `👥 *Guests:* ${reservation.guests}`,
    `🔖 *Confirmation:* ${reservation.confirmationCode}`,
    ``,
    `📍 _Blackboard Cafe, Hyderabad, Telangana_`,
    ``,
    `Great Food, Great Life ☕`,
  ].join("\n");

  let toNumber = reservation.phone.replace(/[\s-]/g, "");
  if (!toNumber.startsWith("+")) {
    toNumber = "+91" + toNumber;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams({
      To: `whatsapp:${toNumber}`,
      From: `whatsapp:${fromWhatsApp}`,
      Body: body,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[whatsapp] Twilio error", res.status, detail);
      return { ok: false as const, error: `Twilio error (${res.status}): ${detail}` };
    }
    return { ok: true as const };
  } catch (err) {
    console.error("[whatsapp] Failed to send", err);
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed to send WhatsApp message" };
  }
}

// Sent when staff mark a contact inquiry as Resolved.
export async function sendInquiryResolvedWhatsApp(inquiry: { phone: string; name: string; subject: string; message: string }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromWhatsApp) {
    console.error("[whatsapp] Twilio WhatsApp credentials not configured");
    return { ok: false as const, error: "Twilio WhatsApp credentials not configured" };
  }

  const eventDate = extractEventDateFromMessage(inquiry.message);
  const dateLine = eventDate
    ? `is confirmed for *${describeRelativeDate(eventDate)}*`
    : `has been confirmed`;

  const body = [
    `✅ *You're all set!*`,
    ``,
    `Hi ${inquiry.name}, your request "${inquiry.subject}" ${dateLine}. We look forward to serving you!`,
    ``,
    `📍 _Blackboard Cafe, Hyderabad, Telangana_`,
    ``,
    `Great Food, Great Life ☕`,
  ].join("\n");

  let toNumber = inquiry.phone.replace(/[\s-]/g, "");
  if (!toNumber.startsWith("+")) {
    toNumber = "+91" + toNumber;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams({
      To: `whatsapp:${toNumber}`,
      From: `whatsapp:${fromWhatsApp}`,
      Body: body,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[whatsapp] Twilio error", res.status, detail);
      return { ok: false as const, error: `Twilio error (${res.status}): ${detail}` };
    }
    return { ok: true as const };
  } catch (err) {
    console.error("[whatsapp] Failed to send", err);
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed to send WhatsApp message" };
  }
}
