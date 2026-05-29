# Flight Price Tracker（即時機票最低價追蹤）

在指定日期區間內，持續追蹤符合條件的最低機票價格，並在出現新低價時通知你。提供響應式網頁（PWA，手機可安裝）。

例如：`9/1–9/30` 內，東京 ⇄ 胡志明市、出發 09:00–15:00、抵達 17:00–21:00、1 人、直飛、含託運行李，找出「最便宜的 5 天來回」並持續追蹤。

## 特色
- 區間最低價（滑動視窗，支援固定/區間行程天數）
- 精細篩選：出發/抵達時間窗、直飛、託運行李公斤數、人數
- 價格歷史走勢圖、可分享連結、直接訂票連結
- Web Push 通知（新低價）
- 可抽換資料來源（adapter）：開發用 Mock，正式接 Duffel

## 技術棧
- 前端：React + Vite + TypeScript + Tailwind CSS（PWA）
- 後端：Node.js + TypeScript + Fastify + Prisma + PostgreSQL
- 排程：node-cron
- 開發環境：WSL2 + Docker（docker compose）

## 開發（WSL2 + Docker）
```bash
docker compose up
```

詳見 `Todo.md` 的實作進度。

## 資料來源說明
本專案不爬取 Trip.com / Google Flights（違反服務條款且易被封鎖），改以合法且有官方支援的 API 作為資料來源。
