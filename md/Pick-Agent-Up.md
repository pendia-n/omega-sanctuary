# Kinetic RaaS — Robot-as-a-Service API

Status: In Development

## What It Is

A **Robot-as-a-Service API** for managing telemetry, proof verification, and payments for autonomous robots. Uses MQTT for real-time telemetry streaming, zkSNARKs for zero-knowledge proof verification, and Lemon Squeezy for payment processing.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Hono |
| **Database** | SQLite |
| **Comm** | MQTT (real-time telemetry) |
| **Crypto** | zkSNARKs (zero-knowledge proofs) |
| **Payments** | Lemon Squeezy |

## Key Features

- MQTT telemetry ingestion from robots
- zkSNARK proof verification (verify robot actions without revealing data)
- Lemon Squeezy payment processing
- Robot fleet management
- Real-time dashboard

## Notes

Unusual stack — combines robotics telemetry (MQTT), blockchain-style cryptography (zkSNARKs), and a payment processor more common in SaaS (Lemon Squeezy). Built with Elysia on Bun runtime.
