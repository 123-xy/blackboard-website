import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { formatDateShort, formatTime } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// GET /api/reservations/export — CSV export of reservations (admin only)
export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const date = searchParams.get("date");

  const where: Prisma.ReservationWhereInput = {};

  if (status && ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) {
    where.status = status as "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  }

  if (date) {
    where.reservationDate = new Date(date + "T00:00:00.000Z");
  }

  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { confirmationCode: { contains: search, mode: "insensitive" } },
    ];
  }

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    reservations.map((r) => ({
      ...r,
      reservationDate: formatDateShort(r.reservationDate),
      reservationTime: formatTime(r.reservationTime),
      createdAt: r.createdAt.toISOString(),
    })),
    [
      { key: "confirmationCode", header: "Confirmation Code" },
      { key: "customerName", header: "Customer Name" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      { key: "guests", header: "Guests" },
      { key: "reservationDate", header: "Date" },
      { key: "reservationTime", header: "Time" },
      { key: "status", header: "Status" },
      { key: "notes", header: "Notes" },
      { key: "createdAt", header: "Created At" },
    ]
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservations-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
