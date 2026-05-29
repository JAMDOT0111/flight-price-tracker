import cron from "node-cron";
import { runAllActive } from "./tracker.js";
import { notifyNewLow } from "../push/notify.js";

const CRON_EXPR = process.env.TRACK_CRON ?? "*/30 * * * *";

export interface SchedulerLogger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

/** 啟動 node-cron 排程，定時對所有 active 追蹤項目跑一輪。 */
export function startScheduler(log: SchedulerLogger): void {
  if (!cron.validate(CRON_EXPR)) {
    log.error(`[tracker] 無效的 TRACK_CRON: ${CRON_EXPR}`);
    return;
  }

  cron.schedule(CRON_EXPR, async () => {
    log.info("[tracker] 排程輪詢開始");
    const results = await runAllActive(async (r) => {
      if (r.isNewLow && r.snapshot) {
        log.info(
          `[tracker] 發現新低價：${r.snapshot.lowestPrice} ${r.snapshot.currency}（追蹤 ${r.trackedSearchId}）`,
        );
        await notifyNewLow(r.trackedSearchId, r.snapshot);
      }
    });
    log.info(`[tracker] 排程輪詢完成，共處理 ${results.length} 項`);
  });

  log.info(`[tracker] 排程已啟動：${CRON_EXPR}`);
}
