"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { updateInquirySchema } from "@/lib/validations";
import { sendInquiryResolvedEmail } from "@/lib/services/contact-email";
import { sendInquiryResolvedWhatsApp } from "@/lib/services/whatsapp";
import type { Prisma } from "@prisma/client";

// ---------- Admin: list inquiries ----------
export async function getAllInquiries(options: {
  page?: number;
  limit?: number;
  status?: "NEW" | "IN_PROGRESS" | "RESOLVED";
  search?: string;
} = {}) {
  const session = await auth();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));

  const where: Prisma.InquiryWhereInput = {};
  if (options.status) where.status = options.status;
  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { email: { contains: options.search, mode: "insensitive" } },
      { subject: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const [inquiries, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inquiry.count({ where }),
  ]);

  return {
    ok: true as const,
    inquiries: inquiries.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ---------- Admin: get single inquiry ----------
export async function getInquiry(id: string) {
  const session = await auth();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) {
    return { ok: false as const, error: "Inquiry not found" };
  }

  return { ok: true as const, inquiry };
}

// Notify the customer their request is confirmed — best-effort, never throws.
async function notifyInquiryResolved(inquiry: { name: string; email: string; phone: string | null; subject: string; message: string }) {
  const [emailResult, whatsappResult] = await Promise.all([
    sendInquiryResolvedEmail({
      name: inquiry.name,
      email: inquiry.email,
      subject: inquiry.subject,
      message: inquiry.message,
    }),
    inquiry.phone
      ? sendInquiryResolvedWhatsApp({
          phone: inquiry.phone,
          name: inquiry.name,
          subject: inquiry.subject,
          message: inquiry.message,
        })
      : Promise.resolve({ ok: false as const, error: "No phone number on file" }),
  ]);
  return { email: emailResult.ok, whatsapp: whatsappResult.ok };
}

// ---------- Admin: update status ----------
export async function updateInquiryStatus(id: string, status: "NEW" | "IN_PROGRESS" | "RESOLVED") {
  const session = await auth();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const parsed = updateInquirySchema.safeParse({ status });
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid status" };
  }

  let inquiry;
  try {
    inquiry = await prisma.inquiry.update({
      where: { id },
      data: { status: parsed.data.status },
    });
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to update inquiry",
    };
  }

  const notified = parsed.data.status === "RESOLVED" ? await notifyInquiryResolved(inquiry) : null;

  return { ok: true as const, inquiry, notified };
}

// ---------- Admin: bulk update status ----------
export async function bulkUpdateInquiryStatusAction(ids: string[], status: "NEW" | "IN_PROGRESS" | "RESOLVED") {
  const session = await auth();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  if (ids.length === 0) {
    return { ok: false as const, error: "No inquiries selected" };
  }

  await prisma.inquiry.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });

  if (status !== "RESOLVED") {
    return { ok: true as const, notifiedCount: 0, failedCount: 0 };
  }

  const inquiries = await prisma.inquiry.findMany({ where: { id: { in: ids } } });
  const results = await Promise.all(inquiries.map((i) => notifyInquiryResolved(i)));
  const notifiedCount = results.filter((r) => r.email || r.whatsapp).length;

  return { ok: true as const, notifiedCount, failedCount: results.length - notifiedCount };
}

// ---------- Admin: bulk delete ----------
export async function bulkDeleteInquiriesAction(ids: string[]) {
  const session = await auth();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (session.user?.role !== "ADMIN") {
    return { ok: false as const, error: "Only admins can delete inquiries" };
  }

  if (ids.length === 0) {
    return { ok: false as const, error: "No inquiries selected" };
  }

  const result = await prisma.inquiry.deleteMany({ where: { id: { in: ids } } });
  return { ok: true as const, deletedCount: result.count };
}

// ---------- Admin: delete inquiry ----------
export async function deleteInquiry(id: string) {
  const session = await auth();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (session.user?.role !== "ADMIN") {
    return { ok: false as const, error: "Only admins can delete inquiries" };
  }

  try {
    await prisma.inquiry.delete({ where: { id } });
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to delete inquiry",
    };
  }
}

// ---------- Admin: inquiry stats ----------
export async function getInquiryStatsAction() {
  const session = await auth();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const [total, newCount, inProgressCount, resolvedCount, spamCount] = await Promise.all([
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.inquiry.count({ where: { status: "IN_PROGRESS" } }),
    prisma.inquiry.count({ where: { status: "RESOLVED" } }),
    prisma.inquiry.count({ where: { isSpam: true } }),
  ]);

  return {
    ok: true as const,
    stats: { total, newCount, inProgressCount, resolvedCount, spamCount },
  };
}
