import Fastify from "fastify";
import cors from "@fastify/cors";
import { searchRoutes } from "./routes/searches.js";
import { shareRoutes } from "./routes/share.js";
import { startScheduler } from "./engine/scheduler.js";

const port = Number(process.env.SERVER_PORT ?? 3001);

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/health", async () => ({ status: "ok", service: "flight-tracker-server" }));

await app.register(searchRoutes);
await app.register(shareRoutes);

try {
  await app.listen({ port, host: "0.0.0.0" });
  startScheduler({
    info: (msg) => app.log.info(msg),
    error: (msg) => app.log.error(msg),
  });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
