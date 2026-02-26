# Kinetic RaaS: Readiness Checklist

## 1. Core Logic (Refill Protocol)
- [ ] **24h Window Enforcement**: Refills are processed based on the 24-hour cycle from `last_refill`.
- [ ] **Balance Condition**: Credits are only added if the current balance is ≤ 160.
- [ ] **Counter Accuracy**: `refill_count` only increments when an actual credit injection (32.0) occurs.
- [ ] **Ghost Timer Integration**: Ephemeral identities expire correctly after 9s without ignition.

## 2. Administrative Oversight (Admin Mode)
- [ ] **Session Persistence**: Admin state is persisted in `localStorage`. Page refresh does not force logout.
- [ ] **Rate-Limit Exemption**: All paths under `/api/admin` bypass the global rate-limiter.
- [ ] **Atomic Deletion**: Deleting a user removes both the identity and all associated action logs in a single transaction.
- [ ] **Identity Purge UX**: Deletion is immediate and provides a success alert confirmation.

## 3. UI and Telemetry
- [ ] **Full Timestamps**: "CREATED" and "AUDIT" columns show full date and time (`toLocaleString`).
- [ ] **Real-time Feedback**: Physics compiler errors are displayed correctly as alerts.
- [ ] **Persistence**: API keys are stored in `localStorage` for returning users.

## 4. System Stability
- [ ] **Error Resilience**: Failed admin fetches do not crash the UI (Error Boundaries/Try-Catch).
- [ ] **CORS Policy**: CORS headers are restricted to the allowed production or local origin.
- [ ] **Rate Limiting**: Non-admin users are restricted to 60 requests per minute correctly.
