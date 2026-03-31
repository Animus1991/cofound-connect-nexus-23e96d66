import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { verifyToken } from "../lib/jwt.js";

function parseJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  headline: z.string().max(200).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  availability: z.string().max(50).optional(),
  stage: z.string().max(50).optional(),
  commitment: z.string().max(50).optional(),
  compensation: z.string().max(100).optional(),
  lookingFor: z.string().max(100).optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  linkedin: z.string().max(200).optional(),
  github: z.string().max(200).optional(),
  website: z.string().max(200).optional(),
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

export async function profilesRoutes(app: FastifyInstance) {
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

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    const p = profile ?? {
      headline: null,
      bio: null,
      location: null,
      availability: null,
      stage: null,
      commitment: null,
      compensation: null,
      lookingFor: null,
      skills: "[]",
      interests: "[]",
      linkedin: null,
      github: null,
      website: null,
    };
    return {
      user: { id: user.id, email: user.email, name: user.name },
      profile: {
        ...p,
        skills: parseJsonArray(typeof p.skills === "string" ? p.skills : null),
        interests: parseJsonArray(typeof p.interests === "string" ? p.interests : null),
      },
    };
  });

  app.get("/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };

    const profile = await prisma.profile.findFirst({
      where: { userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return reply.status(404).send({ error: "Profile not found" });
    }

    return {
      name: user.name,
      ...profile,
      skills: parseJsonArray(profile?.skills),
      interests: parseJsonArray(profile?.interests),
    };
  });

  app.put("/me", async (request, reply) => {
    const { userId } = request as FastifyRequest & { userId: string };
    const parseResult = profileUpdateSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.flatten(),
      });
    }

    const data = parseResult.data;
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: data.name },
      });
    }
    if (data.headline !== undefined) updateData.headline = data.headline;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.availability !== undefined) updateData.availability = data.availability;
    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.commitment !== undefined) updateData.commitment = data.commitment;
    if (data.compensation !== undefined) updateData.compensation = data.compensation;
    if (data.lookingFor !== undefined) updateData.lookingFor = data.lookingFor;
    if (data.skills !== undefined) updateData.skills = JSON.stringify(data.skills);
    if (data.interests !== undefined) updateData.interests = JSON.stringify(data.interests);
    if (data.linkedin !== undefined) updateData.linkedin = data.linkedin || null;
    if (data.github !== undefined) updateData.github = data.github || null;
    if (data.website !== undefined) updateData.website = data.website || null;

    const profile = await prisma.profile.upsert({
      where: { userId },
      create: { userId, ...updateData } as { userId: string; [k: string]: unknown },
      update: updateData,
    });

    return {
      ...profile,
      skills: parseJsonArray(profile.skills),
      interests: parseJsonArray(profile.interests),
    };
  });
}
