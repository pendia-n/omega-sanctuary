# orega RaaS: Production Launch Guide

This guide covers how to deploy the orega Headless RaaS platform to a production environment where real users can access it.

Because orega uses **SQLite** (`better-sqlite3`), the backend requires access to a persistent disk. "Serverless" platforms like Vercel Functions or AWS Lambda are not suitable for the backend. 

Here is the recommended production architecture:
1. **Frontend (UI)**: Vercel, Netlify, or Cloudflare Pages (Free, fast, edge-cached).
2. **Backend (API + SQLite)**: A Virtual Private Server (VPS like DigitalOcean/AWS) **OR** a PaaS with persistent storage (like Railway or Render).

---

## 🚀 Option 1: The Easy Way (Railway for Backend + Vercel for Frontend)

This is the fastest pathway to get a public URL for people to use.

### Step 1: Deploy the Backend to Railway
Railway provides persistent volumes that work perfectly with SQLite.

1. Create an account on [Railway.app](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your `orega` repository.
4. Go to the service settings in Railway:
   - **Root Directory**: Leave as `/` (default).
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. **Add Persistent Storage**:
   - Go to the **Volumes** tab.
   - Add a volume mounted at `/app/orega.db`. (This prevents your database from wiping when Railway redeploys).
6. **Expose your server**:
   - Go to **Settings** -> **Networking** -> **Generate Domain**. (You will get something like `orega-production.up.railway.app`).

### Step 2: Deploy the Frontend to Vercel
Vercel is the easiest way to host your Vite/React UI.

1. Go to [Vercel.com](https://vercel.com/) and click **Add New Project**.
2. Select your `orega` repository.
3. In the Vercel configuration:
   - **Framework Preset**: Vite
   - **Root Directory**: `ui` (Important! Tell Vercel to only build the UI folder)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - Add `VITE_API_URL` and set it to your Railway Backend URL (e.g., `https://orega-production.up.railway.app`).
   *(Note: You will need to make sure the frontend UI code references this env variable for its API calls instead of hardcoded localhost)*
5. Click **Deploy**. Vercel gives you a live public URL!

### Step 3: Link Them Together (CORS)
Go back to your Railway Backend and add an Environment Variable:
- Key: `PRODUCTION_UI_URL`
- Value: `https://your-vercel-frontend-domain.vercel.app`

This allows the backend's CORS policy to accept requests from your new public UI.

---

## 💻 Option 2: The Self-Hosted Way (VPS / DigitalOcean Droplet / AWS EC2)

If you want total control, run both on a single Linux server instance.

1. **Spin up a Server**: Get a $5 Ubuntu droplet on DigitalOcean.
2. **SSH into the server**: `ssh root@your_ip_address`
3. **Install Node & Git**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs git
   ```
4. **Clone the repo**:
   ```bash
   git clone https://github.com/your-username/orega.git
   cd orega
   ```
5. **Install & Build Backend**:
   ```bash
   npm install
   npm run build
   ```
6. **Run Backend with PM2 (Process Manager)**:
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name "orega-kernel"
   pm2 save
   pm2 startup
   ```
7. **Install & Build Frontend**:
   ```bash
   cd ui
   npm install
   npm run build
   ```
8. **Serve the API and UI using Nginx (Reverse Proxy)**:
   - Install Nginx: `sudo apt-get install nginx`
   - Configure Nginx to serve the `ui/dist` folder on port 80/443.
   - Configure Nginx to proxy API requests (`/api/*`) to `localhost:4400` where PM2 is running your backend.
   - Use `certbot` to secure it with incredibly easy free SSL.

---

## 🔒 Post-Launch Admin Requirements

1. **Change the Admin Password:**
   As soon as your production server is live, the database will be seeded with the default password. Immediately log into your admin dashboard and change the password.

2. **Run a test:**
   Generate a key in production, execute a command (`K-MOVE`) via cURL to your production domain, and ensure a valid proof is returned.
