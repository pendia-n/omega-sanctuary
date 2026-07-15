     1|# Ω Sanctuary — 完整建造手冊 / Complete Build Manual
     2|
     3|> 版本 / Version: 1.0 · 2026-07-08
     4|> 命理 / ZWDS: 破軍殺破狼 · 壬水 59.86% · 用神戊土
     5|> 策略 / Strategy: Storage-Only · SHA-256 + Hash Chain + Polygon Merkle Anchor
     6|> 市場 / Market: EU AI Act Art.12 (2026.08.02) · Physical AI $5.23B→$87.43B by 2035
     7|> 護城河 / Moat: Court-admissible evidence chain · First-mover regulation play
     8|
     9|---
    10|
    11|## 目錄 / Table of Contents
    12|
    13|1. [產品概述 / Product Overview](#1-產品概述--product-overview)
    14|2. [基礎架構 / Architecture: 三層證明鏈](#2-基礎架構--architecture-三層證明鏈)
    15|3. [完整 API 規範 / Full API Specification](#3-完整-api-規範--full-api-specification)
    16|4. [定價方案 / Pricing Table](#4-定價方案--pricing-table)
    17|5. [D1 資料庫結構 / D1 Schema](#5-d1-資料庫結構--d1-schema)
    18|6. [Polygon 時間戳錨定 + Cron / Polygon Anchoring + Cron](#6-polygon-時間戳錨定--cron--polygon-anchoring--cron)
    19|7. [公開驗證頁面設計 / Public Verify Page Design](#7-公開驗證頁面設計--public-verify-page-design)
    20|8. [EU AI Act 合規對應 / EU AI Act Compliance Mapping](#8-eu-ai-act-合規對應--eu-ai-act-compliance-mapping)
    21|9. [用戶旅程 / User Journey](#9-用戶旅程--user-journey)
    22|10. [建造順序 / Build Order: Phase A–G](#10-建造順序--build-order-phase-a--g)
    23|11. [關鍵設計決策 / Critical Design Decisions](#11-關鍵設計決策--critical-design-decisions)
    24|12. [凍結指令 / Freeze Instructions](#12-凍結指令--freeze-instructions)
    25|
    26|---
    27|
    28|## 1. 產品概述 / Product Overview
    29|
    30|### 一句話總結 / One Sentence
    31|
    32|> OS is the Physical AI era's event timeline preservation layer. When robots act, the record can be verified.
    33|>
    34|> Ω Sanctuary 是實體 AI 時代的事件時間戳保全層。機器人做過什麼，記錄可以被驗證。
    35|
    36|## 核心問題 / The Problem
    37|
    38|EU AI Act **Article 12**（生效 2026.08.02）強制高風險 AI 系統必須具備自動事件記錄功能。Article 19 要求日誌至少保留 6 個月。
    39|
    40|但法律**沒有強制使用第三方**。第三方不是法規需求，是**可信度需求**。
    41|
    42|> 監管機構審計公司 A：「這是我們的日誌。」
    43|> 「誰控制的？」「我們。」
    44|> 「罰款 €30M 或全球營收 6%。」
    45|>
    46|> 監管機構審計公司 B（用 OS）：
    47|> 「這是 OS 的事件鏈證明。Merkle root on Polygon: 0xabc...」
    48|> 「記錄時間戳可獨立驗證。」
    49|
    50|The law doesn't demand a third party — **but your own logs are not credible after an incident.** Third-party timestamp preservation is the difference between "we say this record existed" and "the blockchain proves this record existed at that time."
    51|
    52|**Important boundary:** OS proves the record existed at a given time and hasn't been modified since. It does NOT prove the record's content is truthful — that depends on the robot's sensors and the operator's integrity before logging.
    53|
    54|### 產品範圍 / Product Scope
    55|
    56|| What OS IS | What OS IS NOT |
    57||---|---|
    58|| ✅ Hash → Store → Verify | ❌ Robot execution engine |
    59|| ✅ 3-layer cryptographic proof chain | ❌ ZK proof system |
    60|| ✅ Compliance PDF export | ❌ MQTT pub/sub broker |
    61|| ✅ Public verification endpoint | ❌ Physics compiler |
    62|| ✅ Polygon on-chain anchoring | ❌ Robot command interpreter |
    63|| ✅ Stripe weekly debit billing | ❌ Real-time control system |
    64|| ✅ Proves record existed at a given time | ❌ Proves the record's content is truthful |
    65|| ✅ Detects post-recording tampering | ❌ Prevents pre-recording forgery |
    66|
    67|### 市場定位 / Market Position
    68|
    69|- **Physical AI 市場**: $5.23B (2025) → $87.43B (2035), CAGR 32.53% [SNS Insider]
    70|- **人形機器人**: $2.16B (2026) → $8.78B (2033+)
    71|- **競爭**: 0 個產品定位為「機器人事件時間戳保全層」。純粹的藍海。
    72|  - Bernstein.io ($54-329/mo): IP certificates（單檔時間戳），不做機器人行爲鏈
    73|  - 自建日誌：技術可行，但法庭上可信度爲零
    74|  - 傳統公證：無法處理高頻機器日誌
    75|
    76|---
    77|
    78|## 2. 基礎架構 / Architecture: 三層證明鏈
    79|
    80|### 三層證明鏈 / Three-Layer Proof Chain
    81|
    82|| 層 / Layer | 技術 / What | 防止 / Prevents |
    83||---|---|---|
    84|| 1. SHA-256 | hash(payload) == stored hash | 內容篡改 / Content tampering |
    85|| 2. Hash Chain | proof_N = SHA-256(payload_N + proof_(N-1)) | 刪除、插入、重排序 / Deletion, insertion, reordering |
    86|| 3. Merkle + Polygon | 每日 Merkle root 上鏈 / Daily merkle root on-chain | 平台運營商篡改 / Platform operator tampering |
    87|
    88|Layer 3 是關鍵。沒有鏈上錨定，OS 自己也能修改 SQLite 記錄。有了 Polygon 錨定，連 OS 也無法改寫歷史。
    89|
    90|> Layer 3 is critical. Without on-chain anchoring, OS itself could modify SQLite records. With Polygon anchoring, even OS can't rewrite history.
    91|
    92|### 法庭先例 / Court Precedent
    93|
    94|- EU eIDAS 法規 — 電子簽名與信任服務
    95|- US Federal Rules of Evidence 902(13/14) — 數字認證
    96|- 意大利 Law 12/2019 — 分布式賬本法律效力
    97|- 法國馬賽法庭 (2025) — 區塊鏈證據採納
    98|- Frontiers in Blockchain (2026) — 區塊鏈證據在民事訴訟中越來越被認可
    99|
   100|### 整體架構圖 / Architecture Diagram
   101|
   102|```
   103|┌──────────────────────────────────────┐
   104|│            CLIENT / ROBOT             │
   105|│  (Robot fleet / any data source)      │
   106|└────────┬─────────────────────────────┘
   107|         │ POST /record { source, action, params }
   108|         │ Authorization: Bearer sk_xxx
   109|         ▼
   110|┌──────────────────────────────────────┐
   111|│    Ω Sanctuary API                   │
   112|│    TypeScript · Hono · CF Workers    │
   113|│                                      │
   114|│  Layer 1: SHA-256 hash(payload)      │
   115|│  Layer 2: Hash chain (prev proof)    │
   116|│  Layer 3: Daily Merkle root → Polygon│
   117|└────────┬─────────────────────────────┘
   118|         │ Stores in D1
   119|         ▼
   120|┌──────────────────────────────────────┐
   121|│    Cloudflare D1 (SQLite)            │
   122|│  ┌─────────────┐ ┌─────────────────┐ │
   123|│  │  api_keys   │ │  action_logs    │ │
   124|│  └─────────────┘ └─────────────────┘ │
   125|│  ┌──────────────────────────────────┐ │
   126|│  │  merkle_anchors                 │ │
   127|│  │  (merkle_root, polygon_tx)      │ │
   128|│  └──────────────────────────────────┘ │
   129|└──────────────────────────────────────┘
   130|         │
   131|         │ Daily cron: buildMerkleTree() → anchor to Polygon
   132|         ▼
   133|┌──────────────────────────────────────┐
   134|│    Polygon Network (PoS)             │
   135|│    Contract: OSMerkleAnchor.sol      │
   136|│    Stores: merkle_root → block_num   │
   137|└──────────────────────────────────────┘
   138|```
   139|
   140|### 技術棧 / Tech Stack
   141|
   142|| 組件 / Component | 技術 / Choice | 原因 / Rationale |
   143||---|---|---|
   144|| Runtime | Cloudflare Workers | Edge global, no infra ops, D1 native |
   145|| 數據庫 | Cloudflare D1 (SQLite) | Serverless SQL, auto-scaling |
   146|| 框架 | Hono | TypeScript-native, CF Workers optimized, 0 overhead |
   147|| 哈希 | SHA-256 | NIST standard, court-accepted, hardware-accelerated |
   148|| 區塊鏈 | Polygon PoS (default) | $0.01/day gas vs Ethereum $5/day |
   149|| 付款 | Stripe | B2B weekly debit, webhook-native |
   150|| 前端 | React (3 pages only) | API Keys, Usage, Billing. No branding, no animations |
   151|
   152|---
   153|
   154|## 3. 完整 API 規範 / Full API Specification
   155|
   156|### 3.1 註冊 / Sign Up
   157|
   158|**POST `/signup`**
   159|
   160|立即獲得 API key。無需 Email 驗證。
   161|
   162|```bash
   163|curl -X POST https://os.workers.dev/signup \
   164|  -H "Content-Type: application/json" \
   165|  -d '{
   166|    "email": "engineer@robot-co.com",
   167|    "company": "Robot Co",
   168|    "tier": "a"
   169|  }'
   170|```
   171|
   172|Response:
   173|```json
   174|{
   175|  "api_key": "sk_os_a1b2c3d4e5f6...",
   176|  "tier": "a",
   177|  "balance_cents": 0,
   178|  "created_at": "2026-07-08T04:00:00Z"
   179|}
   180|```
   181|
   182|Email 用於發票、合規報告、續費通知。
   183|
   184|### 3.2 記錄 / Record
   185|
   186|**POST `/record`**
   187|
   188|提交一筆行為記錄，取得三層加密證明。
   189|
   190|```bash
   191|curl -X POST https://os.workers.dev/record \
   192|  -H "Authorization: Bearer sk_os_a1b2c3d4e5f6..." \
   193|  -H "Content-Type: application/json" \
   194|  -d '{
   195|    "source": "robot-07",
   196|    "action": "PICK_UP",
   197|    "params": {
   198|      "x": 10.5,
   199|      "y": 20.3,
   200|      "object_id": "widget-441"
   201|    },
   202|    "metadata": {
   203|      "firmware": "v2.1.3",
   204|      "sensor_temp": 42.5
   205|    }
   206|  }'
   207|```
   208|
   209|Response:
   210|```json
   211|{
   212|  "success": true,
   213|  "proof": "sha256:a1b2c3d4e5f6...",
   214|  "timestamp": "2028-03-15T10:30:00Z",
   215|  "chain_depth": 1234,
   216|  "tier": "a",
   217|  "records_written": 1
   218|}
   219|```
   220|
   221|**成本**：按 throughput 方案計費（見 Pricing），每週自動扣款。B2B 基礎設施不該用「點數」模式。
   222|
   223|### 3.3 驗證 / Verify（需要授權）
   224|
   225|**GET `/verify/:proof`**
   226|
   227|驗證一筆記錄的三層完整性。
   228|
   229|```bash
   230|curl https://os.workers.dev/verify/sha256:a1b2c3d4e5f6... \
   231|  -H "Authorization: Bearer sk_os_a1b2c3d4e5f6..."
   232|```
   233|
   234|Response:
   235|```json
   236|{
   237|  "verified": true,
   238|  "record": {
   239|    "source": "robot-07",
   240|    "action": "PICK_UP",
   241|    "params": {"x": 10.5, "y": 20.3},
   242|    "timestamp": "2028-03-15T10:30:00Z"
   243|  },
   244|  "chain_integrity": {
   245|    "layer1_sha256": "✓ hash matches stored content",
   246|    "layer2_hash_chain": "✓ linked to previous proof sha256:prev...",
   247|    "layer3_merkle_anchor": "✓ included in merkle root 0xmroot...",
   248|    "polygon_tx": "0xabc123...",
   249|    "block_number": 45678900
   250|  },
   251|  "stored_at": "2028-03-15T10:30:00Z"
   252|}
   253|```
   254|
   255|若驗證失敗：
   256|```json
   257|{
   258|  "verified": false,
   259|  "reason": "hash_chain_break",
   260|  "details": "proof sha256:a1b2... references previous sha256:xyz... which does not exist"
   261|}
   262|```
   263|
   264|### 3.4 公開驗證 / Public Verify
   265|
   266|**GET `/verify/public/:proof`**
   267|
   268|無需 API key。供保險公司、監管機構、法院使用。
   269|
   270|```bash
   271|curl https://os.workers.dev/verify/public/sha256:a1b2c3d4e5f6...
   272|```
   273|
   274|Response 同上，但不包含完整 payload（僅 proof、timestamp、verification status）。
   275|
   276|### 3.5 匯出合規報告 / Export Compliance Report
   277|
   278|**GET `/export/report`**
   279|
   280|生成合規 PDF，包含：
   281|- 鏈完整性證明
   282|- Merkle anchors 列表
   283|- Polygon 交易哈希
   284|- EU AI Act Art.12 合規印章
   285|- 時間範圍選擇（預設 30 天）
   286|
   287|```bash
   288|curl https://os.workers.dev/export/report?from=2028-01-01&to=2028-03-15 \
   289|  -H "Authorization: Bearer sk_os_a1b2c3d4e5f6..."
   290|```
   291|
   292|Response: `Content-Type: application/pdf` 二進制 PDF 文件。
   293|
   294|### 3.6 記錄列表 / List Records
   295|
   296|**GET `/records`**
   297|
   298|列出最近 50 筆記錄。
   299|
   300|```bash
   301|curl https://os.workers.dev/records \
   302|  -H "Authorization: Bearer sk_os_a1b2c3d4e5f6..."
   303|```
   304|
   305|### 3.7 用量查詢 / Usage
   306|
   307|**GET `/usage`**
   308|
   309|```bash
   310|curl https://os.workers.dev/usage \
   311|  -H "Authorization: Bearer sk_os_a1b2c3d4e5f6..."
   312|```
   313|
   314|Response:
   315|```json
   316|{
   317|  "total_records": 12345,
   318|  "records_this_month": 4567,
   319|  "plan": "business",
   320|  "plan_limit": 1000000,
   321|  "plan_remaining": 995433
   322|}
   323|```
   324|
   325|### 3.8 公開 Merkle Root / Public Merkle Root
   326|
   327|**GET `/merkle/latest`**
   328|
   329|無需授權。返回最新 Merkle root 及其 Polygon 錨定。
   330|
   331|```bash
   332|curl https://os.workers.dev/merkle/latest
   333|```
   334|
   335|Response:
   336|```json
   337|{
   338|  "merkle_root": "0xmroot_a1b2c3...",
   339|  "polygon_tx": "0xabc123def456...",
   340|  "block_number": 45678900,
   341|  "anchored_at": "2028-03-15T23:59:59Z",
   342|  "record_count": 5000
   343|}
   344|```
   345|
   346|---
   347|
   348|## 4. 定價方案 / Pricing Table
   349|
   350|### 兩個角色，兩種定價
   351|
   352|所有產品（OS + OD）共用同一套定價邏輯，按「你是寫入者還是讀取者」分軌：
   353|
   354|| 角色 | 做什麼 | 付費方式 |
   355||---|---|---|
   356|| **Writer**（產生數據） | 機器人公司存行為記錄、律師事務所存證據鏈、醫院存醫療日誌 | 按 throughput 分層，每週/每月扣款 |
   357|| **Reader**（驗證數據） | 律師查機器人事故記錄、保險理賠調查、監管審計、對造律師驗證證據 | **Read Pass** — 一次性付費，30天無限讀取 |
   358|
   359|---
   360|
   361|### Track A: Writers — Weekly / Monthly Throughput Tiers
   362|
   363|**適用：所有需要寫入數據的客戶（機器人公司、律所、醫院、保險、電商、物流）**
   364|
   365|| Tier | Writes/min | Records/write | OS 週費 | OD 月費 | 適合 |
   366||---|---|---|---|---|---|
   367|| **A** | 2 | 250 | **$49/wk** | **$99/mo** | 小型部署 |
   368|| **B** | 4 | 700 | **$149/wk** | **$299/mo** | 中型 |
   369|| **C** | 10 | 1,150 | **$399/wk** | **$799/mo** | 大型 |
   370|| **D** | 20 | 2,000 | **$999/wk** | **$1,999/mo** | 企業級 |
   371|
   372|全部統一：**10 reads/min**。付款：Stripe Customer Balance + 定期自動扣款。
   373|
   374|### Track B: Readers — Cross-Product Read Pass
   375|
   376|**適用：任何人需要驗證數據的人——律師、保險理賠員、監管機構、審計師、對造律師**
   377|
   378|一個 Read Pass，同時可讀 **OS（機器人行為記錄）** 和 **OD（人類證據鏈）** 的數據。
   379|
   380|| 項目 | 費用 | 可做什麼 |
   381||---|---|---|
   382|| **Read Pass（30天）** | **$29** | 無限 GET /verify、GET /case/:ref/chain、GET /export/report、dashboard、跨產品查詢 |
   383|
   384|**沒有免費驗證。沒有公開 verify 入口。Read Pass 是唯一的讀取方式。**
   385|
   386|### 共同規則
   387|
   388|- **$0 免費層**：註冊 + API key only。不能讀也不能寫
   389|- **餘額不足/Pass 到期**：全鎖。不降級。充值或買新 Pass 後恢復
   390|- **付款**：Writer 用 Customer Balance + 定期扣款。Reader 用 one-time PaymentIntent
   391|- **年約折扣**：Writer 年付 = 10 個月；Reader 買 10 個 Pass 送 2 個
   392|
   393|### 企業方案 / Enterprise Plan
   394|
   395|包含：
   396|- 自訂錨定頻率（可選小時級）
   397|- 自選鏈（Polygon / Ethereum / 私有鏈）
   398|- SLA 保證（99.9% uptime）
   399|- 專屬支援
   400|- 自訂合約條款
   401|
   402|---
   403|
   404|## 5. D1 資料庫結構 / D1 Schema
   405|
   406|### 5.1 api_keys
   407|
   408|```sql
   409|CREATE TABLE api_keys (
   410|  id          TEXT PRIMARY KEY,            -- UUID v4
   411|  email       TEXT NOT NULL,               -- 聯絡 Email
   412|  company     TEXT,                        -- 公司名稱（選填）
   413|  key_hash    TEXT NOT NULL UNIQUE,        -- API key 的 SHA-256 hash
   414|  plan        TEXT NOT NULL DEFAULT 'a',   -- a / b / c / d / read_pass / free
   415|  status      TEXT NOT NULL DEFAULT 'active',   -- active / suspended / cancelled
   416|  records_written INTEGER DEFAULT 0,       -- 當週已寫入記錄數
   417|  tier         TEXT NOT NULL DEFAULT 'a',   -- current throughput tier
   418|  balance_cents INTEGER DEFAULT 0,        -- Stripe Customer Balance (cents)
   419|  stripe_customer_id TEXT,                -- Stripe Customer ID
   420|  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
   421|  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
   422|);
   423|CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
   424|CREATE INDEX idx_api_keys_email ON api_keys(email);
   425|```
   426|
   427|### 5.2 action_logs
   428|
   429|```sql
   430|CREATE TABLE action_logs (
   431|  id          TEXT PRIMARY KEY,            -- UUID v4
   432|  api_key_id  TEXT NOT NULL,               -- 外鍵 → api_keys.id
   433|  source      TEXT NOT NULL,               -- 來源識別（robot-07, unit-12）
   434|  action      TEXT NOT NULL,               -- 行為名稱（PICK_UP, MOVE_TO）
   435|  params      TEXT,                        -- JSON 字串：行為參數
   436|  metadata    TEXT,                        -- JSON 字串：額外元數據
   437|  payload_hash TEXT NOT NULL,              -- SHA-256(payload)
   438|  proof       TEXT NOT NULL UNIQUE,        -- SHA-256(payload + prev_proof)
   439|  prev_proof  TEXT,                        -- 前一筆 proof（null if first）
   440|  chain_depth INTEGER DEFAULT 1,          -- hash chain 深度
   441|  timestamp   TEXT NOT NULL DEFAULT (datetime('now')),
   442|  FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
   443|);
   444|CREATE INDEX idx_action_logs_api_key ON action_logs(api_key_id);
   445|CREATE INDEX idx_action_logs_proof ON action_logs(proof);
   446|CREATE INDEX idx_action_logs_timestamp ON action_logs(timestamp);
   447|CREATE INDEX idx_action_logs_source ON action_logs(source);
   448|```
   449|
   450|### 5.3 merkle_anchors
   451|
   452|```sql
   453|CREATE TABLE merkle_anchors (
   454|  id              TEXT PRIMARY KEY,         -- UUID v4
   455|  merkle_root     TEXT NOT NULL UNIQUE,     -- Merkle root hash
   456|  record_count    INTEGER NOT NULL,         -- 包含的記錄數
   457|  record_ids      TEXT NOT NULL,            -- JSON array of record IDs
   458|  polygon_tx_hash TEXT,                     -- Polygon 交易哈希（null 若尚未上鏈）
   459|  polygon_block   INTEGER,                  -- Polygon 區塊號
   460|  chain           TEXT DEFAULT 'polygon',   -- polygon / ethereum
   461|  status          TEXT DEFAULT 'pending',   -- pending / anchored / failed
   462|  period_start    TEXT NOT NULL,            -- 錨定期間起
   463|  period_end      TEXT NOT NULL,            -- 錨定期間迄
   464|  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
   465|  anchored_at     TEXT                      -- 實際錨定時間
   466|);
   467|CREATE INDEX idx_merkle_anchors_root ON merkle_anchors(merkle_root);
   468|CREATE INDEX idx_merkle_anchors_status ON merkle_anchors(status);
   469|CREATE INDEX idx_merkle_anchors_period ON merkle_anchors(period_start, period_end);
   470|```
   471|
   472|### 5.4 遷移腳本 / Migration Script
   473|
   474|```sql
   475|-- 001_create_tables.sql
   476|-- 一次性安裝。無需後續遷移——D1 schema 簡單到不需要 migration framework。
   477|
   478|CREATE TABLE IF NOT EXISTS api_keys (
   479|  id TEXT PRIMARY KEY,
   480|  email TEXT NOT NULL,
   481|  company TEXT,
   482|  key_hash TEXT NOT NULL UNIQUE,
   483|  plan TEXT NOT NULL DEFAULT 'a',
   484|  status TEXT NOT NULL DEFAULT 'active',
   485|  records_written INTEGER DEFAULT 0,
   486|  tier TEXT NOT NULL DEFAULT 'a',
   487|  balance_cents INTEGER DEFAULT 0,
   488|  stripe_customer_id TEXT,
   489|  created_at TEXT NOT NULL DEFAULT (datetime('now')),
   490|  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   491|);
   492|
   493|CREATE TABLE IF NOT EXISTS action_logs (
   494|  id TEXT PRIMARY KEY,
   495|  api_key_id TEXT NOT NULL,
   496|  source TEXT NOT NULL,
   497|  action TEXT NOT NULL,
   498|  params TEXT,
   499|  metadata TEXT,
   500|  payload_hash TEXT NOT NULL,
   501|