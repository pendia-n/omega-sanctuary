# IMPL-PLAN: orega Headless RaaS (Phase 1)

## 1. System Architecture
**Stack**: Node.js (Hono), SQLite (Better-SQLite3), React (Vite).
**Pattern**: Headless-First. The UI is a documentation/key-gen portal; the Core Product is the API.

## 2. Database Schema (SQLite)
### `users` (Anonymous)
- `id` (UUID): Primary Key.
- `created_at`: Timestamp.
- *No email/password fields.*

### `api_keys`
- `id` (UUID): Primary Key.
- `user_id`: FK to `users`.
- `key_hash`: **BCRYPT** hash of the generated key. (We do NOT store plain keys).
- `created_at`: Timestamp.

### `credits`
- `user_id`: FK to `users`.
- `balance`: DECIMAL(10,2). Default: **170.00** (Initial Sovereign Grant).
- `last_refill`: DATETIME (For daily 60 credit top-up).

### `command_logs`
- `id` (UUID): Transaction ID.
- `api_key_id`: FK to `api_keys`.
- `command_string`: Raw K-Spec input (e.g., `K-MOVE { x:10 }`).
- `response_json`: Full JSON output from the physics engine.
- `proof_hash`: SHA-256 signature of the action.
- `status`: `SUCCESS` | `FAILURE` | `OBSTACLE` | `LOW_BATTERY`.
- `cost`: Amount deducted.

## 3. Robotic Scenarios & Responses
The API must simulate realistic physical feedback.

### Scenario A: Successful Move
- **Input**: `K-MOVE { x: 10, y: 0, speed: 1.0 }`
- **Response**:
```json
{
  "status": "success",
  "data": { "final_pos": { "x": 10, "y": 0 }, "battery_drain": "0.5%" },
  "proof": "sha256:7f83b165..."
}
```

### Scenario B: Obstacle Collision
- **Input**: `K-MOVE { x: 50, y: 50 }`
- **Response**:
```json
{
  "status": "failure",
  "error": "OBSTACLE_DETECTED",
  "data": { "collision_force": "2N", "location": { "x": 45, "y": 45 } },
  "proof": "sha256:9a81c2..."
}
```

### Scenario C: Grip Slip
- **Input**: `K-GRIP { force: 100 }`
- **Response**:
```json
{
  "status": "warning",
  "message": "GRIP_SLIP",
  "data": { "pressure_applied": "90%", "object_stability": "unstable" }
}
```

## 4. UI Implementation Details
### The "9-Second" Ephemeral Key
1. User clicks **"GENERATE KEY"**.
2. **Backend**: Creates User -> Hashes Key -> Stores Hash -> Returns Raw Key.
3. **Frontend**:
   - Displays Raw Key in a large, copyable box.
   - Starts a **9-second countdown**.
   - **At 0s OR Refresh**: Key is wiped from React State.
   - *Warning*: "Key is shown ONCE. If lost, generate a new one."

### Agent Showcase
- Interactive section showing "Agent Atlas" (Logistics), "Agent Hermes" (Data).
- Clicking an agent populates the "API Playground" with their specific K-Spec commands.
- Live "Test Request" button sends the command (using the ephemeral key) to the local API and renders the JSON response.
