# Todo - 即時機票最低價追蹤 App（PWA）

> 本檔案追蹤實作進度。完成的項目會打勾，請勿刪除本檔案。

## 0. 前置環境（WSL2 + Docker + GitHub）
- [x] 在 WSL2 安裝 `gh`（GitHub CLI）
- [ ] `gh auth login` 完成授權
- [x] Docker Desktop 對 Ubuntu 開啟 WSL integration（`docker` 可用，29.2.1）
- [x] 建立專案資料夾 `~/projects/flight-price-tracker`
- [x] `git init`（main 分支）
- [ ] 建立 GitHub public repo 並推送初始 commit

## 1. 專案骨架
- [x] monorepo 結構：`web/`、`server/`、`shared/`
- [x] 根目錄 `package.json`（workspaces）、`.gitignore`、`README.md`
- [x] `docker-compose.yml`（db / server / web）與共用 `Dockerfile.dev`
- [x] `npm install` 成功、`shared`/`server` 可編譯

## 2. 領域模型與資料來源介面（SRP/DRY）
- [x] 在 `shared/` 定義領域型別（TrackedSearch、PriceSnapshot、FlightOffer 等）
- [x] 定義 `FlightProvider` adapter 介面

## 3. MockProvider
- [ ] 產生符合篩選條件的假航班資料（時間窗/直飛/行李）
- [ ] 供開發/展示使用，免金鑰

## 4. 後端 API + 資料庫
- [ ] Prisma schema（PostgreSQL）：TrackedSearch、PriceSnapshot、PushSubscription
- [ ] Fastify：追蹤項目 CRUD
- [ ] 價格歷史查詢 API

## 5. Tracker 引擎 + 排程
- [ ] 滑動視窗計算區間最低價（固定/區間行程天數）
- [ ] 時間窗 / 直飛 / 託運行李 過濾
- [ ] `node-cron` 週期輪詢並寫入價格歷史
- [ ] 發現新低價時觸發通知

## 6. 前端（PWA，響應式）
- [ ] 搜尋設定表單（完整篩選 UI，類似 Trip.com）
- [ ] 儀表板：追蹤清單、目前最低價、價格歷史走勢圖
- [ ] 訂票連結（bookingDeepLink）
- [ ] 可分享連結（shareToken 公開頁，免登入）

## 7. 通知
- [ ] Web Push（VAPID）訂閱與推播
- [ ] 新低價推播

## 8. 真實資料源
- [ ] 實作 `DuffelProvider`（透過同一 adapter 介面）

## 9. PWA 收尾
- [ ] manifest、Service Worker、可安裝
- [ ] 離線殼（offline shell）
