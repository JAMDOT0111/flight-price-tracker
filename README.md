# Flight Price Tracker（即時機票最低價追蹤）

在指定日期區間內，持續追蹤符合條件的最低機票價格，並在出現新低價時通知你。提供響應式網頁（PWA，手機可安裝）。

**範例**：`9/1–9/30` 內 TPE ↔ SGN、4–7 天來回、直飛、去程出發 09:00–15:00 → 系統找出區間內最低價的去/回日期組合，定期更新並記錄走勢。

## 特色

- **區間最低價**：滑動視窗，支援固定/區間行程天數
- **精細篩選**：去程出發時間、返程出發時間、直飛、託運行李、人數、幣別
- **多資料來源**：Google Flights 爬蟲（無額度限制）+ Ignav API（免費額度）同時查詢，取全域最低價
- **自動排程**：Google Flights 每小時、Ignav 每週，透過 GitHub Actions 觸發
- **價格走勢圖**、**可分享連結**（`/s/:token`）、**訂票連結**
- **Web Push**：新低價通知
- **PWA**：手機可安裝、離線殼

## 技術棧

| 層 | 技術 |
|---|---|
| 前端 | React、Vite、TypeScript、Tailwind CSS（PWA） |
| 後端 | Node.js、Fastify、Prisma、PostgreSQL |
| 爬蟲 | Playwright headless Chromium（Google Flights） |
| 排程 | node-cron + GitHub Actions |
| 開發環境 | WSL2 + Docker Compose |

Monorepo：`web/`（前端）、`server/`（API + 追價引擎）、`shared/`（共用型別與工具）。

## 快速開始（開發）

建議：**前端本機跑，server/db 用 Docker**（避免容器污染 `web/node_modules/.vite`）。

```bash
# 1. 複製環境變數並填入金鑰（見下方「環境變數」）
cp .env.example .env

# 2. 後端 + 資料庫（首次啟動較慢，Playwright Chromium 烤進 image）
docker compose up -d --build

# 3. 前端（本機 port 5173）
npm install
npm run dev:web
```

瀏覽器開啟 `http://localhost:5173`。

改動 server 程式後重新載入：

```bash
# tsx watch 會自動重載；改 Dockerfile 或 package.json 時才需要重建 image
docker compose up -d
```

> 注意：`docker compose restart server` 只重啟容器，不換 image。改過 Dockerfile 後要用 `docker compose up -d`。

> 實作進度詳見 [`Todo.md`](./Todo.md)。

## 環境變數

複製 `.env.example` 為 `.env`。重點欄位：

```bash
# 資料來源鏈（逗號分隔；依序查詢，取全域最低價）
PROVIDER_CHAIN=google-flights,ignav

# Google Flights（爬蟲，不需金鑰，每小時執行）
# GOOGLE_FLIGHTS_SEARCH_LIMIT=720   # 選配，限制每月查詢次數

# Ignav（免費 API；ignav.com 註冊，免信用卡，約 1000 次/月）
IGNAV_API_KEY=你的_ignav_api_key
IGNAV_MARKET=TW
IGNAV_SEARCH_LIMIT=900              # 建議保留緩衝

# GitHub Actions 觸發 /api/run-all 的保護金鑰
RUN_SECRET=你的_隨機密鑰

# 前端 API
VITE_API_BASE_URL=http://localhost:3001
```

**注意**

- `.env` 請用 **WSL 終端機指令**編輯，勿用 IDE 直接改（buffer 與 WSL 磁碟易不同步）。
- 勿在 shell 執行 `export VARIABLE=`（空值會蓋過 `.env`）。

## 資料來源

### 來源鏈運作方式

每輪排程查詢**所有可用來源**，比較後取**全域最低價**寫入快照，並記錄資料來源。

```
PROVIDER_CHAIN=google-flights,ignav
       ↓ 兩者同時查詢
① Google Flights（爬蟲，無額度限制，每小時）
② Ignav（真實 API，免費額度 ~1000/月，每週）
       ↓ 比較後取最低價
→ 寫入快照，標記來源
```

| 來源 | 方式 | 限制 |
|---|---|---|
| **google-flights** | Playwright 爬蟲，無 API 金鑰 | 爬蟲版面隨 Google 更新可能需調整 selector；訂票連結需手動導向 |
| **ignav** | 官方免費 API | ~1000 次/月；城市碼請用機場 IATA（`HND`/`NRT`，不支援 `TYO`）；booking-links 另耗額度 |
| **mock** | 決定性假資料，免金鑰 | 非真實價格；僅開發用，**不應加入 PROVIDER_CHAIN** |
| **duffel** | 已實作，可接 provider 鏈 | 測試金鑰僅少數示範航線（如 LHR↔JFK）；live 需帳號驗證 |
| **skyscanner** | 已實作（RapidAPI） | 需 `RAPIDAPI_KEY`；目前 API 端點不確定 |
| **trip** | 實作嘗試，已停用 | whaleguard 封鎖，無住宅代理無法爬取 |

