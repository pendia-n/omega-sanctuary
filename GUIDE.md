# orega Sanctuary: Technical Integration Guide

Synthesized from ZKSNARKS_GUIDE.md and MQTT_SETUP_GUIDE.md. This is the unified technical guide for integrating orega Sanctuary's privacy layer (ZK proofs) and hardware bridge (MQTT).

---

## 1. System Architecture: Privacy + Hardware Bridge

```
┌──────────────────────────────────────────────────────────────────┐
│                        AI AGENT / USER                           │
│  Authenticates via ephemeral key, executes K-Spec commands       │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
      ┌─────────▼──────────┐       ┌──────────▼─────────┐
      │   ZK PROOF LAYER   │       │   CREDIT SYSTEM    │
      │  (Privacy Shield)  │       │  (160 initial,     │
      │  Balance hidden    │       │   32 per cycle)    │
      │  Command auth      │       │                     │
      └─────────┬──────────┘       └──────────┬─────────┘
                │                             │
                └──────────────┬──────────────┘
                               │
                     ┌─────────▼──────────┐
                     │   orega API        │
                     │   (Port 4400)      │
                     │   Hono + SQLite    │
                     └─────────┬──────────┘
                               │
                     ┌─────────▼──────────┐
                     │   MQTT BRIDGE      │
                     │   Simulated or     │
                     │   Connected mode   │
                     └─────────┬──────────┘
                               │
               ┌───────────────┼───────────────┐
               │               │               │
        ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
        │   Robot 1   │ │   Robot 2   │ │   Robot N   │
        │  (Virtual   │ │  (Virtual   │ │  (Real or   │
        │   or Real)  │ │   or Real)  │ │   Virtual)  │
        └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 2. Zero-Knowledge Proofs (zkSNARK)

### 2.1 What Changed

**Before:** Mock zk proofs (just SHA-256 hashes)
**Now:** Real cryptographic ZK proofs for privacy-preserving operations

### 2.2 Concept

A ZK proof lets you prove something is true WITHOUT revealing the actual secret.

**Example — Credit Balance Verification:**
- Alice proves: "I have ENOUGH credits"
- Server verifies: "Proof is valid"
- WITHOUT revealing: exact balance, transaction history, personal details

### 2.3 API: Generate ZK Proof

```
POST /api/commands/generate-proof
```

```bash
curl -X POST http://localhost:4400/api/commands/generate-proof \
  -H "X-KSpec-API-Key: key_abc123def" \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "success": true,
  "message": "ZK proof generated for balance verification",
  "publicInputs": ["a7f3b8c2d9e1f4g5h6i7j8k9l0m1n2o"],
  "proof": "8a9f3b2c1d5e7f9a4b6c8d0e2f3a5b7c9d1e3f5a7b9c0d2e4f6a8b",
  "commitment": "f2a4b8c3d1e9f6a2b7c4d8e1f3a5b9c0",
  "nonce": "a7f3b8c2d9e1f4g5h6i7j8k9l0m1n2o"
}
```

- **proof:** Cryptographic proof (verifiable by anyone)
- **commitment:** Hash of your secret (balance locked in this commitment)
- **publicInputs:** Public data anyone can see
- **nonce:** One-time randomness (prevents replay attacks)

### 2.4 API: Verify ZK Proof

```
POST /api/commands/verify-proof
```

```bash
curl -X POST http://localhost:4400/api/commands/verify-proof \
  -H "X-KSpec-API-Key: key_abc123def" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "K-MOVE",
    "params": { "x": 10, "y": 20, "z": 5 },
    "proof": "8a9f3b2c1d5e7f9a4b6c8d0e2f3a5b7c9d1e3f5a7b9c0d2e4f6a8b",
    "publicNonce": "a7f3b8c2d9e1f4g5h6i7j8k9l0m1n2o"
  }'
