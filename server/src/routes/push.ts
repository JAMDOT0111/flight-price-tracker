import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { pushEnabled, vapidPublicKey } from "../push/webpush.js";
import { verifyRunSecret } from "../lib/auth.js";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  trackedSearchId: z.string().optional(),
});

const unsubscribeSchema = z.object({ endpoint: z.string().url() });

export const pushRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/push/public-key", async () => ({ publicKey: vapidPublicKey, enabled: pushEnabled }));

  app.post("/api/push/subscribe", async (req, reply) => {
    if (!verifyRunSecret(req.headers.authorization)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { endpoint, keys, trackedSearchId } = parsed.data;
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, trackedSearchId: trackedSearchId ?? null },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, trackedSearchId: trackedSearchId ?? null },
    });
    return reply.code(201).send({ ok: true });
  });

  app.post("/api/push/unsubscribe", async (req, reply) => {
    if (!verifyRunSecret(req.headers.authorization)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const parsed = unsubscribeSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    await prisma.pushSubscription.delete({ where: { endpoint: parsed.data.endpoint } }).catch(() => {});
    return { ok: true };
  });
};
