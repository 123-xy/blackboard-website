"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { newsletterSchema } from "@/lib/validations";

// ---------- Public: subscribe ----------
export async function subscribeToNewsletterAction(email: string) {
  const parsed = newsletterSchema.safeParse({ email });
  if (!parsed.success) {
    return { ok: false as const, error: "Please enter a valid email address" };
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      create: { email: parsed.data.email },
      update: {},
    });
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to subscribe",
    };
  }
}

// ---------- Admin: list subscribers ----------
export async function getNewsletterSubscribersAction(options: { page?: number; limit?: number } = {}) {
  const session = await auth();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));

  const [subscribers, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      orderBy: { subscribedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.newsletterSubscriber.count(),
  ]);

  return {
    ok: true as const,
    subscribers: subscribers.map((s) => ({ ...s, subscribedAt: s.subscribedAt.toISOString() })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ---------- Admin: delete subscriber ----------
export async function deleteNewsletterSubscriberAction(id: string) {
  const session = await auth();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (session.user?.role !== "ADMIN") {
    return { ok: false as const, error: "Only admins can remove subscribers" };
  }

  await prisma.newsletterSubscriber.delete({ where: { id } });
  return { ok: true as const };
}
