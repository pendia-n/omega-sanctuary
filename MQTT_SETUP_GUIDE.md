# MQTT Hardware Bridge Setup Guide

## Quick Start (Simulated Mode)

The system runs in **SIMULATED MODE** by default - meaning MQTT hardware integration is available but doesn't require a real broker or robot.

```bash
# Default: Starts in simulated mode
npm run dev

# Check MQTT status
curl -X GET http://localhost:4400/api/mqtt/status
# Response: { "mode": "simulated", "robotsOnline": [] }
```

---

## Executing K-Spec Commands on (Virtual) Robots

Even in simulated mode, users can execute commands:

```bash
# Execute K-MOVE on a virtual robot
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

---

## Real Robot Setup (Optional)

To connect to actual MQTT broker with real robots:

### Step 1: Deploy MQTT Broker

**Option A: Self-Hosted Mosquitto (Linux/Docker)**
```bash
# Docker
docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto

# Or install locally
apt-get install mosquitto mosquitto-clients
```

**Option B: Managed Cloud Broker**
- HiveMQ Cloud: https://www.hivemq.cloud/ (free tier)
- EMQX Cloud: https://www.emqx.io/cloud
- AWS IoT Core: https://aws.amazon.com/iot-core/

### Step 2: Configure Robot Devices

Each robot needs to:
1. Connect to the MQTT broker
2. Subscribe to: `robot/{robotId}/commands`
3. Publish responses to: `robot/{robotId}/response`

Example robot firmware (Arduino/Python):

```python
import paho.mqtt.client as mqtt
import json

broker = "mqtt.example.com"
robot_id = "robot-1"

def on_message(client, userdata, msg):
    try:
        command = json.loads(msg.payload.decode())
        print(f"Executing: {command['kspec']} with {command['params']}")
        
        # Execute K-Spec command on actual hardware
        result = execute_hardware(command['kspec'], command['params'])
        
        # Send response back
        client.publish(f"robot/{robot_id}/response", json.dumps({
            "success": True,
            "result": result,
            "executedAt": command['executedAt']
        }))
    except Exception as e:
        print(f"Error: {e}")

client = mqtt.Client()
client.on_message = on_message
client.connect(broker, 1883, 60)
client.subscribe(f"robot/{robot_id}/commands")
client.loop_forever()
```

### Step 3: Connect Kinetic to Broker

Set environment variables:

```bash
export MQTT_BROKER="mqtt://mqtt.example.com:1883"
export MQTT_MODE="connected"  # Leave unset or "simulated" for simulator mode

npm run dev
```

Or in `.env`:
```
MQTT_BROKER=mqtt://mqtt.example.com:1883
MQTT_MODE=connected
```

### Step 4: Execute Commands on Real Robots

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

---

## MQTT Topic Structure

### From Server to Robots
- **Topic:** `robot/{robotId}/commands`
- **Payload:** `{ kspec: string, params: object, userId: string, executedAt: ISO8601 }`

### From Robots to Server
- **Topic:** `robot/{robotId}/response`
- **Payload:** `{ success: boolean, result: any, executedAt: ISO8601 }`

### Robot Status Updates
- **Topic:** `robot/{robotId}/status`
- **Payload:** `{ status: string, position?: {x, y, z}, battery?: number, ... }`

---

## Troubleshooting

### Issue: "Robot {robotId} not online"
**Cause:** Robot hasn't published a status update yet
**Fix:** 
1. Connect robot device and ensure it publishes to `robot/{robotId}/status`
2. Check MQTT broker connectivity

### Issue: Command timeout
**Cause:** Robot didn't respond within 5 seconds
**Fix:**
1. Check robot firmware is running
2. Check MQTT broker logs for message delivery
3. Increase timeout in `/api/mqtt/execute` handler

### Issue: Fallback to Simulated Mode
If real broker connection fails, check:
```bash
# Verify broker is reachable
telnet mqtt.example.com 1883

# Check environment variables
echo $MQTT_BROKER
```

---

## API Reference

### GET `/api/mqtt/status`
Returns current MQTT mode and online robots

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

### POST `/api/mqtt/execute`
Execute K-Spec command on a robot

```bash
curl -X POST http://localhost:4400/api/mqtt/execute \
  -H "X-KSpec-API-Key: key_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "K-MOVE|K-LIFT|K-GRIP|K-SENSE",
    "params": { /* K-Spec parameters */ },
    "robotId": "robot-1"
  }'
```

Response on success:
```json
{
  "success": true,
  "robotId": "robot-1",
  "command": "K-MOVE",
  "status": "completed",
  "result": { /* Robot response */ }
}
```

---

## Cost Model

Each K-Spec command costs **32 credits**:
- K-MOVE: 32 credits
- K-LIFT: 32 credits
- K-GRIP: 32 credits
- K-SENSE: 32 credits
- etc.

Users start with **160 credits** (≈ 5 commands) and receive **32 daily refills**.

Want more credits? Purchase via [POST `/api/billing/checkout`](#billing)
