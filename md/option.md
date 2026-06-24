K-Spec Protocol: Core Primitives (v1.0.0)
These primitives represent the "Will to Power" in the physical realm. Every complex action—from building a rocket to mixing a vaccine—is a composition of these five atoms.

1. K-MOVE (Spatial Translation)
Defines the movement of an end-effector or a mobile platform through 3D space.
Parameters:
- target: [x, y, z] coordinates (relative or absolute).
- velocity: Speed of movement (0.0 to 1.0).
- precision: Tolerance threshold in millimeters.
Logic: Moves the physical asset to a specific point. If the precision threshold cannot be met due to physical obstruction, it triggers a K-BLOCK interrupt.

2. K-GRIP (Tactile Engagement)
Commands a physical interface to engage with an object.
Parameters:
- pressure: Newton-meters of force.
- aperture: Width of the opening (for grippers/valves).
- material_profile: (Optional) Preset for "Soft," "Rigid," or "Fragile" objects.
Logic: Engages the actuator. It uses haptic feedback to verify the "Grip" is secure before proceeding to the next command.

3. K-SENSE (Environmental Verification)
Requests a cryptographic snapshot of the physical environment.
Parameters:
- sensor_type: [Visual, Thermal, Ultrasonic, Chemical].
- resolution: Data density required.
Logic: This is the "Eyes" of the protocol. It returns a data packet that is hashed and signed by the hardware to prove the state of reality at a specific timestamp.

4. K-WAIT (Temporal Synchronization)
Synchronizes digital intent with physical processes (like chemical reactions or cooling).
Parameters:
- duration: Time in milliseconds.
- condition: (Optional) A sensor threshold to meet before "waking up" (e.g., temp < 30C).
Logic: Pauses execution. This prevents the "Will" from outrunning the "Physics."

5. K-VERIFY (Cryptographic Proof of Action)
The most critical primitive. It generates a Zero-Knowledge Proof that the previous sequence was executed correctly.
Parameters:
- sequence_id: The ID of the block to verify.
Logic: Compares the K-SENSE data against the intended K-MOVE or K-GRIP commands. It outputs a "Success" token that is recorded on the Ledger.
