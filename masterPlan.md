# MASTER PLAN: Kinetic Headless RaaS

## 1. The Core Concept
**Kinetic** is the "Stripe for Reality". We provide a universal API to control physical resources (robots, drones, sensors).
**The Twist**: It is strictly **Headless**. The UI is only for onboarding; the value is in the API.

## 2. The Protocols
### A. The "Ghost Protocol" (Auth)
- **Problem**: Registration friction kills developer adoption.
- **Solution**: Anonymous, instant, ephemeral.
- **Mechanism**:
  - No Email. No Password.
  - One Click -> API Key.
  - **9-Second Survival**: The user has 9 seconds to claim their identity (key). Failing to do so deletes the opportunity (from the screen), enforcing a "use it or lose it" mentality.

### B. The "Sovereign Action" (Execution)
- **Problem**: AGI hallucinates physical outcomes.
- **Solution**: Cryptographic Proof of Action.
- **Mechanism**:
  - Every API call (K-MOVE, K-GRIP) returns a `sha256_proof`.
  - This proof creates a chain of custody for reality.

## 3. User Journey (The "30-Second Loop")
1. **Land**: User visits `localhost:5173`.
2. **Ignite**: Clicks "Generate Key".
3. **Panic/Focus**: Timer starts (9s). User copies key.
4. **Execute**: User pastes key into their terminal:
   ```bash
   curl -H "X-KSpec-API-Key: sk_..." -d '{"cmd":"K-MOVE"}' localhost:4400/execute
   ```
5. **Verify**: User gets JSON response with `proof`.
6. **Hook**: User runs out of free credits -> "Top Up" (Future).

## 4. Agent Integration
Agents (LangChain, AutoGPT) interact *strictly* via the JSON API.
- **Endpoint**: `POST /api/execute`
- **Headers**: `X-KSpec-API-Key`
- **Body**: `{ "agent_id": "Atlas", "command": "..." }`
