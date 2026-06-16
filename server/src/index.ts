import Fastify from "fastify";
import cors from "@fastify/cors";
import { searchRoutes } from "./routes/searches.js";
import { shareRoutes } from "./routes/share.js";
import { pushRoutes } from "./routes/push.js";
import { configRoutes } from "./routes/config.js";
import { feedbackRoutes } from "./routes/feedback.js";
import { startScheduler } from "./engine/scheduler.js";

const port = Number(process.env.SERVER_PORT ?? 3001);

if (!process.env.RUN_SECRET?.trim()) {
  console.warn("[startup] 警告：RUN_SECRET 未設定，/api/run-all 端點將拒絕所有請求。請在 .env 設定 RUN_SECRET。");
}

const corsOrigin = process.env.CORS_ORIGIN?.trim() || "http://localhost:5173";

const app = Fastify({ logger: true });

await app.register(cors, { origin: corsOrigin });

app.get("/health", async () => ({ status: "ok", service: "flight-tracker-server" }));

await app.register(searchRoutes);
await app.register(shareRoutes);
await app.register(pushRoutes);
await app.register(configRoutes);
await app.register(feedbackRoutes);

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
