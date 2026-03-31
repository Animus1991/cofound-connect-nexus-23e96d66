import type { FastifyRequest } from "fastify";
import { verifyToken } from "./jwt.js";

export async function authPreHandler(
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
