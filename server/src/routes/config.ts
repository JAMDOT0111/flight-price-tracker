import type { FastifyInstance } from "fastify";
import { getProviderStatus } from "../providers/selector.js";
import { verifyRunSecret } from "../lib/auth.js";

export async function configRoutes(app: FastifyInstance) {
  app.get("/api/config", async (req, reply) => {
    if (!verifyRunSecret(req.headers.authorization)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    return getProviderStatus();
  });
}
