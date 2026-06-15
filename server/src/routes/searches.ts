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
import { runAllActive, runTrackedSearchById, runAllActiveWithChain } from "../engine/tracker.js";
import { notifyNewLow } from "../push/notify.js";
import { verifyRunSecret } from "../lib/auth.js";
import type { ProviderName } from "@flight-tracker/shared";

const ALLOWED_PROVIDERS: ProviderName[] = ["google-flights", "ignav", "duffel", "skyscanner", "mock"];

const idParams = z.object({ id: z.string().min(1) });
const activePatch = z.object({ active: z.boolean() }).strict();

export const searchRoutes: FastifyPluginAsync = async (app) => {
  // 建立追蹤（需認證）
  app.post("/api/searches", async (req, reply) => {
    if (!verifyRunSecret(req.headers.authorization)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const parsed = trackedSearchInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const row = await prisma.trackedSearch.create({
      data: trackedSearchToCreateData(parsed.data, generateShareToken()),
    });
    return reply.code(201).send(trackedSearchToDomain(row));
  });

  // 列出全部（附最新一筆價格快照，單次批次查詢避免 N+1）
  app.get("/api/searches", async () => {
    const rows = await prisma.trackedSearch.findMany({ orderBy: { createdAt: "desc" } });
    const latestSnaps = await prisma.priceSnapshot.findMany({
      where: { trackedSearchId: { in: rows.map((r) => r.id) } },
      orderBy: { capturedAt: "desc" },
      distinct: ["trackedSearchId"],
    });
    const snapMap = new Map(latestSnaps.map((s) => [s.trackedSearchId, s]));
    return rows.map((row) => ({
      ...trackedSearchToDomain(row),
      latestSnapshot: snapMap.has(row.id) ? priceSnapshotToDomain(snapMap.get(row.id)!) : null,
    }));
  });

  // 取單筆
  app.get("/api/searches/:id", async (req, reply) => {
    const { id } = idParams.parse(req.params);
    const row = await prisma.trackedSearch.findUnique({ where: { id } });
    if (!row) return reply.code(404).send({ error: "找不到追蹤項目" });
    return trackedSearchToDomain(row);
  });

  // 全量更新條件（需認證）
  app.put("/api/searches/:id", async (req, reply) => {
    if (!verifyRunSecret(req.headers.authorization)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
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

  // 暫停 / 恢復追蹤（需認證）
  app.patch("/api/searches/:id", async (req, reply) => {
    if (!verifyRunSecret(req.headers.authorization)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
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

  // 刪除（需認證）
  app.delete("/api/searches/:id", async (req, reply) => {
    if (!verifyRunSecret(req.headers.authorization)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const { id } = idParams.parse(req.params);
    const exists = await prisma.trackedSearch.findUnique({ where: { id } });
    if (!exists) return reply.code(404).send({ error: "找不到追蹤項目" });
    await prisma.trackedSearch.delete({ where: { id } });
    return reply.code(204).send();
  });

  // 立即執行一次追蹤（需認證，防止任意觸發爬蟲造成 DoS）
  app.post("/api/searches/:id/run-now", async (req, reply) => {
    if (!verifyRunSecret(req.headers.authorization)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const { id } = idParams.parse(req.params);
    const result = await runTrackedSearchById(id);
    if (result === null) return reply.code(404).send({ error: "找不到追蹤項目" });
    if (result.isNewLow && result.snapshot) {
      await notifyNewLow(result.trackedSearchId, result.snapshot);
    }
    return result;
  });

  /**
   * 立即對所有 active 追蹤項目執行一輪（供 GitHub Actions 或外部排程呼叫）。
   * 必須帶 Authorization: Bearer <RUN_SECRET>；未設定 RUN_SECRET 時一律拒絕。
   * Header X-Provider-Override: google-flights → 只用指定來源（逗號分隔，白名單驗證）。
   */
  app.post("/api/run-all", async (req, reply) => {
    if (!verifyRunSecret(req.headers.authorization)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const overrideHeader = (req.headers["x-provider-override"] as string | undefined)?.trim();
    const overrideProviders = overrideHeader
      ? overrideHeader.split(",").map((s) => s.trim()).filter((s): s is ProviderName => ALLOWED_PROVIDERS.includes(s as ProviderName))
      : [];
    const runner = overrideProviders.length > 0
      ? (cb: Parameters<typeof runAllActive>[0]) => runAllActiveWithChain(overrideProviders, cb)
      : runAllActive;

    const results = await runner(async (r) => {
      if (r.isNewLow && r.snapshot) {
        await notifyNewLow(r.trackedSearchId, r.snapshot);
      }
    });
    return { processed: results.length, newLows: results.filter((r) => r.isNewLow).length };
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
