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

const createOpportunitySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["cofounder", "job", "freelance"]).optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().max(100).optional(),
  compensation: z.string().max(200).optional(),
  stage: z.string().max(50).optional(),
});

const updateOpportunitySchema = createOpportunitySchema.partial();

const applySchema = z.object({
  message: z.string().max(1000).optional(),
});

const updateApplicationStatusSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

export async function opportunitiesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authPreHandler);

  app.get("/", async (request) => {
    const { search, type, stage } = request.query as { search?: string; type?: string; stage?: string };

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (stage) where.stage = stage;
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ];
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return {
      opportunities: opportunities.map((o) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        type: o.type,
        skills: parseJsonArray(o.skills),
        location: o.location,
        compensation: o.compensation,
        stage: o.stage,
        orgName: o.user.name ?? "Unknown",
        applicants: o._count.applications,
        createdAt: o.createdAt,
      })),
    };
  });

  app.get("/my", async (request) => {
    const { userId } = request as FastifyRequest & { userId: string };

    const opportunities = await prisma.opportunity.findMany({
      where: { userId },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      opportunities: opportunities.map((o) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        type: o.type,
        skills: parseJsonArray(o.skills),
        location: o.location,
        compensation: o.compensation,
        stage: o.stage,
        applicants: o._count.applications,
        createdAt: o.createdAt,
      })),
    };
  });

  app.post("/", async (request, reply) => {
    const { userId } = request as FastifyRequest & { userId: string };
    const parseResult = createOpportunitySchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const data = parseResult.data;
    const opp = await prisma.opportunity.create({
      data: {
        userId,
        title: data.title,
        description: data.description ?? null,
        type: data.type ?? "cofounder",
        skills: data.skills ? JSON.stringify(data.skills) : "[]",
        location: data.location ?? null,
        compensation: data.compensation ?? null,
        stage: data.stage ?? null,
      },
    });

    return reply.status(201).send({
      id: opp.id,
      title: opp.title,
      type: opp.type,
      createdAt: opp.createdAt,
    });
  });

  app.put("/:id", async (request, reply) => {
    const { userId } = request as FastifyRequest & { userId: string };
    const { id } = request.params as { id: string };
    const parseResult = updateOpportunitySchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const existing = await prisma.opportunity.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return reply.status(404).send({ error: "Opportunity not found" });
    }

    const data = parseResult.data;
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.skills !== undefined) updateData.skills = JSON.stringify(data.skills);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.compensation !== undefined) updateData.compensation = data.compensation;
    if (data.stage !== undefined) updateData.stage = data.stage;

    await prisma.opportunity.update({
      where: { id },
      data: updateData,
    });

    return { ok: true };
  });

  app.post("/:id/apply", async (request, reply) => {
    const { userId } = request as FastifyRequest & { userId: string };
    const { id } = request.params as { id: string };
    const parseResult = applySchema.safeParse(request.body ?? {});

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const opp = await prisma.opportunity.findUnique({ where: { id } });
    if (!opp) {
      return reply.status(404).send({ error: "Opportunity not found" });
    }
    if (opp.userId === userId) {
      return reply.status(400).send({ error: "Cannot apply to your own opportunity" });
    }

    const existing = await prisma.application.findUnique({
      where: {
        opportunityId_userId: { opportunityId: id, userId },
      },
    });
    if (existing) {
      return reply.status(409).send({ error: "Already applied" });
    }

    await prisma.application.create({
      data: {
        opportunityId: id,
        userId,
        message: parseResult.data.message ?? null,
      },
    });

    return reply.status(201).send({ ok: true });
  });

  app.get("/applications", async (request) => {
    const { userId } = request as FastifyRequest & { userId: string };

    const applications = await prisma.application.findMany({
      where: { userId },
      include: {
        opportunity: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      applications: applications.map((a) => ({
        id: a.id,
        opportunityId: a.opportunityId,
        opportunityTitle: a.opportunity.title,
        orgName: a.opportunity.user.name ?? "Unknown",
        message: a.message,
        status: a.status,
        createdAt: a.createdAt,
      })),
    };
  });

  // Applications received on my opportunities (proposals)
  app.get("/received-applications", async (request) => {
    const { userId } = request as FastifyRequest & { userId: string };

    const applications = await prisma.application.findMany({
      where: {
        opportunity: { userId },
      },
      include: {
        user: { select: { id: true, name: true } },
        opportunity: { select: { id: true, title: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      proposals: applications.map((a) => ({
        id: a.id,
        fromId: a.userId,
        fromName: a.user.name ?? "Unknown",
        fromInitials: (a.user.name ?? "?")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "?",
        fromRole: a.opportunity.type === "cofounder" ? "Co-founder" : a.opportunity.type === "job" ? "Applicant" : "Freelancer",
        scope: a.message ?? a.opportunity.title,
        timeframe: "",
        compensation: "",
        message: a.message,
        status: a.status,
        createdAt: a.createdAt,
      })),
    };
  });

  app.patch("/applications/:id", async (request, reply) => {
    const { userId } = request as FastifyRequest & { userId: string };
    const { id } = request.params as { id: string };
    const parseResult = updateApplicationStatusSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const app = await prisma.application.findUnique({
      where: { id },
      include: { opportunity: true },
    });
    if (!app) return reply.status(404).send({ error: "Application not found" });
    if (app.opportunity.userId !== userId) {
      return reply.status(403).send({ error: "Only the opportunity owner can update applications" });
    }

    await prisma.application.update({
      where: { id },
      data: { status: parseResult.data.status },
    });
    return { ok: true };
  });
}
