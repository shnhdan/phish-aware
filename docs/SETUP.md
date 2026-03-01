# PhishAware — Setup Guide

## Prerequisites (all free)

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.11+ | https://python.org |
| Git | any | https://git-scm.com |
| Chrome | any | https://chrome.google.com |

## Free Accounts You Need

1. **Supabase** — https://supabase.com (free tier, no credit card)
2. **Vercel** — https://vercel.com (free tier)
3. **Railway** — https://railway.app (free tier)
4. **Upstash Redis** — https://upstash.com (free tier)
5. **VirusTotal** — https://virustotal.com (free API, 4 req/min)

---

## Step 1 — Supabase Setup

1. Create a new project at supabase.com
2. Go to **SQL Editor**
3. Paste and run `database/schema.sql`
4. Go to **Settings → API** → copy your URL and anon key
5. Enable **Realtime** on the `scan_logs` table

---

## Step 2 — Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp ../.env.example .env        # fill in your keys

uvicorn main:app --reload --port 8000
```

Visit http://localhost:8000/docs to see the auto-generated API docs.

---

## Step 3 — Frontend (Next.js)

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your-supabase-url" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key" >> .env.local

npm run dev
```

Visit http://localhost:3000

---

## Step 4 — Airflow Pipeline

```bash
cd pipeline

pip install -r requirements.txt

# Initialize Airflow
export AIRFLOW_HOME=~/airflow
airflow db init
airflow users create --username admin --password admin \
  --firstname Admin --lastname User --role Admin --email admin@example.com

# Copy DAGs
cp dags/* ~/airflow/dags/

# Start Airflow (two terminals)
airflow webserver --port 8080
airflow scheduler
```

Visit http://localhost:8080 (admin/admin)
Enable the DAGs: `domain_enrichment` and `feature_engineering`

---

## Step 5 — Chrome Extension

1. Open Chrome → go to `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load Unpacked**
4. Select the `extension/` folder
5. Open Gmail — you'll see the PhishAware shield icon in your toolbar

---

## Step 6 — Deploy (Optional for Hackathon Demo)

### Frontend → Vercel
```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Backend → Railway
1. Push to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Select your repo → set root to `backend/`
4. Add environment variables from `.env.example`

---

## Testing the Full Pipeline

1. Open Gmail with the extension installed
2. Open any suspicious-looking email
3. The badge should appear within 2-3 seconds
4. Check the dashboard at localhost:3000 for the live feed
5. Check Airflow at localhost:8080 to see the DAG run triggered

---

## Architecture Diagram

```
Gmail
  ↓ (Chrome Extension intercepts)
FastAPI /api/scan
  ↓ (background task)
Redis Queue (Upstash)
  ↓
Airflow DAGs:
  extract → [whois | virustotal | dns] → score → load
  ↓
Supabase PostgreSQL
  ↓ (real-time subscription)
Next.js Dashboard
```
