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
- [x] 實際線上呼叫測試（DUFFEL_API_TOKEN 已設定；curl LHR→JFK 回 HTTP 201，server 容器 printenv 確認帶入 token）

## 10. 顯示票價來源
- [x] 後端 `getConfiguredProviderName()`（單一來源，不實例化 provider）
- [x] 後端 `GET /api/config` 回傳 `{ provider }`
- [x] 前端 `api.getConfig()`
- [x] App 取得 config 並傳給 SearchCard
- [x] SearchCard 於價格旁顯示來源標籤（Mock / Duffel）

## 11. 多來源串接 + 用量上限 + 達標提示
- [x] Prisma：新增 `ProviderUsage(provider, period, searchCount)` 與 `PriceSnapshot.source`，migration
- [x] shared：新增 `ProviderName` 型別、`PriceSnapshot.source`
- [x] server：provider 鏈設定（`PROVIDER_CHAIN`，預設沿用 `FLIGHT_PROVIDER`）+ `buildProviderByName`
- [x] server：用量 repository（`ProviderUsage` 讀/累加，period=YYYY-MM）
- [x] tracker：每輪用選定 provider、累加用量、快照寫入 `source`
- [x] mappers：對應 `source`
- [x] `/api/config`：回傳 primaryProvider / activeProvider / quotaReached / usage
- [x] 前端：卡片來源標籤改讀 `snapshot.source`；達標時顯示橫幅提示
- [x] 重建並驗證（migration + 端點 + 顯示）
- [x] `.env.example` 補上 `PROVIDER_CHAIN` / `DUFFEL_SEARCH_LIMIT` 說明

## 12. 開發環境約定（踩雷紀錄）
- [x] 前端固定用本機 `npm run dev:web` 跑（server/db 留 docker）
- [x] `docker-compose.yml` 的 `web` 服務改 `profiles: ["web"]`，預設不啟動，避免容器(root)污染 `web/node_modules/.vite` 並與本機 vite 搶 5173
- [x] dev 模式不註冊 Service Worker（只在 production build 註冊），並主動移除既有 SW 與快取，避免舊快取造成白畫面（`web/src/main.tsx`）
- 注意：`.env` 請用 WSL 指令編輯，勿用 Cursor 編輯器（buffer 與磁碟易不同步互相覆蓋）
- 注意：勿 `export DUFFEL_API_TOKEN=`（空值會蓋過 `.env`，docker compose 取不到 token）
- 注意：`docker compose restart server` 只重啟不換 image；改過 Dockerfile 後要用 `docker compose up -d` 才會換新 image

## 13. 新增資料來源：Ignav（免費 API，價格追蹤用）
> 決定：(1) market 由 currency 對照表決定，對不到用 `IGNAV_MARKET`（預設 TW）；(2) bookingDeepLink 搜尋時填 null（不額外打 booking-links 省額度）；(3) 與 Duffel 並存，由 PROVIDER_CHAIN 控制。
- [x] `shared/src/types.ts`：`ProviderName` 加 `"ignav"`
- [x] `server/src/providers/ignav/IgnavProvider.ts`：實作 adapter
- [x] `server/src/providers/index.ts`：`buildProviderByName` 加 `ignav`
- [x] `.env.example`：`IGNAV_API_KEY`、`IGNAV_MARKET`、`IGNAV_SEARCH_LIMIT`
- [x] `docker-compose.yml`：server 服務傳入 Ignav 環境變數
- [x] 重建 server + 端對端驗證

## 14. 航班明細顯示 + 訂票連結（連到航空公司官網）
> 決定：只對「區間最低價」那筆查一次 Ignav booking-links；優先 airline；來回票拆成「訂去程」「訂回程」。
- [x] `shared`：`FlightOffer.bookingToken`、`ResolvedBookingLinks`、`resolveBookingLink`
- [x] `IgnavProvider`：依 legs 分別解析；缺 split option 時 fallback
- [x] `tracker.ts` + Prisma：`bookingReturnDeepLink` 欄位 + migration
- [x] `SearchCard`：顯示 offerSummary；拆分「訂去程」「訂回程」按鈕
- [x] 華航 fallback：Ignav `.svc` 無效時改 Google Flights 單程