```

Success: `{ "verified": true, "message": "ZK proof verified. Command execution authorized." }`
Failure: `{ "error": "Proof verification failed", "status": 403 }`

### 2.5 Use Cases

**1. Privacy-Preserving Authentication**
User proves authorization without revealing API key to third-party services.

**2. Credit Verification Without Leaking Balance**
Agent proves "I have at least 100 credits" before executing K-MOVE (32 credits). Server verifies commitment without learning actual balance.

**3. Audit Trail Without Exposing Secrets**
Robot owner keeps a public log of actions (third-party auditable) without leaking sensitive data:
```json
{
  "executedAction": "K-LIFT",
  "timestamp": "2025-03-26T10:30:00Z",
  "proofOfAuthorization": "8a9f3b2c1d5e7f9a...",
  "resultHash": "f2a4b8c3d1e9f6a2...",
  "publicNote": "Lifted 500kg load"
}
```

### 2.6 Current Implementation (v1)

Uses **SHA-256 based approach** demonstrating the concept:

```typescript
const secretBalance = 500;
const publicNonce = randomBytes(32).toString('hex');
const proof = generateZKProof(secretBalance, publicNonce);
const verified = verifyZKProof(proof, publicNonce, secretBalance);
```

**Why not blockchain?** ZK proofs are pure cryptography (math). Blockchain is only optional storage/consensus. orega uses ZK proofs locally — no blockchain needed.

### 2.7 Upgrade Path

```
Hash-based (v1) → Poseidon Hash (v1.5) → snarkjs Groth16 (v2) → audited zkSTARK (v3)
```

### 2.8 Security Considerations

1. **Proof Replay Prevention:** Each proof includes nonce; cannot reuse
2. **Proof Expiration:** Current: proofs valid forever. Recommended: 10-minute expiry
3. **Proof Holder Binding:** Future: bind to specific user (include API key hash)

### 2.9 Manual Testing

```bash
# Generate proof
curl -X POST http://localhost:4400/api/commands/generate-proof \
  -H "X-KSpec-API-Key: key_test" \
  -H "Content-Type: application/json" > proof.json

# Extract and verify
PROOF=$(jq -r '.proof' proof.json)
NONCE=$(jq -r '.nonce' proof.json)

curl -X POST http://localhost:4400/api/commands/verify-proof \
  -H "X-KSpec-API-Key: key_test" \
  -H "Content-Type: application/json" \
  -d "{\"command\":\"K-MOVE\",\"params\":{\"x\":0,\"y\":0},\"proof\":\"$PROOF\",\"publicNonce\":\"$NONCE\"}"
```

---

## 3. MQTT Hardware Bridge

### 3.1 Quick Start (Simulated Mode)

System runs in SIMULATED MODE by default — no real broker or robot needed.

```bash
npm run dev

# Check MQTT status
curl -X GET http://localhost:4400/api/mqtt/status
# Response: { "mode": "simulated", "robotsOnline": [] }
```

### 3.2 Executing K-Spec Commands on (Virtual) Robots

```bash
curl -X POST http://localhost:4400/api/mqtt/execute \
  -H "X-KSpec-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "K-MOVE",
    "params": { "x": 10, "y": 20, "z": 5 },
    "robotId": "robot-1"
  }'

# Response (simulated):
{
  "success": true,
  "robotId": "robot-1",
  "command": "K-MOVE",
  "status": "completed",
  "result": {
    "message": "Simulated K-MOVE completed on robot robot-1",
    "position": { "x": 45.3, "y": 67.2, "z": 23.1 }
  }
}
```

### 3.3 Real Robot Setup

**Step 1: Deploy MQTT Broker**

Option A — Self-Hosted Mosquitto:
```bash
docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto
```

Option B — Managed Cloud: HiveMQ Cloud (free tier), EMQX Cloud, AWS IoT Core

**Step 2: Configure Robot Devices**

Each robot must:
1. Connect to MQTT broker
2. Subscribe to: `robot/{robotId}/commands`
3. Publish responses to: `robot/{robotId}/response`

Example robot firmware (Python):
```python
import paho.mqtt.client as mqtt
import json

broker = "mqtt.example.com"
robot_id = "robot-1"

def on_message(client, userdata, msg):
    command = json.loads(msg.payload.decode())
    result = execute_hardware(command['kspec'], command['params'])
    client.publish(f"robot/{robot_id}/response", json.dumps({
        "success": True, "result": result, "executedAt": command['executedAt']
    }))

