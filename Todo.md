# Todo - 即時機票最低價追蹤 App（PWA）

> 本檔案追蹤實作進度。完成的項目會打勾，請勿刪除本檔案。

## 0. 前置環境（WSL2 + Docker + GitHub）
- [x] 在 WSL2 安裝 `gh`（GitHub CLI）
- [x] `gh auth login` 完成授權（帳號 JAMDOT0111）
- [x] Docker Desktop 對 Ubuntu 開啟 WSL integration（`docker` 可用，29.2.1）
- [x] 建立專案資料夾 `~/projects/flight-price-tracker`
- [x] `git init`（main 分支）
- [x] 建立 GitHub public repo 並推送初始 commit（github.com/JAMDOT0111/flight-price-tracker）

## 1. 專案骨架
- [x] monorepo 結構：`web/`、`server/`、`shared/`
- [x] 根目錄 `package.json`（workspaces）、`.gitignore`、`README.md`
- [x] `docker-compose.yml`（db / server / web）與共用 `Dockerfile.dev`
- [x] `npm install` 成功、`shared`/`server` 可編譯

## 2. 領域模型與資料來源介面（SRP/DRY）
- [x] 在 `shared/` 定義領域型別（TrackedSearch、PriceSnapshot、FlightOffer 等）
- [x] 定義 `FlightProvider` adapter 介面

## 3. MockProvider
- [x] 產生符合篩選條件的假航班資料（時間窗/直飛/行李）
- [x] 決定性亂數（相同查詢結果穩定）+ provider factory（依 FLIGHT_PROVIDER 選擇）
- [x] 供開發/展示使用，免金鑰

## 4. 後端 API + 資料庫
- [x] Prisma schema（PostgreSQL）：TrackedSearch、PriceSnapshot、PushSubscription
- [x] 初始 migration 套用、Prisma client 產生
- [x] zod 驗證 + DB/領域 mapper（SRP/DRY）
- [x] Fastify：追蹤項目 CRUD（POST/GET/PUT/PATCH/DELETE）
- [x] 價格歷史查詢 API（GET /api/searches/:id/snapshots）
- [x] 端對端實測通過（建立/列出/驗證/刪除）

## 5. Tracker 引擎 + 排程
- [x] 滑動視窗計算區間最低價（固定/區間行程天數）+ 查詢數上限取樣
- [x] 時間窗 / 直飛 / 託運行李 過濾（過濾器獨立模組）
- [x] `node-cron` 週期輪詢並寫入價格歷史
- [x] 新低價判斷（與歷史最低比較）
- [x] 手動觸發 API：POST /api/searches/:id/run-now
- [x] 端對端實測通過（找出 9/20-9/25 最低價 13,346 TWD）
- [x] 發現新低價時觸發通知（接 Web Push）

## 6. 前端（PWA，響應式）
- [x] API client（型別共用 shared，DRY）
- [x] 搜尋設定表單（完整篩選 UI，類似 Trip.com，RWD）
- [x] 儀表板：追蹤清單、目前最低價、最佳去/回日期
- [x] 操作：立即追蹤、暫停/恢復、刪除
- [x] 價格歷史走勢圖（自製輕量 SVG）
- [x] 訂票連結（bookingDeepLink）
- [x] 可分享連結（shareToken 公開頁 /s/:token，免登入）+ 卡片分享按鈕

## 7. 通知
- [x] 後端 web-push + VAPID 金鑰、推播服務（過期訂閱自動清除）
- [x] 路由：public-key / subscribe / unsubscribe
- [x] 前端 Service Worker（push / notificationclick）+ 啟用通知按鈕
- [x] 新低價時於排程與手動觸發皆推播
- [x] 端點驗證通過（瀏覽器端實際推播需於真實瀏覽器測試）

## 8. 真實資料源
- [x] 實作 `DuffelProvider`（透過同一 adapter 介面）
- [x] factory 依 FLIGHT_PROVIDER 選 mock/duffel
- [x] README 說明切換方式與 Duffel 限制
- [ ] 實際線上呼叫測試（需使用者提供 DUFFEL_API_TOKEN）

## 9. PWA 收尾
- [x] manifest.webmanifest + App 圖示（SVG）+ index.html 連結與 theme-color
- [x] Service Worker 執行期快取（同源應用殼），啟動時自動註冊
- [x] 可安裝（manifest + SW）
- [x] 離線殼（navigate fallback 至快取首頁）
