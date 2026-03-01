# Kinetic RaaS Launch Instructions

The codebase is verified to be fully compliant with `readiness_check.md` requirements (e.g. 24h refill, Ghost Timer, Rate Limiting, Admin privileges, Database structure).

## Launching the Application

The backend and frontend are designed to run concurrently.

### 1. Developer Mode
Launch both the API and the UI using NPM:

**Terminal 1 (Backend API):**
```bash
npm run dev
```
*(Runs on port 4400)*

**Terminal 2 (Frontend UI):**
```bash
npm run ui
```
*(Runs on port 5173)*

> **Note:** These are currently already running in your terminal! You can view the app immediately at [http://localhost:5173](http://localhost:5173).

### 2. Production Build
If you wish to deploy or run the production build:
```bash
# Build the backend
npm run build

# Start the generated JS server
npm start
```
And similarly for the UI folder, run `npm run build` inside `ui/` to generate static assets.
