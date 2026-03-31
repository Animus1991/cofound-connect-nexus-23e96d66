import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authPreHandler } from "../lib/auth.js";

function parseJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const requestConnectionSchema = z.object({
  toId: z.string().min(1),
  message: z.string().max(500).optional(),
});

export async function connectionsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authPreHandler);

  app.get("/", async (request) => {
    const { userId } = request as FastifyRequest & { userId: string };

    const connections = await prisma.connection.findMany({
      where: { OR: [{ userId }, { targetId: userId }] },
      include: {
        user: { select: { id: true, name: true }, include: { profile: true } },
        target: { select: { id: true, name: true }, include: { profile: true } },
      },
    });

    const items = connections.map((c) => {
      const other = c.userId === userId ? c.target : c.user;
      const profile = other.profile;
      return {
        id: c.id,
        userId: other.id,
        name: other.name ?? "Unknown",
        headline: profile?.headline ?? null,
        location: profile?.location ?? null,
        skills: parseJsonArray(profile?.skills),
        connectedSince: c.createdAt,
      };
    });

    return { connections: items };
  });

  app.get("/suggested", async (request) => {
    const { userId } = request as FastifyRequest & { userId: string };

    const [connections, requests] = await Promise.all([
      prisma.connection.findMany({
        where: { OR: [{ userId }, { targetId: userId }] },
        select: { userId: true, targetId: true },
      }),
      prisma.connectionRequest.findMany({
        where: {
          OR: [{ fromId: userId }, { toId: userId }],
          status: "pending",
        },
        select: { fromId: true, toId: true },
      }),
    ]);

    const connectedIds = new Set<string>();
    connections.forEach((c) => {
      connectedIds.add(c.userId);
      connectedIds.add(c.targetId);
    });
    const pendingIds = new Set<string>();
    requests.forEach((r) => {
      pendingIds.add(r.fromId);
      pendingIds.add(r.toId);
    });

    const excludeIds = new Set([userId, ...connectedIds, ...pendingIds]);

    const suggested = await prisma.user.findMany({
      where: {
        id: { notIn: [...excludeIds] },
      },
      include: { profile: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    return {
      suggested: suggested.map((u) => {
        const skills = parseJsonArray(u.profile?.skills);
        return {
          id: u.id,
          name: u.name ?? "Unknown",
          headline: u.profile?.headline ?? null,
          skills,
          matchScore: Math.min(95, 50 + skills.length * 5),
          reason: skills.length > 0 ? `Shares skills: ${skills.slice(0, 3).join(", ")}` : "New to the platform",
          mutualConnections: 0,
        };
      }),
    };
  });

  app.get("/requests", async (request) => {
    const { userId } = request as FastifyRequest & { userId: string };

    const [incoming, outgoing] = await Promise.all([
      prisma.connectionRequest.findMany({
        where: { toId: userId, status: "pending" },
        include: { from: { select: { id: true, name: true }, include: { profile: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.connectionRequest.findMany({
        where: { fromId: userId, status: "pending" },
        include: { to: { select: { id: true, name: true }, include: { profile: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      incoming: incoming.map((r) => ({
        id: r.id,
        fromId: r.fromId,
        name: r.from.name ?? "Unknown",
        headline: r.from.profile?.headline ?? null,
        message: r.message,
        createdAt: r.createdAt,
      })),
      outgoing: outgoing.map((r) => ({
        id: r.id,
        toId: r.toId,
        name: r.to.name ?? "Unknown",
        headline: r.to.profile?.headline ?? null,
        message: r.message,
        createdAt: r.createdAt,
      })),
    };
  });

  app.post("/request", async (request, reply) => {
    const { userId } = request as FastifyRequest & { userId: string };
    const parseResult = requestConnectionSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const { toId, message } = parseResult.data;
    if (toId === userId) {
      return reply.status(400).send({ error: "Cannot connect to yourself" });
    }

    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { userId, targetId: toId },
          { userId: toId, targetId: userId },
        ],
      },
    });
    if (existingConnection) {
      return reply.status(409).send({ error: "Already connected" });
    }

    const existingRequest = await prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { fromId: userId, toId, status: "pending" },
          { fromId: toId, toId: userId, status: "pending" },
        ],
      },
    });
    if (existingRequest) {
      return reply.status(409).send({ error: "Request already exists" });
    }

    const req = await prisma.connectionRequest.create({
      data: { fromId: userId, toId, message: message ?? null },
    });
    return reply.status(201).send({ id: req.id, ok: true });
  });

  app.post("/requests/:id/accept", async (request, reply) => {
    const { userId } = request as FastifyRequest & { userId: string };
    const { id } = request.params as { id: string };

    const connReq = await prisma.connectionRequest.findUnique({
      where: { id, toId: userId, status: "pending" },
    });
    if (!connReq) {
      return reply.status(404).send({ error: "Request not found or already handled" });
    }

    await prisma.$transaction([
      prisma.connectionRequest.update({
        where: { id },
        data: { status: "accepted" },
      }),
      prisma.connection.create({
        data: { userId: connReq.fromId, targetId: connReq.toId },
      }),
      prisma.connection.create({
        data: { userId: connReq.toId, targetId: connReq.fromId },
      }),
    ]);

    return { ok: true };
  });

  app.post("/requests/:id/decline", async (request, reply) => {
    const { userId } = request as FastifyRequest & { userId: string };
    const { id } = request.params as { id: string };

    const connReq = await prisma.connectionRequest.findUnique({
      where: { id, toId: userId, status: "pending" },
    });
    if (!connReq) {
      return reply.status(404).send({ error: "Request not found or already handled" });
    }

    await prisma.connectionRequest.update({
      where: { id },
      data: { status: "declined" },
    });

    return { ok: true };
  });
}
