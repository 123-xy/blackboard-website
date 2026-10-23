import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAccess } from "@/lib/dashboard-store";
import { toCsv } from "@/lib/csv";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// GET /api/contact/export — CSV export of inquiries (admin only)
export async function GET(request: Request) {
  const access = await getAccess("enquiries"); const session = access ? {user:access} : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Prisma.InquiryWhereInput = {};

  if (status && ["NEW", "IN_PROGRESS", "RESOLVED"].includes(status)) {
    where.status = status as "NEW" | "IN_PROGRESS" | "RESOLVED";
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
    ];
  }

  const inquiries = await prisma.inquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    inquiries.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
    })),
    [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      { key: "subject", header: "Subject" },
      { key: "message", header: "Message" },
      { key: "status", header: "Status" },
      { key: "isSpam", header: "Is Spam" },
      { key: "spamScore", header: "Spam Score" },
      { key: "createdAt", header: "Created At" },
    ]
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inquiries-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
