import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";
import type { Db } from "./db";
import { orderRoutes } from "./routes/orders";
import { restaurantRoutes } from "./routes/restaurants";

export async function buildApp(db: Db, opts: { logger?: boolean; webOrigin?: string } = {}) {
  const app = Fastify({ logger: opts.logger ?? false });
  await app.register(cors, { origin: opts.webOrigin ?? "http://localhost:3000" });

  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: "BAD_REQUEST", issues: error.issues });
    }
    const status = error.statusCode ?? 500;
    if (status < 500) return reply.code(status).send({ error: error.code ?? "BAD_REQUEST", message: error.message });
    app.log.error(error);
    return reply.code(500).send({ error: "INTERNAL" });
  });

  app.get("/health", async () => ({ ok: true }));
  restaurantRoutes(app, db);
  orderRoutes(app, db);
  return app;
}
