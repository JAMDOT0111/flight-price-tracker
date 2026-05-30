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

## 12. 開發環境約定（踩雷紀錄）
- [x] 前端固定用本機 `npm run dev:web` 跑（server/db 留 docker）
- [x] `docker-compose.yml` 的 `web` 服務改 `profiles: ["web"]`，預設不啟動，避免容器(root)污染 `web/node_modules/.vite` 並與本機 vite 搶 5173
- [x] dev 模式不註冊 Service Worker（只在 production build 註冊），並主動移除既有 SW 與快取，避免舊快取造成白畫面（`web/src/main.tsx`）
- 注意：`.env` 請用 WSL 指令編輯，勿用 Cursor 編輯器（buffer 與磁碟易不同步互相覆蓋）
- 注意：勿 `export DUFFEL_API_TOKEN=`（空值會蓋過 `.env`，docker compose 取不到 token）

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
- [x] server：`selectProvider()`（依序挑可用且未達上限者，mock 保底）
- [x] tracker：每輪用選定 provider、累加用量、快照寫入 `source`
- [x] mappers：對應 `source`
- [x] `/api/config`：回傳 primaryProvider / activeProvider / quotaReached / usage
- [x] 前端：卡片來源標籤改讀 `snapshot.source`；達標時顯示橫幅提示
- [x] 重建並驗證（migration + 端點 + 顯示）
- [x] `.env.example` 補上 `PROVIDER_CHAIN` / `DUFFEL_SEARCH_LIMIT` 說明

## 13. 新增資料來源：Ignav（免費 API，價格追蹤用）
> 決定：(1) market 由 currency 對照表決定，對不到用 `IGNAV_MARKET`（預設 TW）；(2) bookingDeepLink 搜尋時填 null（不額外打 booking-links 省額度）；(3) 與 Duffel 並存，由 PROVIDER_CHAIN 控制，預設 `ignav,mock`。
- [x] `shared/src/types.ts`：`ProviderName` 加 `"ignav"`
- [x] `server/src/providers/ignav/IgnavProvider.ts`：實作 adapter（one-way / round-trip、X-Api-Key、回應映射）
- [x] `server/src/providers/index.ts`：`isProviderName` / `buildProviderByName` 加 `ignav`
- [x] `web/src/components/SearchCard.tsx`：`PROVIDER_LABEL` 加 `ignav: "Ignav"`
- [x] `.env.example`：`IGNAV_API_KEY`、`IGNAV_MARKET`、（選配 `IGNAV_SEARCH_LIMIT`）；`.env` 由 WSL 指令填入
- [x] `docker-compose.yml`：server 服務傳入 `IGNAV_API_KEY` / `IGNAV_MARKET` / `IGNAV_SEARCH_LIMIT`
- [x] `README.md`：Ignav 來源說明（免費額度、market/幣別、限制）
- [x] 重建 server + 端對端驗證（IGNAV_API_KEY 設定；curl TPE→SGN 回 HTTP 200、TWD 真實票價，server 容器確認帶入金鑰）

## 14. 航班明細顯示 + 訂票連結（連到航空公司官網）
> 決定：只對「區間最低價」那筆查一次 Ignav booking-links；優先 airline；來回票**不使用合一連結**（易誤導單程），一律拆成「訂去程」「訂回程」。
- [x] `shared`：`FlightOffer.bookingToken`、`ResolvedBookingLinks`、`resolveBookingLink` 回傳 `{ outbound, inbound }`
- [x] `IgnavProvider`：依 legs 分別解析；缺 split option 時以 manual / 單程 ignav_id fallback
- [x] `tracker.ts` + Prisma：`bookingReturnDeepLink` 欄位 + migration
- [x] `SearchCard`：顯示 offerSummary；合一連結→「前往訂票」，拆分→「訂去程」「訂回程」
- [x] 華航 fallback：Ignav `.svc` 無效時改 Google Flights 單程（預填 SGN→TPE + 日期）

## 15. Google Flights 手動搜尋（免 API 額度）
> 決定：每張追蹤卡片固定顯示「Google Flights 搜尋」；有快照用最佳去/回日期，否則用區間起日 + 固定天數。
- [x] `shared/googleFlights.ts`：URL 建構 + `buildGoogleFlightsUrlForTrackedSearch`
- [x] `SearchCard`：「Google Flights 搜尋」按鈕（不耗 Ignav 額度）
- [x] `IgnavProvider`：華航 fallback 改用 shared 函式（DRY）

## 16. Stitch UI 美化（Premium Travel 設計稿）
> 決定：Bento 區塊拿掉、Sidebar 使用者區拿掉；篩選/排序做前端實作。
- [x] `tailwind.config.js`：Stitch design tokens（colors、typography、spacing）
- [x] `index.html` + `index.css`：Hanken Grotesk、Material Symbols、scrollbar
- [x] `App.tsx`：header、sidebar、footer、mobile nav、篩選/排序
- [x] `SearchForm.tsx`：Stitch 表單樣式（保留全部欄位與邏輯）
- [x] `SearchCard.tsx`：Stitch 卡片樣式（保留全部操作）
- [x] `SharePage.tsx` + `PriceChart.tsx`：統一 design token 配色
- [x] `lib/searchListControls.ts`：前端篩選（全部/追蹤中/暫停/有報價/無報價）與排序
- [x] `web/DESIGN.md`：Stitch Elevated Aviation System 規格留存
- [x] DESIGN.md 對齊修正：header top nav、sidebar 4 項、layout 對齊、icon-only 篩選/排序、footer 連結、手機 4 tab、表單 icon 與分隔線

## 17. 主題切換 + 精簡導覽
- [x] `lib/theme.ts`：light/dark 切換、localStorage、theme-color meta
- [x] `index.css` + `tailwind.config.js`：CSS 變數驅動配色（支援 dark class）
- [x] `index.html` inline script：避免首次載入閃爍
- [x] `App.tsx`：header 太陽/月亮按鈕
- [x] Sidebar / header nav / mobile nav 精簡為「首頁」「追蹤清單」兩項
- [x] 修正主題切換：`index.css` 變數改 `@layer base` + `html.dark` 選擇器
- [x] 還原誤覆寫的 `index.html`（白畫面根因）
- [x] 敏感檔案檢查 + push GitHub（`7fe7725`）

- [x] manifest.webmanifest + App 圖示（SVG）+ index.html 連結與 theme-color
- [x] Service Worker 執行期快取（同源應用殼），啟動時自動註冊
- [x] 可安裝（manifest + SW）
- [x] 離線殼（navigate fallback 至快取首頁）
