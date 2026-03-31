import { randomBytes } from "node:crypto";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  roles: z.array(z.string()).min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (request, reply) => {
    try {
      const parseResult = registerSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parseResult.error.flatten(),
        });
      }

      const { name, email, password } = parseResult.data;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return reply.status(409).send({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });

      const token = signToken({ userId: user.id, email: user.email });
      const refreshToken = randomBytes(32).toString("hex");
      const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await prisma.refreshToken.create({
        data: { userId: user.id, token: refreshToken, expiresAt: refreshExpires },
      });

      return reply.status(201).send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
        refreshToken,
        expiresIn: 900,
      });
    } catch (err) {
      request.log.error(err, "Register failed");
      const e = err as { code?: string; name?: string; message?: string };
      if (e.code === "P2002") {
        return reply.status(409).send({ error: "Email already registered" });
      }
      if (
        e.code === "P1001" ||
        e.code === "P1002" ||
        e.name === "PrismaClientInitializationError" ||
        (e.message && e.message.includes("Can't reach database"))
      ) {
        return reply.status(503).send({
          error: "Database unavailable. Please start PostgreSQL (e.g. docker compose up -d) and try again.",
        });
      }
      return reply.status(500).send({
        error: "Unable to create account. Please try again.",
      });
    }
  });

  app.post("/login", async (request, reply) => {
    try {
      const parseResult = loginSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parseResult.error.flatten(),
        });
      }

      const { email, password } = parseResult.data;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(401).send({ error: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return reply.status(401).send({ error: "Invalid email or password" });
      }

      const token = signToken({ userId: user.id, email: user.email });
      const refreshToken = randomBytes(32).toString("hex");
      const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await prisma.refreshToken.create({
        data: { userId: user.id, token: refreshToken, expiresAt: refreshExpires },
      });

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
        refreshToken,
        expiresIn: 900,
      });
    } catch (err) {
      request.log.error(err, "Login failed");
      const e = err as { code?: string; name?: string; message?: string };
      if (
        e.code === "P1001" ||
        e.code === "P1002" ||
        e.name === "PrismaClientInitializationError" ||
        (e.message && e.message.includes("Can't reach database"))
      ) {
        return reply.status(503).send({
          error: "Database unavailable. Please start PostgreSQL (e.g. docker compose up -d) and try again.",
        });
      }
      return reply.status(500).send({
        error: "Unable to sign in. Please try again.",
      });
    }
  });

  app.post("/forgot-password", async (request, reply) => {
    try {
      const parseResult = forgotPasswordSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parseResult.error.flatten(),
        });
      }
      const { email } = parseResult.data;
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await prisma.passwordResetToken.create({
          data: { userId: user.id, token, expiresAt },
        });
        if (process.env.NODE_ENV !== "production") {
          request.log.info({ token, email }, "Password reset token (dev only)");
        }
      }
      return reply.send({ ok: true });
    } catch (err) {
      request.log.error(err, "Forgot password failed");
      return reply.status(500).send({ error: "Something went wrong. Please try again." });
    }
  });

  app.post("/reset-password", async (request, reply) => {
    try {
      const parseResult = resetPasswordSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parseResult.error.flatten(),
        });
      }
      const { token, password } = parseResult.data;
      const record = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });
      if (!record || record.usedAt || record.expiresAt < new Date()) {
        return reply.status(400).send({ error: "Invalid or expired reset link. Please request a new one." });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.$transaction([
        prisma.user.update({
          where: { id: record.userId },
          data: { password: hashedPassword },
        }),
        prisma.passwordResetToken.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        }),
      ]);
      return reply.send({ ok: true });
    } catch (err) {
      request.log.error(err, "Reset password failed");
      return reply.status(500).send({ error: "Something went wrong. Please try again." });
    }
  });

  app.post("/refresh", async (request, reply) => {
    try {
      const parseResult = refreshSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parseResult.error.flatten(),
        });
      }
      const { refreshToken } = parseResult.data;
      const record = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });
      if (!record || record.expiresAt < new Date()) {
        return reply.status(401).send({ error: "Invalid or expired refresh token" });
      }
      const token = signToken({ userId: record.userId, email: record.user.email });
      return reply.send({
        token,
        expiresIn: 900,
      });
    } catch (err) {
      request.log.error(err, "Refresh failed");
      return reply.status(500).send({ error: "Something went wrong. Please try again." });
    }
  });
}
