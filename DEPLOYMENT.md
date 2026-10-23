# Cloud Deployment Guide (Scale-to-Zero / $0 Idle Stack)

This project is configured for a secure, serverless production deployment across:
1. **Database:** **TiDB Cloud Serverless** (MySQL-compatible, TLS 1.2/1.3 encrypted, $0/mo spending cap)
2. **Backend (`server/`):** **Google Cloud Run** + **Google Secret Manager** (Dockerized Express API, scales to zero when idle)
3. **Frontends (`client/` & `admin/`):** **Cloudflare Pages** (Global CDN, DDoS protection, automatic branch previews)
4. **Object Storage:** **Cloudflare R2** (Already integrated in `server/services/storageService.js`)

---

## Step 1: Set Up the Serverless MySQL Database (TiDB Cloud)

1. Go to [tidbcloud.com](https://tidbcloud.com/) and create a free account.
2. Click **Create Cluster** $\rightarrow$ choose **Serverless** ($0/month) $\rightarrow$ pick a region close to your users (e.g., `aws-eu-west-1` or `aws-us-east-1`). **Remember this region** so you can pick the same region in Google Cloud Run!
3. Once created, go to cluster **Settings / Spending Limit** and set the monthly spending limit to **$0.00** (prevents unexpected charges).
4. Click **Connect** in the top right:
   * Select **Connect with: Node.js / Sequelize** (or General).
   * Click **Generate Password** and copy the credentials:
     * `DB_HOST` (e.g. `gateway01.eu-west-1.prod.aws.tidbcloud.com`)
     * `DB_PORT` (`4000`)
     * `DB_USERNAME` (e.g. `xxxx.root`)
     * `DB_PASSWORD` (the generated password)
     * `DB_DATABASE` (`test` by default, or create a database named `provi_prints` in the TiDB SQL Editor via `CREATE DATABASE provi_prints;`).

---

## Step 2: Deploy the Express Backend to Google Cloud Run

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and create a new Project (e.g., `provi-prints`).
2. **Store Sensitive Secrets in Secret Manager:**
   * Search for **Secret Manager** in the top bar and enable the API.
   * Create the following secrets (up to 6 active secret versions are free):
     * `JWT_SECRET`: A 64-byte random hex string (`node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
     * `DB_PASSWORD`: Your TiDB password
     * `R2_SECRET_ACCESS_KEY`: Your Cloudflare R2 secret key
3. **Create the Cloud Run Service:**
   * Search for **Cloud Run** $\rightarrow$ click **Deploy Container** $\rightarrow$ **Continuously deploy from a repository (source or function)**.
   * Connect your GitHub account and select your `provi-prints` repository.
   * In **Build Configuration**:
     * **Branch:** `^main$` (or `^feat/cloud-deployment$` to test this branch first)
     * **Build Type:** `Dockerfile`
     * **Source location:** `/server/Dockerfile` (Cloud Build will automatically use `/server` as the build context)
   * In **Service Settings**:
     * **Region:** Pick the same geographic region as your TiDB database (e.g., `europe-west1` or `us-east1`).
     * **Authentication:** Select **Allow unauthenticated invocations** (since this is your public API; Express handles JWT/cookie auth).
     * **Auto-scaling:** Set **Minimum instances = `0`** (so it costs $0 when idle) and **Maximum instances = `2`** (protects against Denial-of-Wallet traffic spikes).
   * In **Container(s), Volumes, Networking, Security** $\rightarrow$ **Variables & Secrets**:
     * Add Regular Environment Variables:
       * `NODE_ENV` = `production`
       * `DB_HOST` = `<your_tidb_host>`
       * `DB_PORT` = `4000`
       * `DB_USERNAME` = `<your_tidb_username>`
       * `DB_DATABASE` = `provi_prints`
       * `DB_SSL` = `true`
       * `R2_ACCOUNT_ID` = `<your_r2_account_id>`
       * `R2_ACCESS_KEY_ID` = `<your_r2_access_key_id>`
       * `R2_PRIVATE_BUCKET_NAME` = `design-masters-private`
       * `R2_PUBLIC_BUCKET_NAME` = `design-previews-public`
       * `R2_PUBLIC_DOMAIN` = `<your_r2_public_domain>`
       * `CORS_ORIGINS` = `https://<your-client>.pages.dev,https://<your-admin>.pages.dev`
     * Click **Reference a secret** to mount your 3 secrets from Secret Manager as environment variables:
       * `JWT_SECRET`
       * `DB_PASSWORD`
       * `R2_SECRET_ACCESS_KEY`
       *(Note: If it asks to grant the Compute Engine default service account the `Secret Manager Secret Accessor` role, click **Grant**).*
4. Click **Create**. Once deployed, Cloud Run will give you a live HTTPS URL like `https://provi-prints-api-xxxxxx.run.app`.
   * Test it by visiting `https://provi-prints-api-xxxxxx.run.app/health` — it should return `{"status":"ok"}`.

---

## Step 3: Deploy `client` and `admin` to Cloudflare Pages

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/) $\rightarrow$ **Compute (Workers & Pages)** $\rightarrow$ **Create** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
2. **Deploy the Storefront (`client`):**
   * Select your `provi-prints` GitHub repository.
   * **Project name:** `provi-prints`
   * **Framework preset:** `Vite`
   * **Root directory:** `client`
   * **Build command:** `npm run build`
   * **Build output directory:** `dist`
   * **Environment variables:**
     * `VITE_API_URL` = `https://provi-prints-api-xxxxxx.run.app` (no trailing slash)
   * Click **Save and Deploy**.
3. **Deploy the Admin Portal (`admin`):**
   * Repeat the same steps for a second Pages project:
   * **Project name:** `provi-prints-admin`
   * **Root directory:** `admin`
   * **Build command:** `npm run build`
   * **Build output directory:** `dist`
   * **Environment variables:**
     * `VITE_API_URL` = `https://provi-prints-api-xxxxxx.run.app` (no trailing slash)
4. **Update `CORS_ORIGINS` in Cloud Run:**
   * Copy your two new `.pages.dev` URLs (e.g., `https://provi-prints.pages.dev,https://provi-prints-admin.pages.dev`) into the `CORS_ORIGINS` environment variable in Google Cloud Run.
