import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { z } from "zod";
import { db } from "../db/index.js";
import { users, userSettings } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";

const settingsUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  language: z.enum(["en", "el", "es", "fr"]).optional(),
  timezone: z.string().min(1).optional(),
  notifications: z.record(z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    inApp: z.boolean().optional(),
  })).optional(),
  privacy: z.object({
    profileVisibility: z.enum(["public", "connections", "private"]).optional(),
    showEmail: z.boolean().optional(),
    showLocation: z.boolean().optional(),
    activityStatus: z.boolean().optional(),
    searchable: z.boolean().optional(),
    allowIntros: z.boolean().optional(),
  }).optional(),
});

export const settingsRoutes = new Hono<AppEnv>();
settingsRoutes.use("*", authMiddleware);

settingsRoutes.get("/me", (c) => {
  const userId = c.get("userId") as string;
  const user = db.select({ id: users.id, email: users.email, name: users.name }).from(users).where(eq(users.id, userId)).get();
  if (!user) return c.json({ error: "User not found" }, 404);

  const settings = db.select().from(userSettings).where(eq(userSettings.userId, userId)).get();

  const defaultNotifications: Record<string, { email: boolean; push: boolean; inApp: boolean }> = {
    n1: { email: true, push: true, inApp: true },
    n2: { email: true, push: true, inApp: true },
    n3: { email: true, push: false, inApp: true },
    n4: { email: true, push: true, inApp: true },
    n5: { email: true, push: false, inApp: false },
    n6: { email: false, push: false, inApp: true },
  };

  const defaultPrivacy = {
    profileVisibility: "public" as const,
    showEmail: false,
    showLocation: true,
    activityStatus: true,
    searchable: true,
    allowIntros: true,
  };

  let notifications = defaultNotifications;
  let privacy = defaultPrivacy;
  if (settings?.notifications) {
    try { notifications = { ...defaultNotifications, ...JSON.parse(settings.notifications) }; } catch { /* ignore */ }
  }
  if (settings?.privacy) {
    try { privacy = { ...defaultPrivacy, ...JSON.parse(settings.privacy) }; } catch { /* ignore */ }
  }

  return c.json({
    user: { id: user.id, email: user.email, name: user.name },
    language: settings?.language ?? "en",
    timezone: settings?.timezone ?? "Europe/Athens",
    notifications,
    privacy,
  });
});

settingsRoutes.put("/me", async (c) => {
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const parseResult = settingsUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: "Validation failed", details: parseResult.error.flatten() }, 400);
  }

  const data = parseResult.data;

  if (data.name !== undefined) {
    db.update(users).set({ name: data.name }).where(eq(users.id, userId)).run();
  }

  const updateData: Record<string, unknown> = {};
  if (data.language !== undefined) updateData.language = data.language;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;
  if (data.notifications !== undefined) updateData.notifications = JSON.stringify(data.notifications);
  if (data.privacy !== undefined) updateData.privacy = JSON.stringify(data.privacy);

  if (Object.keys(updateData).length > 0) {
    const existing = db.select({ id: userSettings.id }).from(userSettings).where(eq(userSettings.userId, userId)).get();
    if (existing) {
      db.update(userSettings).set(updateData).where(eq(userSettings.userId, userId)).run();
    } else {
      db.insert(userSettings).values({ userId, ...updateData } as typeof userSettings.$inferInsert).run();
    }
  }

  return c.json({ ok: true });
});
