import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { priceSnapshotToDomain, trackedSearchToDomain } from "../lib/mappers.js";

const tokenParams = z.object({ token: z.string().min(1) });

/** 公開（免登入）分享頁資料：以 shareToken 取得追蹤條件與價格歷史。 */
export const shareRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/share/:token", async (req, reply) => {
    const { token } = tokenParams.parse(req.params);
    const row = await prisma.trackedSearch.findUnique({ where: { shareToken: token } });
    if (!row) return reply.code(404).send({ error: "找不到分享頁" });
    const snaps = await prisma.priceSnapshot.findMany({
      where: { trackedSearchId: row.id },
      orderBy: { capturedAt: "asc" },
    });
    return {
      search: trackedSearchToDomain(row),
      snapshots: snaps.map(priceSnapshotToDomain),
    };
  });
};
