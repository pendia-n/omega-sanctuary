# orega Deployment Architecture

This document outlines the deployment strategy and hosting environments for the various components of the orega Robotics-as-a-Service (RaaS) platform.

## 1. Core Backend (`/src`)
The backend is a high-performance Hono-based server running on Node.js.

- **Technology Stack**: Node.js, Hono, SQLite (`orega.db`).
- **Build Process**: `npm run build` (compiles TypeScript to `dist/`).
- **Deployment**: 
    - **Environment**: Typically hosted on a Linux VPS or cloud instance (e.g., AWS EC2, DigitalOcean Droplet, GCP Compute Engine).
    - **Process Manager**: Managed via `pm2` or a systemd service to ensure high availability and automatic restarts.
    - **Port**: Default production port is **4400**.
- **Data Persistence**: Uses a local `orega.db` file. For horizontal scaling, this would transition to a managed PostgreSQL cluster.

## 2. Sanctuary Terminal UI (`/ui`)
The frontend is a modern React application managed by Vite.

- **Technology Stack**: React, Vite, Lucide icons.
- **Build Process**: `npm run build` (inside the `ui/` directory) generates highly optimized static assets in `ui/dist`.
- **Hosting**:
    - **Option A (Static Hosting)**: Deployed to Vercel, Netlify, or AWS S3 + CloudFront for global edge delivery.
    - **Option B (Bundled)**: Served directly by the Hono backend as static files for a unified single-origin deployment.
- **Connection**: Communicates with the backend at `http://localhost:4400` (development) or a production API domain via environment variables.

## 3. Physical Access SDK (`/sdk`)
The SDK provides a cryptographic bridge for external agents to interact with K-Spec primitives.

- **Technology Stack**: Vanilla JavaScript (ESM).
- **Inclusion**:
    - **NPM**: Can be published as `@orega/sdk` for Node.js or browser-based developer tools.
    - **Static CDN**: Served as a standalone JS file for rapid integration into third-party dashboards.
- **Purpose**: Handles identity restoration, API key management, and command sequencing for external software integrations.

---

> [!IMPORTANT]
> **Production Note**: In a production environment, ensure all traffic is served over **HTTPS** (Port 443) using an Nginx or Caddy reverse proxy to handle SSL termination.
