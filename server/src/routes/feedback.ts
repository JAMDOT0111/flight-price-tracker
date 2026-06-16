import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { verifyRunSecret } from "../lib/auth.js";

const submitSchema = z.object({
  message: z.string().min(1).max(1000).trim(),
});

const idParams = z.object({ id: z.string().min(1) });

export const feedbackRoutes: FastifyPluginAsync = async (app) => {
  // 提交問題回報（無需認證，任何人可回報）
  app.post("/api/feedback", async (req, reply) => {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const row = await prisma.feedbackReport.create({
      data: { message: parsed.data.message },
    });
    return reply.code(201).send({ id: row.id, ok: true });
  });

  // 取得問題清單（需認證）
  app.get("/api/feedback", async (req, reply) => {
    if (!verifyRunSecret(req.headers.authorization)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const rows = await prisma.feedbackReport.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      message: r.message,
      status: r.status as "pending" | "resolved",
      createdAt: r.createdAt.toISOString(),
    }));
  });

  // 更新處理狀態（需認證）
  app.patch("/api/feedback/:id", async (req, reply) => {
    if (!verifyRunSecret(req.headers.authorization)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const { id } = idParams.parse(req.params);
    const parsed = z.object({ status: z.enum(["pending", "resolved"]) }).safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const exists = await prisma.feedbackReport.findUnique({ where: { id } });
    if (!exists) return reply.code(404).send({ error: "找不到此回報" });
    const row = await prisma.feedbackReport.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return { id: row.id, status: row.status, ok: true };
  });

  // 刪除問題（需認證）
  app.delete("/api/feedback/:id", async (req, reply) => {
    if (!verifyRunSecret(req.headers.authorization)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const { id } = idParams.parse(req.params);
    await prisma.feedbackReport.delete({ where: { id } }).catch(() => {});
    return reply.code(204).send();
  });
};