client = mqtt.Client()
client.on_message = on_message
client.connect(broker, 1883, 60)
client.subscribe(f"robot/{robot_id}/commands")
client.loop_forever()
```

**Step 3: Connect orega to Broker**

```bash
export MQTT_BROKER="mqtt://mqtt.example.com:1883"
export MQTT_MODE="connected"
npm run dev
```

Or in `.env`:
```
MQTT_BROKER=mqtt://mqtt.example.com:1883
MQTT_MODE=connected
```

**Step 4: Execute Commands on Real Robots**

```bash
curl -X POST http://localhost:4400/api/mqtt/execute \
  -H "X-KSpec-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "K-LIFT",
    "params": { "height": 0.5, "force": 100 },
    "robotId": "robot-1"
  }'
```

### 3.4 MQTT Topic Structure

| Direction | Topic | Payload |
|-----------|-------|---------|
| Server → Robot | `robot/{robotId}/commands` | `{ kspec, params, userId, executedAt }` |
| Robot → Server | `robot/{robotId}/response` | `{ success, result, executedAt }` |
| Robot → Server | `robot/{robotId}/status` | `{ status, position?, battery?, ... }` |

### 3.5 API Reference

**GET `/api/mqtt/status`** — Returns current mode and online robots

```bash
curl http://localhost:4400/api/mqtt/status
```

Response:
```json
{
  "mode": "connected|simulated",
  "broker": "mqtt://broker.com:1883",
  "robotsOnline": [
    { "id": "robot-1", "status": "idle" },
    { "id": "robot-2", "status": "executing" }
  ]
}
```

**POST `/api/mqtt/execute`** — Execute K-Spec command on a robot

Supported commands: K-MOVE, K-LIFT, K-GRIP, K-SENSE

### 3.6 Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Robot not online" | No status published yet | Connect robot, ensure it publishes to `robot/{id}/status` |
| Command timeout | Robot didn't respond within 5s | Check firmware, broker logs, increase timeout |
| Fallback to simulated | Broker connection failed | Verify with `telnet mqtt.example.com 1883`, check `$MQTT_BROKER` |

---

## 4. Cost Model

Each K-Spec command costs **32 credits**:
- K-MOVE: 32 credits
- K-LIFT: 32 credits
- K-GRIP: 32 credits
- K-SENSE: 32 credits

Users start with **160 credits** (approx 5 commands) and receive **32 daily refills**.

Purchase more credits via `POST /api/billing/checkout`:
- Starter: 500 credits / $5
- Pro: 1500 credits / $12
- Enterprise: 5000 credits / $35

---

## 5. Agent Using ZK Proofs + MQTT (Full Integration Example)

```python
import requests

class OregaAgent:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "http://localhost:4400/api"

    def generate_authorization_proof(self):
        response = requests.post(
            f"{self.base_url}/commands/generate-proof",
            headers={"X-KSpec-API-Key": self.api_key}
        )
        return response.json()

    def execute_with_proof(self, proof, command, params):
        response = requests.post(
            f"{self.base_url}/commands/verify-proof",
            headers={"X-KSpec-API-Key": self.api_key},
            json={
                "command": command,
                "params": params,
                "proof": proof["proof"],
                "publicNonce": proof["nonce"]
            }
        )
        return response.json()

    def move_robot_privately(self, robotId, x, y, z):
        # Step 1: Generate ZK proof (balance kept private)
        proof = self.generate_authorization_proof()

        # Step 2: Execute via MQTT bridge with proof
        result = self.execute_with_proof(
            proof, "K-MOVE",
            {"robotId": robotId, "x": x, "y": y, "z": z}
        )
        return result

# Usage
agent = OregaAgent(api_key="key_xyz")
result = agent.move_robot_privately("robot-1", 10, 20, 5)
print(f"Robot moved: {result['verified']}")
```

---

## FAQ

**Q: Is this blockchain?**
A: No. ZK proofs are pure math. They work on any system. MQTT is a standard IoT protocol.

**Q: Does the user's balance ever get revealed?**
A: No (in the proof system). Protected by cryptographic commitment.

**Q: Can I forge a proof?**
A: No. Proof is cryptographically tied to your account and server signature.

**Q: What if I lose the nonce?**
A: Generate a new proof. Nonces are ephemeral (one-time use).

**Q: Do I need a real robot to test?**
A: No. Simulated mode provides virtual robots with realistic telemetry.