### GitHub Actions 自動排程

`.github/workflows/scraper.yml` 每隔固定時間透過 `POST /api/run-all` 觸發追蹤。

| Job | 排程 | 觸發來源 |
|---|---|---|
| Google Flights | 每小時整點 | `X-Provider-Override: google-flights` |
| Ignav | 每週一凌晨 2 點 | `X-Provider-Override: ignav` |

需在 GitHub repo → Settings → Secrets 設定：
- `TRACKER_URL`：你的伺服器公開網址（如 `https://yourserver.com`）
- `RUN_SECRET`：與 `.env` 中 `RUN_SECRET` 相同

> 本機開發不需要 GitHub Actions，手動用「立即追蹤一次」即可。

## 追蹤卡片功能

每張追蹤卡片提供：

| 功能 | 說明 |
|---|---|
| 最低價 + 最佳去/回日期 | 來自最近一次成功追蹤的快照，附截取時間 |
| 來源標籤 | Google Flights / Ignav / Duffel |
| 航班明細 | 航空公司、去/回時間、轉機次數 |
| **Google Flights 搜尋** | 不耗 API；有快照用最佳日期，否則用區間起日 + 最短天數 |
| 立即追蹤一次 | 手動觸發一輪搜價（消耗 API 額度） |
| 暫停 / 恢復 | 停止或恢復排程 |
| 價格走勢 | 歷史快照圖表 |
| 分享 | 複製 `/s/:token` 公開連結 |
| 訂去程 / 訂回程 | 見下方「訂票連結」 |

## 訂票連結

僅對「區間最低價」那一筆呼叫 Ignav `booking-links`（省 API 額度）。優先航空公司官網連結。

**來回票策略**：拆成「訂去程」「訂回程」兩顆按鈕（不使用合一連結，避免誤導至單程頁）。

華航 Ignav 回傳的 `.svc` API URL 無法在瀏覽器開啟 → 回程改導 Google Flights 單程（預填 SGN→TPE + 日期）。

## 篩選條件說明

| 欄位 | 說明 |
|---|---|
| 去程出發時間 | 去程航班起飛時間窗 |
| 返程出發時間 | 返程航班起飛時間窗（Google Flights 爬蟲目前未解析返程時間，此條件由 Ignav 資料過濾） |
| 直飛 | 過濾去程和回程均無中停 |
| 行李 | 需含託運行李（Ignav/Duffel 多無公斤數，設 minKg 可能過濾掉所有報價） |

## 開發環境注意事項

| 項目 | 說明 |
|---|---|
| 前端 | 固定本機 `npm run dev:web`；docker `web` 服務設 `profiles: ["web"]`，預設不啟動 |
| Service Worker | dev 模式不註冊 SW，並清除舊快取，避免白畫面 |
| 容器化前端 | 需要時：`docker compose --profile web up` |
| Playwright | 已烤進 `Dockerfile.dev`；`docker compose down -v` 重建 volume 後直接可用，不需手動 `playwright install` |
| API 文件 | 後端 `http://localhost:3001`；config：`GET /api/config` |

## 專案結構

```
flight-price-tracker/
├── web/                 React PWA
├── server/
│   ├── src/providers/
│   │   ├── googleflights/   GoogleFlightsProvider（Playwright 爬蟲）
│   │   ├── ignav/           IgnavProvider（免費 API）
│   │   ├── duffel/          DuffelProvider（選用）
│   │   ├── mock/            MockProvider（開發用）
│   │   └── scraper/         stealth 瀏覽器工具
│   ├── src/engine/      tracker 追價引擎、filters、window
│   └── prisma/          schema + migrations
├── shared/              型別、FlightProvider 介面、Google Flights URL
├── .github/workflows/   scraper.yml（GitHub Actions 排程）
├── docker-compose.yml
├── Dockerfile.dev       含 Playwright Chromium
├── .env.example
└── Todo.md              實作進度（請勿刪除）
```

## 已知限制

1. **Google Flights selector**：`li.pIav2d`，Google 更新版面時可能需要重新確認 selector
2. **返程時間篩選**：Google Flights 爬蟲目前未解析返程出發時間；「返程出發時間」條件僅對 Ignav 資料有效
3. **Ignav 免費額度有限**：約 1000 次/月，用完當月停用（下月自動重置）
4. **回程訂票**：華航無可靠 deep link，目前經 Google Flights 再選航班
5. **HND→SGN 直飛**：班機集中凌晨出發，09:00–15:00 去程出發窗內無直飛可追蹤

## 授權

Private project — 詳見 repository 設定。
