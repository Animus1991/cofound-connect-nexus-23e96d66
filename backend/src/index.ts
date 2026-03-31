import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { prisma } from "./lib/prisma.js";
import { authRoutes } from "./routes/auth.js";
import { profilesRoutes } from "./routes/profiles.js";
import { settingsRoutes } from "./routes/settings.js";
import { connectionsRoutes } from "./routes/connections.js";
import { opportunitiesRoutes } from "./routes/opportunities.js";
import { messagesRoutes } from "./routes/messages.js";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:8080",
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  app.get("/health/db", async (_, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.send({ status: "ok", database: "connected" });
    } catch (err) {
      app.log.error(err, "Database health check failed");
      return reply.status(503).send({
        status: "error",
        database: "disconnected",
        hint: "Run: npm run db:push",
      });
    }
  });

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(profilesRoutes, { prefix: "/api/profiles" });
  await app.register(settingsRoutes, { prefix: "/api/settings" });
  await app.register(connectionsRoutes, { prefix: "/api/connections" });
  await app.register(opportunitiesRoutes, { prefix: "/api/opportunities" });
  await app.register(messagesRoutes, { prefix: "/api/messages" });

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`CoFounderBay API running at http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
