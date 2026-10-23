import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAccess } from "@/lib/dashboard-store";
import { toCsv } from "@/lib/csv";

export const runtime = "nodejs";

// GET /api/newsletter/export — CSV export of newsletter subscribers (admin only)
export async function GET() {
  const access = await getAccess("settings"); const session = access ? {user:access} : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { subscribedAt: "desc" },
  });

  const csv = toCsv(
    subscribers.map((s) => ({ ...s, subscribedAt: s.subscribedAt.toISOString() })),
    [
      { key: "email", header: "Email" },
      { key: "subscribedAt", header: "Subscribed At" },
    ]
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
