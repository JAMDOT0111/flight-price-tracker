import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { generateShareToken } from "../lib/shareToken.js";
import {
  priceSnapshotToDomain,
  trackedSearchToCreateData,
  trackedSearchToDomain,
  trackedSearchToUpdateData,
} from "../lib/mappers.js";
import { trackedSearchInputSchema } from "../lib/validation.js";
import { runTrackedSearchById } from "../engine/tracker.js";

const idParams = z.object({ id: z.string().min(1) });
const activePatch = z.object({ active: z.boolean() }).strict();

export const searchRoutes: FastifyPluginAsync = async (app) => {
  // 建立追蹤
  app.post("/api/searches", async (req, reply) => {
    const parsed = trackedSearchInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const row = await prisma.trackedSearch.create({
      data: trackedSearchToCreateData(parsed.data, generateShareToken()),
    });
    return reply.code(201).send(trackedSearchToDomain(row));
  });

  // 列出全部（附最新一筆價格快照）
  app.get("/api/searches", async () => {
    const rows = await prisma.trackedSearch.findMany({ orderBy: { createdAt: "desc" } });
    return Promise.all(
      rows.map(async (row) => {
        const latest = await prisma.priceSnapshot.findFirst({
          where: { trackedSearchId: row.id },
          orderBy: { capturedAt: "desc" },
        });
        return {
          ...trackedSearchToDomain(row),
          latestSnapshot: latest ? priceSnapshotToDomain(latest) : null,
        };
      }),
    );
  });

  // 取單筆
  app.get("/api/searches/:id", async (req, reply) => {
    const { id } = idParams.parse(req.params);
    const row = await prisma.trackedSearch.findUnique({ where: { id } });
    if (!row) return reply.code(404).send({ error: "找不到追蹤項目" });
    return trackedSearchToDomain(row);
  });

  // 全量更新條件
  app.put("/api/searches/:id", async (req, reply) => {
    const { id } = idParams.parse(req.params);
    const parsed = trackedSearchInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const exists = await prisma.trackedSearch.findUnique({ where: { id } });
    if (!exists) return reply.code(404).send({ error: "找不到追蹤項目" });
    const row = await prisma.trackedSearch.update({
      where: { id },
      data: trackedSearchToUpdateData(parsed.data),
    });
    return trackedSearchToDomain(row);
  });

  // 暫停 / 恢復追蹤
  app.patch("/api/searches/:id", async (req, reply) => {
    const { id } = idParams.parse(req.params);
    const parsed = activePatch.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const exists = await prisma.trackedSearch.findUnique({ where: { id } });
    if (!exists) return reply.code(404).send({ error: "找不到追蹤項目" });
    const row = await prisma.trackedSearch.update({
      where: { id },
      data: { active: parsed.data.active },
    });
    return trackedSearchToDomain(row);
  });

  // 刪除
  app.delete("/api/searches/:id", async (req, reply) => {
    const { id } = idParams.parse(req.params);
    const exists = await prisma.trackedSearch.findUnique({ where: { id } });
    if (!exists) return reply.code(404).send({ error: "找不到追蹤項目" });
    await prisma.trackedSearch.delete({ where: { id } });
    return reply.code(204).send();
  });

  // 立即執行一次追蹤（手動觸發，方便測試/展示）
  app.post("/api/searches/:id/run-now", async (req, reply) => {
    const { id } = idParams.parse(req.params);
    const result = await runTrackedSearchById(id);
    if (result === null) return reply.code(404).send({ error: "找不到追蹤項目" });
    return result;
  });

  // 價格歷史（依時間遞增，供走勢圖）
  app.get("/api/searches/:id/snapshots", async (req, reply) => {
    const { id } = idParams.parse(req.params);
    const exists = await prisma.trackedSearch.findUnique({ where: { id } });
    if (!exists) return reply.code(404).send({ error: "找不到追蹤項目" });
    const rows = await prisma.priceSnapshot.findMany({
      where: { trackedSearchId: id },
      orderBy: { capturedAt: "asc" },
    });
    return rows.map(priceSnapshotToDomain);
  });
};