## 15. Google Flights 手動搜尋按鈕
- [x] `shared/googleFlights.ts`：URL 建構 + `buildGoogleFlightsUrlForTrackedSearch`
- [x] `SearchCard`：「Google Flights 搜尋」按鈕（不耗 API 額度）
- [x] `IgnavProvider`：華航 fallback 改用 shared 函式（DRY）

## 16. Stitch UI 美化（Premium Travel 設計稿）
- [x] Tailwind design tokens、Hanken Grotesk、Material Symbols
- [x] `App.tsx`：header、sidebar、footer、mobile nav、篩選/排序
- [x] `SearchForm.tsx` / `SearchCard.tsx` / `SharePage.tsx` / `PriceChart.tsx`：Stitch 樣式
- [x] `lib/searchListControls.ts`：前端篩選與排序
- [x] `web/DESIGN.md`：Stitch Elevated Aviation System 規格留存

## 17. 主題切換 + PWA
- [x] light/dark 切換（localStorage、theme-color meta、CSS 變數）
- [x] Sidebar / header nav 精簡為「首頁」「追蹤清單」
- [x] manifest.webmanifest + App 圖示（SVG）+ Service Worker 快取
- [x] 可安裝（manifest + SW）、離線殼

## 18. Google Flights 爬蟲資料來源（自動追價）
> 決定：使用 Playwright headless Chromium 爬取 `li.pIav2d` 結果卡片；selector 由截圖除錯確認。Skyscanner（Press & Hold）與 Trip.com（whaleguard）封鎖無法繞過，停用。
- [x] `server/src/providers/googleflights/GoogleFlightsProvider.ts`：Playwright 爬蟲實作
- [x] `server/src/providers/scraper/stealth.ts`：共用 stealth 瀏覽器工具
- [x] `shared/src/types.ts`：`ProviderName` 加 `"google-flights"`、`"skyscanner"`、`"trip"`
- [x] `server/src/providers/index.ts`：`buildProviderByName` 加三來源（trip 拋錯、skyscanner 缺金鑰）
- [x] `Dockerfile.dev`：加入 `npx playwright install chromium --with-deps`（烤進 image，無需每次手動裝）
- [x] `server/package.json`：加入 `playwright` 依賴
- [x] 實測通過：TPE→NRT 爬到 NT$4,990（Peach Aviation 直飛）

## 19. 多來源全域最低價架構（All-Provider Chain）
> 決定：每輪查詢所有可用來源，取全域最低價寫入快照；不再強制 mock 保底（移除 `getProviderChain` 中的 `push("mock")`）。
- [x] `tracker.ts`：`runTrackedSearchWithChain` 跨 provider 比較，取最低價並記錄 `source`
- [x] `server/src/routes/searches.ts`：`POST /api/run-all` 加 `X-Provider-Override` header 支援
- [x] `providers/index.ts`：移除強制 mock 保底邏輯（不再混入假資料）
- [x] `engine/filters.ts`：`arrivalWindow` 語意修正為「返程出發時間」（不再過濾去程抵達）
- [x] 移除 Amadeus provider（自助服務入口 2026-07-17 停用）

## 20. GitHub Actions 排程爬蟲
> 決定：Google Flights 每小時、Ignav 每週一（本月剩餘額度保守設定）；透過 `X-Provider-Override` header 分開觸發。
- [x] `.github/workflows/scraper.yml`：google-flights 每小時、ignav 每週一
- [x] `docker-compose.yml`：加入 `RUN_SECRET`、各來源 `SEARCH_LIMIT` 環境變數
- [x] `.env.example`：`RUN_SECRET`、`PROVIDER_CHAIN`、各來源限制說明

## 21. UI 修正（本輪）
- [x] 表單標籤：「出發時間窗」→「去程出發時間」、「抵達時間窗」→「返程出發時間」
- [x] 追蹤清單摘要：「出發 HH:MM」→「去程出發 HH:MM」、「抵達 HH:MM」→「返程出發 HH:MM」
- [x] `PROVIDER_LABEL` 補齊：加入 `google-flights`、`skyscanner`、`trip`（原本顯示 undefined）
- [x] 來源標籤移除「來源：」前綴，改在下方顯示截取時間戳
- [x] `shared/googleFlights.ts`：修正 URL 語序（`from X to Y` 對齊爬蟲用的查詢格式）
- [x] 刪除 DB 中舊的 mock 快照（避免假資料持續顯示）
