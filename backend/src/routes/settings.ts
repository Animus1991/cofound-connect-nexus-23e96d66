import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { verifyToken } from "../lib/jwt.js";

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

async function authPreHandler(
  request: FastifyRequest,
  reply: { status: (code: number) => { send: (body: unknown) => unknown } }
) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }

  (request as FastifyRequest & { userId: string }).userId = payload.userId;
}

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authPreHandler);

  app.get("/me", async (request, reply) => {
    const { userId } = request as FastifyRequest & { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

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
      try {
        notifications = { ...defaultNotifications, ...JSON.parse(settings.notifications) };
      } catch {
        /* ignore */
      }
    }
    if (settings?.privacy) {
      try {
        privacy = { ...defaultPrivacy, ...JSON.parse(settings.privacy) };
      } catch {
        /* ignore */
      }
    }

    return {
      user: { id: user.id, email: user.email, name: user.name },
      language: settings?.language ?? "en",
      timezone: settings?.timezone ?? "Europe/Athens",
      notifications,
      privacy,
    };
  });

  app.put("/me", async (request, reply) => {
    const { userId } = request as FastifyRequest & { userId: string };
    const parseResult = settingsUpdateSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const data = parseResult.data;

    if (data.name !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: data.name },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (data.language !== undefined) updateData.language = data.language;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.notifications !== undefined) updateData.notifications = JSON.stringify(data.notifications);
    if (data.privacy !== undefined) updateData.privacy = JSON.stringify(data.privacy);

    if (Object.keys(updateData).length > 0) {
      await prisma.userSettings.upsert({
        where: { userId },
        create: { userId, ...updateData } as { userId: string; [k: string]: unknown },
        update: updateData,
      });
    }

    return { ok: true };
  });
}
