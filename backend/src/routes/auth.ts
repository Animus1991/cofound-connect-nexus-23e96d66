import { randomBytes, timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { users, refreshTokens, passwordResetTokens } from "../db/schema.js";
import { eq, and, lt } from "drizzle-orm";
import { signToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";
import { sendPasswordResetEmail } from "../lib/mailer.js";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? "12", 10);
/**
 * A dummy password hash used when the email is not found.
 * Running bcrypt.compare against it ensures constant-time response
 * and prevents email enumeration via timing side-channel.
 */
const DUMMY_HASH = "$2b$12$IyZ8YqDKBpV6gv5SmvxwMO6VyJo5Ek.kM.xALsJRmVeqIkFD3TLVC";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  roles: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({ email: z.string().email() });

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json({ error: "Validation failed", details: parseResult.error.flatten() }, 400);
    }

    const { name, password } = parseResult.data;
    const email = parseResult.data.email.toLowerCase();

    const existing = db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
    if (existing) {
      return c.json({ error: "Email already registered" }, 409);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = db.insert(users).values({ email, name, password: hashedPassword }).returning().get();

    const token = signToken({ userId: user.id, email: user.email });
    const refreshToken = randomBytes(32).toString("hex");
    const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt: refreshExpires }).run();

    return c.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
      refreshToken,
      expiresIn: 900,
    }, 201);
  } catch (err) {
    logger.error({ err }, "Register failed");
    const e = err as { message?: string };
    if (e.message?.includes("UNIQUE constraint failed")) {
      return c.json({ error: "Email already registered" }, 409);
    }
    return c.json({ error: "Unable to create account. Please try again." }, 500);
  }
});

authRoutes.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json({ error: "Validation failed", details: parseResult.error.flatten() }, 400);
    }

    const { password } = parseResult.data;
    const email = parseResult.data.email.toLowerCase();

    const user = db.select().from(users).where(eq(users.email, email)).get();

    // Always run bcrypt.compare to prevent email-enumeration via timing side-channel.
    // If user not found, compare against a pre-computed dummy hash (constant time).
    const hashToCompare = user?.password ?? DUMMY_HASH;
    const valid = await bcrypt.compare(password, hashToCompare);

    if (!user || !valid) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const token = signToken({ userId: user.id, email: user.email });
    const refreshToken = randomBytes(32).toString("hex");
    const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.transaction((tx) => {
      // Clean up expired/old refresh tokens for this user before inserting new one.
      tx.delete(refreshTokens).where(
        and(eq(refreshTokens.userId, user.id), lt(refreshTokens.expiresAt, new Date().toISOString()))
      ).run();
      tx.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt: refreshExpires }).run();
    });

    return c.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
      refreshToken,
      expiresIn: 900,
    });
  } catch (err) {
    logger.error({ err }, "Login failed");
    return c.json({ error: "Unable to sign in. Please try again." }, 500);
  }
});

authRoutes.post("/forgot-password", async (c) => {
  try {
    const body = await c.req.json();
    const parseResult = forgotPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json({ error: "Validation failed", details: parseResult.error.flatten() }, 400);
    }

    const { email } = parseResult.data;
    const normalizedEmail = email.toLowerCase();
    const user = db.select().from(users).where(eq(users.email, normalizedEmail)).get();
    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      db.insert(passwordResetTokens).values({ userId: user.id, token, expiresAt }).run();
      try {
        await sendPasswordResetEmail(normalizedEmail, token);
      } catch {
        // Email delivery failure is non-fatal — token is still stored; user can retry.
        logger.warn({ email: normalizedEmail }, "Password reset email delivery failed");
      }
    }
    return c.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Forgot password failed");
    return c.json({ error: "Something went wrong. Please try again." }, 500);
  }
});

authRoutes.post("/reset-password", async (c) => {
  try {
    const body = await c.req.json();
    const parseResult = resetPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json({ error: "Validation failed", details: parseResult.error.flatten() }, 400);
    }

    const { token, password } = parseResult.data;
    const record = db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).get();
    if (!record || record.usedAt || new Date(record.expiresAt) < new Date()) {
      return c.json({ error: "Invalid or expired reset link. Please request a new one." }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    db.transaction((tx) => {
      tx.update(users).set({ password: hashedPassword }).where(eq(users.id, record.userId)).run();
      tx.update(passwordResetTokens).set({ usedAt: new Date().toISOString() }).where(eq(passwordResetTokens.id, record.id)).run();
    });

    return c.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Reset password failed");
    return c.json({ error: "Something went wrong. Please try again." }, 500);
  }
});

authRoutes.post("/refresh", async (c) => {
  try {
    const body = await c.req.json();
    const parseResult = refreshSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json({ error: "Validation failed", details: parseResult.error.flatten() }, 400);
    }

    const { refreshToken } = parseResult.data;
    const record = db.select().from(refreshTokens).where(eq(refreshTokens.token, refreshToken)).get();
    if (!record || new Date(record.expiresAt) < new Date()) {
      // Delete stale token if found but expired
      if (record) db.delete(refreshTokens).where(eq(refreshTokens.id, record.id)).run();
      return c.json({ error: "Invalid or expired refresh token" }, 401);
    }

    const user = db.select().from(users).where(eq(users.id, record.userId)).get();
    if (!user) {
      db.delete(refreshTokens).where(eq(refreshTokens.id, record.id)).run();
      return c.json({ error: "User not found" }, 401);
    }

    const newAccessToken = signToken({ userId: record.userId, email: user.email });

    // Refresh token rotation: delete old token, issue new one.
    // This ensures each refresh token is single-use, preventing replay attacks.
    const newRefreshToken = randomBytes(32).toString("hex");
    const newRefreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.transaction((tx) => {
      tx.delete(refreshTokens).where(eq(refreshTokens.id, record.id)).run();
      tx.insert(refreshTokens).values({ userId: user.id, token: newRefreshToken, expiresAt: newRefreshExpires }).run();
    });

    return c.json({ token: newAccessToken, refreshToken: newRefreshToken, expiresIn: 900 });
  } catch (err) {
    logger.error({ err }, "Refresh failed");
    return c.json({ error: "Something went wrong. Please try again." }, 500);
  }
});
