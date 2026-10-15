import { buildApp } from "./app";
import { prisma } from "./db";

const app = await buildApp(prisma, { logger: true, webOrigin: process.env.WEB_ORIGIN });
const port = Number(process.env.API_PORT ?? 4000);
await app.listen({ port, host: "0.0.0.0" });
