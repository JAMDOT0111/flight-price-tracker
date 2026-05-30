import type { FastifyInstance } from "fastify";
import { getProviderStatus } from "../providers/selector.js";

export async function configRoutes(app: FastifyInstance) {
  app.get("/api/config", async () => getProviderStatus());
}
