"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createAdminUserSchema } from "@/lib/validations";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return null;
  }
  return session;
}

// ---------- Admin: list admin users ----------
export async function getAdminUsersAction() {
  const session = await requireAdmin();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return {
    ok: true as const,
    users: users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
  };
}

// ---------- Admin: create a staff/admin user ----------
export async function createAdminUserAction(input: { email: string; password: string; name?: string; role: "ADMIN" | "STAFF" }) {
  const session = await requireAdmin();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const parsed = createAdminUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message || "Validation failed",
    };
  }

  const existing = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { ok: false as const, error: "A user with that email already exists" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.adminUser.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      name: parsed.data.name || null,
      role: parsed.data.role,
    },
  });

  return { ok: true as const, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}

// ---------- Admin: change a user's role ----------
export async function updateAdminUserRoleAction(id: string, role: "ADMIN" | "STAFF") {
  const session = await requireAdmin();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  if (session.user?.id === id && role !== "ADMIN") {
    return { ok: false as const, error: "You can't remove your own admin access" };
  }

  await prisma.adminUser.update({ where: { id }, data: { role } });
  return { ok: true as const };
}

// ---------- Admin: delete a user ----------
export async function deleteAdminUserAction(id: string) {
  const session = await requireAdmin();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  if (session.user?.id === id) {
    return { ok: false as const, error: "You can't delete your own account" };
  }

  const adminCount = await prisma.adminUser.count({ where: { role: "ADMIN" } });
  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (target?.role === "ADMIN" && adminCount <= 1) {
    return { ok: false as const, error: "Can't delete the last remaining admin" };
  }

  await prisma.adminUser.delete({ where: { id } });
  return { ok: true as const };
}
