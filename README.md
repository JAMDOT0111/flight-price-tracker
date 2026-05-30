# Flight Price Tracker（即時機票最低價追蹤）

在指定日期區間內，持續追蹤符合條件的最低機票價格，並在出現新低價時通知你。提供響應式網頁（PWA，手機可安裝）。

**範例**：`9/1–9/30` 內 TPE ↔ SGN、5 天來回、直飛、出發 09:00–15:00 → 系統找出區間內最低價的去/回日期組合，定期更新並記錄走勢。

## 特色

- **區間最低價**：滑動視窗，支援固定/區間行程天數
- **精細篩選**：出發/抵達時間窗、直飛、託運行李、人數、幣別
- **價格走勢圖**、**可分享連結**（`/s/:token`）、**訂票連結**
- **Web Push**：新低價通知
- **多資料來源**：`FlightProvider` adapter 可抽換（Ignav / Duffel / mock）
- **Google Flights 手動搜尋**：不耗 API 額度，Ignav 用完仍可查價

## 技術棧

| 層 | 技術 |
|---|---|
| 前端 | React、Vite、TypeScript、Tailwind CSS（PWA） |
| 後端 | Node.js、Fastify、Prisma、PostgreSQL |
| 排程 | node-cron |
| 開發環境 | WSL2 + Docker Compose |

Monorepo：`web/`（前端）、`server/`（API + 追價引擎）、`shared/`（共用型別與工具）。

## 快速開始（開發）

建議：**前端本機跑，server/db 用 Docker**（避免容器污染 `web/node_modules/.vite`）。

```bash
# 1. 複製環境變數並填入金鑰（見下方「環境變數」）
cp .env.example .env

# 2. 後端 + 資料庫
docker compose up -d

# 3. 前端（本機 port 5173）
npm install
npm run dev:web
```

瀏覽器開啟 `http://localhost:5173`。

改動 server 程式後重建：

```bash
docker compose up -d --force-recreate server
```

確認 Ignav 金鑰有進容器：

```bash
docker compose exec server printenv IGNAV_API_KEY
```

> 實作進度詳見 [`Todo.md`](./Todo.md)。

## 環境變數

複製 `.env.example` 為 `.env`。重點欄位：

```bash
# 資料來源鏈（逗號分隔；達上限或不可用時依序退回下一個，mock 為保底）
PROVIDER_CHAIN=ignav,mock

# Ignav（目前主力；ignav.com 註冊，免信用卡，約 1000 次免費）
IGNAV_API_KEY=你的_ignav_api_key
IGNAV_MARKET=TW
# IGNAV_SEARCH_LIMIT=1000

# Duffel（選用）
# DUFFEL_API_TOKEN=duffel_test_...
# DUFFEL_SEARCH_LIMIT=1000

# 前端 API
VITE_API_BASE_URL=http://localhost:3001
```

**注意**

- `.env` 請用 **WSL 終端機指令**編輯，勿用 IDE 直接改（buffer 與 WSL 磁碟易不同步）。
- 勿在 shell 執行 `export DUFFEL_API_TOKEN=`（空值會蓋過 `.env`，docker compose 讀不到 token）。

## 資料來源

本專案**不爬取** Trip.com / Google Flights 作為自動追價來源（違反 ToS、易被封鎖）。自動追價使用合法 API；Google Flights 僅作**手動搜尋連結**。

### 來源鏈運作方式

```
PROVIDER_CHAIN=ignav,mock
       ↓
① Ignav（真實票價，免費額度）
       ↓ 額度用完 / 缺金鑰
② mock（假資料保底；追蹤仍跑，但價格非真實）
```

額度用完時，前端會顯示橫幅：「已達 ignav 額度上限，暫時改用 mock」。

| 來源 | 說明 | 限制 |
|---|---|---|
| **ignav** | 目前主力；亞洲線真實 TWD 報價 | 免費額度有限；城市碼 `TYO` 不支援（請用 `HND`/`NRT`）；託運「公斤數」會過濾掉報價；booking-links 另耗額度 |
| **mock** | 決定性假資料，免金鑰 | 非真實價格 |
| **duffel** | 已實作，可接 provider 鏈 | 測試金鑰僅少數示範航線（如 LHR↔JFK）；live 需帳號驗證 |
| **Google Flights** | 卡片「Google Flights 搜尋」按鈕 | **不能**取代 API 做背景自動追價 |

### 切換到 Ignav（建議）

```bash
PROVIDER_CHAIN=ignav,mock
IGNAV_API_KEY=你的_ignav_api_key
IGNAV_MARKET=TW
```

