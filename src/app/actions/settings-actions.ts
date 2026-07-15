"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/booking";
import { restaurantSettingsSchema } from "@/lib/validations";

// ---------- Admin: get restaurant settings ----------
export async function getSettingsAction() {
  const session = await auth();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const settings = await getSettings();
  return { ok: true as const, settings };
}

// ---------- Admin: update restaurant settings ----------
export async function updateSettingsAction(input: {
  openingTime: string;
  closingTime: string;
  tablesAvailable: number;
  slotDuration: number;
  maxGuestsPerBooking: number;
}) {
  const session = await auth();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (session.user?.role !== "ADMIN") {
    return { ok: false as const, error: "Only admins can change restaurant settings" };
  }

  const parsed = restaurantSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const settings = await prisma.restaurantSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...parsed.data },
      update: parsed.data,
    });
    return { ok: true as const, settings };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to update settings",
    };
  }
}
