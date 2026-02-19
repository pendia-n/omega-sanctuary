# Kinetic RaaS: Q&A

### Q1: Is Agent Atlas a real agentic product?
**Answer**: In the context of this RaaS implementation, **Agent Atlas** is a virtualized agent profile representing a "Logistics/Heavy Lifting" robotic class. While the hardware is simulated in this code, the **API Protocol (K-Spec)** is a real-world specification designed to interface with physical robots. Atlas serves as a functional blueprint for how an AI Agent would command a physical arm or mobile platform.

### Q2: Where is my "Teach User" to use different Agent APIs? I only saw the default ones for Atlas and Hermes.
**Answer**: The current UI uses Atlas and Hermes as **Implementation Examples**. To expand this:
- **Headless Principle**: Users are taught that the `agentId` field in the `/api/execute` request is an arbitrary string. 
- **Universal Interface**: Any robotic developer can register a custom ID. The "teaching" is done via the **API Playground** where the JSON structure remains constant regardless of the agent. To use a different agent, the user simply changes the `"agentId"` key in their `curl` or SDK call.

### Q3: How can a user or agent use the returned JSON for robotic development?
**Answer**: The JSON acts as the **Physical Feedback Loop**:
- **Decision Making**: An AI Agent parses the `results` array. If `K-MOVE` returns `OBSTACLE_DETECTED`, the agent's logic triggers a "Re-route" command.
- **Verification**: The `proofHash` is used as a cryptographic receipt. In high-stakes environments (e.g., automated pharma or sensitive logistics), this SHA-256 hash is stored to prove a physical action actually happened at a specific timestamp.
- **Telemetry**: Robotic devs use the `data` field (e.g., `battery_drain`, `final_pos`) to track hardware health and state without needing to write low-level driver code.

### Q4: Why is there no credit field showing user's API credit? (Logic: 170 initial, 60 daily refill, pay for more).
**Answer**: The current MVP v1 focused on the **Ghost Protocol** (Auth and Execution). The credit logic requires the following refinement to meet your spec:
- **Initial State**: New API keys should be initialized with **170 credits**.
- **Refill Logic**: A cron-job or middleware check should add **60 credits** if a 24-hour window has passed since the last refill.
- **Visibility**: The credit balance should be exposed via a `GET /api/user/credits` endpoint and displayed in the UI header. 
- *Note*: My previous execution used a simplified 10.00 credit model; this should be updated in `src/db/queries.ts` to match your 170/60/Pay model.

### Q5: What is the incentive for a user/agent to use this RaaS API? What is the JSON for?
**Answer**: The incentive is **Hardware Agnosticism**.
- **The Problem**: Controlling a Boston Dynamics Spot vs. a Tesla Optimus vs. a DIY Kuka arm requires different codebases.
- **The RaaS Solution**: You provide a **Universal Language for Atoms**. An AI Agent doesn't need to know how to move a motor; it just sends `K-MOVE`.
- **The JSON**: This is the "API for Reality." It bridges the gap between digital thoughts (AGI) and physical actions (Robots). By standardizing the feedback, you enable a "Blue Ocean" where software developers can build robotic apps without ever touching a soldering iron.
