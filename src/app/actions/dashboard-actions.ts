"use server";

import { prisma } from "@/lib/db";
import { getAccess } from "@/lib/dashboard-store";
import { getAvailableSlots, getSettings } from "@/lib/booking";
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  subMonths,
  startOfWeek,
  startOfMonth,
  format,
  differenceInCalendarDays,
} from "date-fns";

export type DashboardRange = "today" | "yesterday" | "7d" | "30d" | "3m" | "6m" | "year" | "custom";

function rangeToBounds(
  range: DashboardRange,
  now: Date,
  custom?: { from: string; to: string }
): { from: Date; to: Date } {
  const todayStart = startOfDay(now);
  switch (range) {
    case "today":
      return { from: todayStart, to: now };
    case "yesterday":
      return { from: subDays(todayStart, 1), to: todayStart };
    case "7d":
      return { from: subDays(todayStart, 7), to: now };
    case "30d":
      return { from: subDays(todayStart, 30), to: now };
    case "3m":
      return { from: subMonths(todayStart, 3), to: now };
    case "6m":
      return { from: subMonths(todayStart, 6), to: now };
    case "year":
      return { from: subMonths(todayStart, 12), to: now };
    case "custom":
      if (custom?.from && custom?.to) {
        return { from: startOfDay(new Date(custom.from + "T00:00:00")), to: endOfDay(new Date(custom.to + "T00:00:00")) };
      }
      return { from: subDays(todayStart, 30), to: now };
  }
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function getDashboardOverviewAction(
  range: DashboardRange = "30d",
  customRange?: { from: string; to: string }
) {
  const access = await getAccess("bookings"); const session = access ? {user:access} : null;
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = subDays(todayStart, 1);
  const { from: rangeFrom, to: rangeTo } = rangeToBounds(range, now, customRange);

  const [reservations, inquiries, subscribers] = await Promise.all([
    prisma.reservation.findMany({
      select: {
        id: true,
        customerName: true,
        email: true,
        phone: true,
        guests: true,
        reservationDate: true,
        reservationTime: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inquiry.findMany({
      select: { id: true, name: true, email: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.newsletterSubscriber.findMany({
      select: { id: true, email: true, subscribedAt: true },
      orderBy: { subscribedAt: "desc" },
    }),
  ]);

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const scheduledToday = reservations.filter((r) => isSameDay(r.reservationDate, todayStart) && r.status !== "CANCELLED");
  const scheduledYesterday = reservations.filter((r) => isSameDay(r.reservationDate, yesterdayStart) && r.status !== "CANCELLED");

  // First-ever reservation date per customer email, to detect "new" customers.
  const firstSeenByEmail = new Map<string, Date>();
  for (const r of [...reservations].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    if (!firstSeenByEmail.has(r.email)) firstSeenByEmail.set(r.email, r.createdAt);
  }
  const newCustomersToday = Array.from(firstSeenByEmail.values()).filter((d) => isSameDay(d, todayStart)).length;
  const newCustomersYesterday = Array.from(firstSeenByEmail.values()).filter((d) => isSameDay(d, yesterdayStart)).length;

  const reservationCountByEmail = new Map<string, number>();
  for (const r of reservations) {
    reservationCountByEmail.set(r.email, (reservationCountByEmail.get(r.email) || 0) + 1);
  }
  const repeatCustomers = Array.from(reservationCountByEmail.values()).filter((c) => c > 1).length;

  const pendingCount = reservations.filter((r) => r.status === "PENDING").length;
  const confirmedCount = reservations.filter((r) => r.status === "CONFIRMED").length;
  const completedCount = reservations.filter((r) => r.status === "COMPLETED").length;
  const cancelledCount = reservations.filter((r) => r.status === "CANCELLED").length;

  const pendingCreatedToday = reservations.filter((r) => r.status === "PENDING" && isSameDay(r.createdAt, todayStart)).length;
  const pendingCreatedYesterday = reservations.filter((r) => r.status === "PENDING" && isSameDay(r.createdAt, yesterdayStart)).length;
  const confirmedCreatedToday = reservations.filter((r) => r.status === "CONFIRMED" && isSameDay(r.createdAt, todayStart)).length;
  const confirmedCreatedYesterday = reservations.filter((r) => r.status === "CONFIRMED" && isSameDay(r.createdAt, yesterdayStart)).length;

  const cancelledToday = reservations.filter((r) => r.status === "CANCELLED" && isSameDay(r.updatedAt, todayStart)).length;
  const cancelledYesterday = reservations.filter((r) => r.status === "CANCELLED" && isSameDay(r.updatedAt, yesterdayStart)).length;

  const inquiriesToday = inquiries.filter((i) => isSameDay(i.createdAt, todayStart)).length;
  const inquiriesYesterday = inquiries.filter((i) => isSameDay(i.createdAt, yesterdayStart)).length;

  const cards = [
    { key: "reservationsToday", label: "Reservations Today", value: scheduledToday.length, change: pctChange(scheduledToday.length, scheduledYesterday.length) },
    { key: "newCustomersToday", label: "New Customers Today", value: newCustomersToday, change: pctChange(newCustomersToday, newCustomersYesterday) },
    { key: "totalCustomers", label: "Total Customers", value: firstSeenByEmail.size, change: null, sub: `+${newCustomersToday} today` },
    { key: "repeatCustomers", label: "Repeat Customers", value: repeatCustomers, change: null, sub: firstSeenByEmail.size > 0 ? `${Math.round((repeatCustomers / firstSeenByEmail.size) * 100)}% of total` : undefined },
    { key: "pendingReservations", label: "Pending Reservations", value: pendingCount, change: pctChange(pendingCreatedToday, pendingCreatedYesterday) },
    { key: "confirmedReservations", label: "Confirmed Reservations", value: confirmedCount, change: pctChange(confirmedCreatedToday, confirmedCreatedYesterday) },
    { key: "cancelledToday", label: "Cancelled Today", value: cancelledToday, change: pctChange(cancelledToday, cancelledYesterday) },
    { key: "newInquiriesToday", label: "New Inquiries Today", value: inquiriesToday, change: pctChange(inquiriesToday, inquiriesYesterday) },
  ];

  // ---------- Daily reservations, last 7 days ----------
  const dailySeries: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = subDays(todayStart, i);
    const count = reservations.filter((r) => isSameDay(r.reservationDate, day) && r.status !== "CANCELLED").length;
    dailySeries.push({ label: format(day, "EEE"), value: count });
  }

  // ---------- Weekly reservations, last 12 weeks ----------
  const weeklySeries: { label: string; value: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = startOfWeek(subDays(now, i * 7));
    const weekEnd = startOfWeek(subDays(now, (i - 1) * 7));
    const count = reservations.filter(
      (r) => r.status !== "CANCELLED" && r.reservationDate >= weekStart && r.reservationDate < weekEnd
    ).length;
    weeklySeries.push({ label: format(weekStart, "MMM d"), value: count });
  }

  // ---------- Monthly reservations, last 12 months ----------
  const monthlySeries: { label: string; value: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = startOfMonth(subMonths(now, i - 1));
    const count = reservations.filter(
      (r) => r.status !== "CANCELLED" && r.reservationDate >= monthStart && r.reservationDate < monthEnd
    ).length;
    monthlySeries.push({ label: format(monthStart, "MMM"), value: count });
  }

  // ---------- Status breakdown ----------
  const statusBreakdown = [
    { label: "Pending", value: pendingCount },
    { label: "Confirmed", value: confirmedCount },
    { label: "Completed", value: completedCount },
    { label: "Cancelled", value: cancelledCount },
  ];

  // ---------- Peak hours (all non-cancelled reservations) ----------
  const hourCounts = new Map<number, number>();
  for (const r of reservations) {
    if (r.status === "CANCELLED") continue;
    const hour = Number(r.reservationTime.split(":")[0]);
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }
  const peakHours = Array.from({ length: 24 }, (_, hour) => ({
    label: format(new Date(2000, 0, 1, hour), "h a"),
    value: hourCounts.get(hour) || 0,
  })).filter((h) => h.value > 0);

  // ---------- Recent activity feed ----------
  const activity = [
    ...reservations
      .filter((r) => r.status !== "CANCELLED")
      .slice(0, 10)
      .map((r) => ({
        id: `res-${r.id}`,
        type: "reservation" as const,
        message: `New reservation from ${r.customerName} (${r.guests} guests)`,
        time: r.createdAt,
      })),
    ...reservations
      .filter((r) => r.status === "CANCELLED")
      .slice(0, 5)
      .map((r) => ({
        id: `cancel-${r.id}`,
        type: "cancellation" as const,
        message: `Reservation cancelled — ${r.customerName}`,
        time: r.updatedAt,
      })),
    ...inquiries.slice(0, 10).map((i) => ({
      id: `inq-${i.id}`,
      type: "inquiry" as const,
      message: `New inquiry from ${i.name}`,
      time: i.createdAt,
    })),
    ...subscribers.slice(0, 5).map((s) => ({
      id: `sub-${s.id}`,
      type: "subscriber" as const,
      message: `New newsletter subscriber — ${s.email}`,
      time: s.subscribedAt,
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 10)
    .map((a) => ({ ...a, time: a.time.toISOString() }));

  // ---------- Recent customers (within selected range) ----------
  const inRange = reservations.filter((r) => r.createdAt >= rangeFrom && r.createdAt <= rangeTo);
  const byEmail = new Map<string, typeof reservations>();
  for (const r of inRange) {
    const list = byEmail.get(r.email) || [];
    list.push(r);
    byEmail.set(r.email, list);
  }
  const recentCustomers = Array.from(byEmail.entries())
    .map(([email, list]) => {
      const sorted = [...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const latest = sorted[0];
      const lastVisit = list.reduce((max, r) => (r.reservationDate > max ? r.reservationDate : max), list[0].reservationDate);
      return {
        email,
        name: latest.customerName,
        phone: latest.phone,
        totalReservations: reservationCountByEmail.get(email) || list.length,
        lastVisit: lastVisit.toISOString(),
        status: differenceInCalendarDays(now, lastVisit) <= 60 ? ("active" as const) : ("inactive" as const),
      };
    })
    .sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())
    .slice(0, 20);

  // ---------- Weekly / monthly summary ----------
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const reservationsThisWeek = reservations.filter((r) => r.status !== "CANCELLED" && r.reservationDate >= weekStart);
  const reservationsThisMonth = reservations.filter((r) => r.status !== "CANCELLED" && r.reservationDate >= monthStart);
  const newCustomersThisWeek = Array.from(firstSeenByEmail.values()).filter((d) => d >= weekStart).length;
  const newCustomersThisMonth = Array.from(firstSeenByEmail.values()).filter((d) => d >= monthStart).length;
  const avgPartySizeThisWeek =
    reservationsThisWeek.length > 0
      ? Math.round((reservationsThisWeek.reduce((sum, r) => sum + r.guests, 0) / reservationsThisWeek.length) * 10) / 10
      : 0;

  const dayCountsThisMonth = new Map<string, number>();
  for (const r of reservationsThisMonth) {
    const key = format(r.reservationDate, "EEEE");
    dayCountsThisMonth.set(key, (dayCountsThisMonth.get(key) || 0) + 1);
  }
  const busiestDayThisMonth =
    Array.from(dayCountsThisMonth.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const daysSoFarThisMonth = Math.max(1, differenceInCalendarDays(now, monthStart) + 1);

  return {
    ok: true as const,
    cards,
    dailySeries,
    weeklySeries,
    monthlySeries,
    statusBreakdown,
    peakHours,
    activity,
    recentCustomers,
    weeklySummary: {
      reservations: reservationsThisWeek.length,
      newCustomers: newCustomersThisWeek,
      avgPartySize: avgPartySizeThisWeek,
      repeatCustomers: reservationsThisWeek.filter((r) => (reservationCountByEmail.get(r.email) || 0) > 1).length,
    },
    monthlySummary: {
      reservations: reservationsThisMonth.length,
      newCustomers: newCustomersThisMonth,
      busiestDay: busiestDayThisMonth,
      avgDailyReservations: Math.round((reservationsThisMonth.length / daysSoFarThisMonth) * 10) / 10,
    },
  };
}

// ---------- Reservation operations: today / upcoming / cancelled / table occupancy ----------
export async function getReservationOpsAction() {
  const access = await getAccess("bookings"); const session = access ? {user:access} : null;
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayStr = format(now, "yyyy-MM-dd");

  const [settings, slots, todayReservations, upcomingReservations, recentCancellations] = await Promise.all([
    getSettings(),
    getAvailableSlots(todayStr),
    prisma.reservation.findMany({
      where: { reservationDate: todayStart, status: { not: "CANCELLED" } },
      orderBy: { reservationTime: "asc" },
    }),
    prisma.reservation.findMany({
      where: { reservationDate: { gt: todayStart, lte: addDays(todayStart, 7) }, status: { not: "CANCELLED" } },
      orderBy: { reservationDate: "asc" },
      take: 10,
    }),
    prisma.reservation.findMany({
      where: { status: "CANCELLED" },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentOrNextSlot =
    slots.find((s) => {
      const [h, m] = s.time.split(":").map(Number);
      return h * 60 + m >= currentMinutes;
    }) || slots[slots.length - 1] || null;

  const peakSlot = slots.reduce<typeof slots[number] | null>((max, s) => {
    const booked = s.totalSlots - s.remainingSlots;
    const maxBooked = max ? max.totalSlots - max.remainingSlots : -1;
    return booked > maxBooked ? s : max;
  }, null);

  return {
    ok: true as const,
    tablesAvailable: settings.tablesAvailable,
    currentSlot: currentOrNextSlot
      ? { time: currentOrNextSlot.time, booked: currentOrNextSlot.totalSlots - currentOrNextSlot.remainingSlots, total: currentOrNextSlot.totalSlots }
      : null,
    peakSlotToday: peakSlot
      ? { time: peakSlot.time, booked: peakSlot.totalSlots - peakSlot.remainingSlots, total: peakSlot.totalSlots }
      : null,
    todayReservations: todayReservations.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      guests: r.guests,
      reservationTime: r.reservationTime,
      status: r.status,
      confirmationCode: r.confirmationCode,
    })),
    upcomingReservations: upcomingReservations.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      guests: r.guests,
      reservationDate: r.reservationDate.toISOString(),
      reservationTime: r.reservationTime,
      status: r.status,
    })),
    recentCancellations: recentCancellations.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      reservationDate: r.reservationDate.toISOString(),
      cancelledAt: r.updatedAt.toISOString(),
    })),
  };
}

// ---------- Customer insights: top/loyal customers, repeat rate, visit frequency, churn risk ----------
export async function getCustomerInsightsAction() {
  const access = await getAccess("bookings"); const session = access ? {user:access} : null;
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const reservations = await prisma.reservation.findMany({
    select: { email: true, customerName: true, phone: true, reservationDate: true, createdAt: true },
    orderBy: { reservationDate: "asc" },
  });

  const byEmail = new Map<string, typeof reservations>();
  for (const r of reservations) {
    const list = byEmail.get(r.email) || [];
    list.push(r);
    byEmail.set(r.email, list);
  }

  const now = new Date();
  const profiles = Array.from(byEmail.entries()).map(([email, list]) => {
    const latest = list[list.length - 1];
    const lastVisit = list[list.length - 1].reservationDate;
    const gaps: number[] = [];
    for (let i = 1; i < list.length; i++) {
      gaps.push(differenceInCalendarDays(list[i].reservationDate, list[i - 1].reservationDate));
    }
    const avgGapDays = gaps.length > 0 ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null;
    return {
      email,
      name: latest.customerName,
      phone: latest.phone,
      visitCount: list.length,
      lastVisit,
      avgGapDays,
      daysSinceLastVisit: differenceInCalendarDays(now, lastVisit),
    };
  });

  const totalCustomers = profiles.length;
  const repeatCustomers = profiles.filter((p) => p.visitCount > 1);
  const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers.length / totalCustomers) * 1000) / 10 : 0;
  const avgVisitFrequencyDays =
    repeatCustomers.length > 0 && repeatCustomers.some((p) => p.avgGapDays !== null)
      ? Math.round(
          repeatCustomers.reduce((sum, p) => sum + (p.avgGapDays || 0), 0) /
            repeatCustomers.filter((p) => p.avgGapDays !== null).length
        )
      : null;

  const topCustomers = [...profiles]
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, 5)
    .map((p) => ({ name: p.name, email: p.email, phone: p.phone, visitCount: p.visitCount, lastVisit: p.lastVisit.toISOString() }));

  // Previously-repeat customers who haven't visited in 30-120 days — worth a nudge before they're gone for good.
  const churnRisk = repeatCustomers
    .filter((p) => p.daysSinceLastVisit >= 30 && p.daysSinceLastVisit <= 120)
    .sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit)
    .slice(0, 5)
    .map((p) => ({ name: p.name, email: p.email, phone: p.phone, visitCount: p.visitCount, daysSinceLastVisit: p.daysSinceLastVisit }));

  return {
    ok: true as const,
    totalCustomers,
    repeatCustomerCount: repeatCustomers.length,
    repeatRate,
    avgVisitFrequencyDays,
    topCustomers,
    churnRisk,
  };
}

// ---------- Lightweight recent activity feed (for the header notification bell) ----------
export async function getRecentActivityAction() {
  const access = await getAccess("bookings"); const session = access ? {user:access} : null;
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const [recentReservations, recentCancellations, recentInquiries, recentSubscribers] = await Promise.all([
    prisma.reservation.findMany({
      where: { status: { not: "CANCELLED" } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, customerName: true, guests: true, createdAt: true },
    }),
    prisma.reservation.findMany({
      where: { status: "CANCELLED" },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { id: true, customerName: true, updatedAt: true },
    }),
    prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.newsletterSubscriber.findMany({
      orderBy: { subscribedAt: "desc" },
      take: 4,
      select: { id: true, email: true, subscribedAt: true },
    }),
  ]);

  const activity = [
    ...recentReservations.map((r) => ({
      id: `res-${r.id}`,
      type: "reservation" as const,
      message: `New reservation from ${r.customerName} (${r.guests} guests)`,
      time: r.createdAt,
    })),
    ...recentCancellations.map((r) => ({
      id: `cancel-${r.id}`,
      type: "cancellation" as const,
      message: `Reservation cancelled — ${r.customerName}`,
      time: r.updatedAt,
    })),
    ...recentInquiries.map((i) => ({
      id: `inq-${i.id}`,
      type: "inquiry" as const,
      message: `New inquiry from ${i.name}`,
      time: i.createdAt,
    })),
    ...recentSubscribers.map((s) => ({
      id: `sub-${s.id}`,
      type: "subscriber" as const,
      message: `New newsletter subscriber — ${s.email}`,
      time: s.subscribedAt,
    })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 15)
    .map((a) => ({ ...a, time: a.time.toISOString() }));

  return { ok: true as const, activity };
}

// ---------- Global search across reservations and inquiries ----------
export async function globalSearchAction(query: string) {
  const access = await getAccess("bookings"); const session = access ? {user:access} : null;
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const q = query.trim();
  if (q.length < 2) {
    return { ok: true as const, reservations: [], inquiries: [] };
  }

  const [reservations, inquiries] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        OR: [
          { customerName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { confirmationCode: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, customerName: true, email: true, confirmationCode: true, status: true },
    }),
    prisma.inquiry.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { subject: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, subject: true, status: true },
    }),
  ]);

  return { ok: true as const, reservations, inquiries };
}
