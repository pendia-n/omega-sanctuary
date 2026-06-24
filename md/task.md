# Task: orega RaaS Phase 1 (Rebuild)

- [x] **Project Setup**
    - [x] Initialize Hono (Backend) & Vite (Frontend).
    - [x] Setup SQLite with `better-sqlite3`.
    - [x] Create `init-mark.md` (Mission) & `masterPlan.md`.

- [x] **Core Backend (Headless RaaS)**
    - [x] **Auth Middleware**: Implement `X-KSpec-API-Key` validation (Hash check).
    - [x] **Billing Engine**: Deduct 0.5 credits per primitive. 402 on empty.
    - [x] **Command Engine**: Implement K-MOVE, K-GRIP, K-SENSE with fake physics.
    - [x] **Logging**: Save atomic logs with SHA-256 proofs.

- [x] **Frontend (The Terminal UI)**
    - [x] **Key Gen**: 9s Timer Component. Wipes on unmount/refresh.
    - [x] **Showcase**: "Agent Atlas" & "Agent Hermes" presets.
    - [x] **Documentation**: "How to Query" guide with cURL/JSON snippets.
    - [x] **Warning System**: "KEY LOST FOREVER" modal.

- [x] **Verification**
    - [x] Run full E2E flow: Gen Key -> Copy -> cURL -> Verify 200 OK + JSON.
    - [x] Test 9s timer expiry.
    - [x] Test 402 Insufficient Funds.

- [ ] **Phase 3: Physical Bridge & Scaling**
    - [ ] **Polling Proxy**: Create a Python bridge for real hardware consumption.
    - [ ] **Webhooks**: Direct command push architecture.

- [ ] **Phase 4: Production Architecture & Trust**
    - [ ] **Repo Separation**: Define and implement the Multi-Repo strategy (SDK/Spec/BE).
    - [ ] **SDK Polish**: Zero-dependency fetch implementation for broader compatibility.
    - [ ] **Spec Documentation**: Create `K-SPEC.md` as the official protocol definition.

- [x] **Phase 2: The Sovereign Refinement (Nietzschean Logic)**
    - [x] **Credit Overhaul**: Initialize with 170 credits, implement 60 daily refill.
    - [x] **UI Balance Display**: Show live credit balance in the header.
    - [x] Analyze existing refill logic in `src/index.ts` and `src/db.ts`
    - [x] Fix refill logic to strictly check balance <= 160 and only inc count on refill
    - [x] Update UI in `ui/src/App.tsx` to show full timestamp
    - [x] Persist admin session in localStorage
    - [x] Fix logout-loop when ephemeral key expires in admin mode
    - [/] Exempt `/api/admin` from rate limiting in `src/index.ts` [/]
    - [/] Add error boundaries and try/catch to admin fetches in `App.tsx` [/]
    - [ ] Verify administrator resilience under high load
    - [x] **Expanded Primitives**: Update engine to support K-WAIT condition and K-SENSE metadata.
    - [x] **Action Registry**: Framework for storing reusable K-Spec modules.

- [ ] **Phase 3: Protocol Sophistication & UX Polish**
    - [x] **UX Correction**: Change self-destruct log severity and fix telemetry persistence.
    - [ ] **Primitive Expansion**: Add `K-SCAN`, `K-COMPUTE`, and `K-STREAM` to the engine.
    - [ ] **Real-world Connection Strategy**: Document the webhook/polling bridge for non-simulated agents.
    - [ ] **Strategic Evaluation**: Draft the "Informational Layer" thesis in `raas_strategy.md`.
