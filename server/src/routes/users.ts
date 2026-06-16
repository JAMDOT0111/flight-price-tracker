import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

function hashPassword(password: string, tag: string): string {
  return createHash("sha256").update(`${password}:${tag}`).digest("hex");
}

export async function usersRoutes(app: FastifyInstance) {
  app.post("/api/users/login", async (req, reply) => {
    const body = req.body as Record<string, unknown>;
    const tag = (typeof body.tag === "string" ? body.tag : "").trim().slice(0, 20);
    const password = typeof body.password === "string" ? body.password : "";

    if (!tag || !password) {
      return reply.status(400).send({ ok: false, message: "請填寫名稱與密碼" });
    }

    const hash = hashPassword(password, tag);
    const existing = await prisma.userAccount.findUnique({ where: { tag } });

    if (!existing) {
      if (tag === "admin") {
        // admin 僅能用預設密碼，不允許重新建立
        return reply.status(401).send({ ok: false, message: "密碼錯誤" });
      }
      await prisma.userAccount.create({ data: { tag, passwordHash: hash } });
      return reply.send({ ok: true, tag, isAdmin: false, created: true });
    }

    if (existing.passwordHash !== hash) {
      return reply.status(401).send({ ok: false, message: "密碼錯誤，此名稱已被其他人使用" });
    }

    return reply.send({ ok: true, tag, isAdmin: tag === "admin", created: false });
  });
}