```bash
docker compose up -d --force-recreate server
```

報價幣別由 `market` 決定（依使用者所選幣別對照表，對不到用 `IGNAV_MARKET`，預設 TW）。

### 切換到 Duffel（選用）

```bash
FLIGHT_PROVIDER=duffel
DUFFEL_API_TOKEN=你的_duffel_token
```

```bash
docker compose up -d --build server
```

- 測試金鑰（`duffel_test_...`）多數亞洲航線查無報價，屬正常現象。
- 正式金鑰（`duffel_live_...`）須完成 Duffel 帳號驗證。
- 託運行李多半僅件數、無公斤數；設定「行李最低公斤數」可能過濾掉真實報價。

## 追蹤卡片功能

每張追蹤卡片提供：

| 功能 | 說明 |
|---|---|
| 最低價 + 最佳去/回日期 | 來自最近一次成功追蹤的快照 |
| 來源標籤 | Ignav / mock / Duffel |
| 航班明細 | 航空公司、去/回時間、轉機 |
| 立即追蹤一次 | 手動觸發一輪搜價（會消耗 API 額度） |
| 暫停 / 恢復 | 停止或恢復排程 |
| 價格走勢 | 歷史快照圖表 |
| 分享 | 複製 `/s/:token` 公開連結 |
| **Google Flights 搜尋** | 不耗 API；有快照用最佳日期，否則用區間起日 + 固定天數 |
| **訂去程 / 訂回程** | 見下方「訂票連結」 |

## 訂票連結

僅對「區間最低價」那一筆呼叫 Ignav `booking-links`（省 API 額度）。優先航空公司官網連結。

**來回票策略**

- **不使用** `legs: ["outbound","inbound"]` 合一連結（常誤導至單程頁）
- 拆成 **「訂去程」**、**「訂回程」** 兩顆按鈕
- 解析順序：round-trip `ignav_id` split legs → manual 欄位 → 單程搜尋匹配 `ignav_id`
- 華航 Ignav 回傳的 `.svc` API URL 無法在瀏覽器開啟 → **回程改導 Google Flights 單程**（預填 SGN→TPE + 日期）

**範例（TPE↔SGN）**

| 按鈕 | 連結 |
|---|---|
| 訂去程 | 星宇官網 deep link（9/13 TPE→SGN） |
| 訂回程 | Google Flights 單程（9/18 SGN→TPE）→ 再選華航航班進官網 |

需按 **「立即追蹤一次」** 後才會寫入訂票連結（舊快照可能沒有）。

## Google Flights 手動搜尋

Ignav 免費額度用完、或價格來源為 mock 時，仍可用卡片上的 **「Google Flights 搜尋」** 手動查真實票價（不消耗 Ignav 額度）。

URL 邏輯（`shared/src/googleFlights.ts`）：

- **有快照**：用 `bestOutboundDate` / `bestReturnDate` 組來回搜尋
- **無快照**：用 `dateRangeStart` + `durationMin` 估算日期
- **單程**：帶 `oneway`

> Google Flights **沒有**官方免費 Flight Prices API，無法用來做背景自動追價。

## 開發環境注意事項

| 項目 | 說明 |
|---|---|
| 前端 | 固定本機 `npm run dev:web`；docker `web` 服務設 `profiles: ["web"]`，預設不啟動 |
| Service Worker | dev 模式不註冊 SW，並清除舊快取，避免白畫面 |
| 容器化前端 | 需要時：`docker compose --profile web up` |
| API 文件 | 後端 `http://localhost:3001`；config：`GET /api/config` |

## 專案結構

```
flight-price-tracker/
├── web/                 React PWA
├── server/
│   ├── src/providers/   IgnavProvider、DuffelProvider、MockProvider
│   ├── src/engine/      tracker 追價引擎
│   └── prisma/          schema + migrations
├── shared/              型別、FlightProvider 介面、Google Flights URL
├── docker-compose.yml
├── .env.example
└── Todo.md              實作進度（請勿刪除）
```

## 已知限制

1. **Ignav 免費額度有限** — 用完退回 mock；可用 Google Flights 按鈕手動查價
2. **無「免 API 自動追價」** — 除合法 API 外，沒有穩定的免費自動追價方案
3. **回程訂票** — 華航無可靠 deep link，目前經 Google Flights 再選航班
4. **Ignav 城市碼** — 請用機場 IATA（如 `HND`），不要用 `TYO`
5. **行李篩選** — Ignav/Duffel 多無公斤數，設 minKg 可能過濾掉所有報價

## 授權

Private project — 詳見 repository 設定。
