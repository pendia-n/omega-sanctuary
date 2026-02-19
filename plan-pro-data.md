# PRO-DATA: Verified Physical Telemetry

How to prove that an instruction was executed with precision in meat-space.

## Option A: Direct Hardware Stream (Low Latency)
The Kernel maintains a WebSocket connection to the Node. Telemetry (Voltage, Torque, Heat) is piped directly to the `/api/history` feed.
- **Pros**: Real-time feedback.
- **Cons**: High bandwidth, no cryptographic proof of the stream itself.

## Option B: The "Black Box" Proof (Batch)
The Node records telemetry for the duration of the command. Upon completion, it hashes the raw data into the `executionProof`.
- **Example**: `SHA256(Command + Final_State + Peak_Torque)`.
- **Pros**: Trustless. The user can verify the hash against the raw data if exported.

## Option C: Oracle Validation
A third-party "Inspector Agent" (e.g., a camera) observes the task and signs a "Witness Proof" that the movement actually occurred.
- **Pros**: External verification. 
- **Cons**: Requires additional hardware.

## Selected Method for Kinetic v1
**Combined Hash Proof**: The response from `/api/execute` will now include a `telemetry` object containing:
- `peak_torque`: Measured in Nm.
- `heat_signature`: CPU/Motor temperature in Celsius.
- `battery_drain`: Delta change in supply.
- `physics_latency`: Time between intent and atoms moving.
