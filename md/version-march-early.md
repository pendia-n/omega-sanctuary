# orega Update: Early March 2026

## Executive Summary
This update introduces the **Model Context Protocol (MCP)** layer to the orega ecosystem, transitioning the project from a standard API to an "agent-ready" infrastructure. We have also initialized the foundation for integrated commercialization via **Stripe**.

## Major Changes

### 1. orega MCP Server (`/mcp/server.ts`)
We have introduced a dedicated MCP server that acts as a bridge between the orega Kernel and AI clients (like Claude Desktop, Cursor, or IDE plugins).

**Why this change?**
- **Standardization:** It allows any MCP-compatible agent to discover and use orega's robotic primitives (`K-MOVE`, `K-LIFT`, etc.) without custom glue code.
- **Improved DX:** Developers can now interact with orega agents using natural language through their preferred AI assistants.
- **Direct Execution:** Tools like `orega_execute` allow agents to generate and run K-Spec sequences autonomously.

### 2. Dependency Infrastructure
- **`@modelcontextprotocol/sdk`**: Added to support the new server implementation and stdio transport.
- **`stripe`**: Installed to begin integration of the "Payment Gateway" mentioned in previous architectural discussions. This will eventually handle credit top-ups for the ephemereal identities created by `orega_ignite`.

## Tooling Overview
The new MCP server exposes four primary tools:
1.  **`orega_ignite`**: Requests a new ephemeral identity.
2.  **`orega_claim`**: Activates the identity to prevent timeout.
3.  **`orega_execute`**: Runs K-Spec commands on Atlas, Hermes, or Apollo agents.
4.  **`orega_credits`**: Monitors balance in real-time.

## Architecture Vision
By decoupling the **Kernel** (core logic) from the **MCP Wrapper**, we ensure that orega remains a "headless" robotics service that can be invoked via REST, CLI, or Agentic protocols simultaneously.
