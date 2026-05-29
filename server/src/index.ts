import Fastify from "fastify";
import cors from "@fastify/cors";
import { searchRoutes } from "./routes/searches.js";

const port = Number(process.env.SERVER_PORT ?? 3001);

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/health", async () => ({ status: "ok", service: "flight-tracker-server" }));

await app.register(searchRoutes);

try {
  await app.listen({ port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
