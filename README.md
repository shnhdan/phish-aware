# 🎣 PhishAware — Privacy-First Email Threat Intelligence Platform

> A real-time phishing detection system with a full data engineering pipeline, built for TechHacks 2.0 – Hack4Hope (SDG 16)

---

## 🏗️ Architecture Overview

```
Gmail Inbox
     │
     ▼
Chrome Extension (Manifest V3)
     │  intercepts emails, extracts metadata
     ▼
FastAPI Backend  ──────────────────────────────────────────────┐
     │                                                          │
     ▼                                                          │
Redis Queue (Upstash)                                          │
     │                                                          │
     ▼                                                          │
Apache Airflow DAGs                                            │
  ├── DAG 1: Email Ingestion                                   │
  ├── DAG 2: Domain Enrichment (WHOIS + VirusTotal + DNS)      │
  ├── DAG 3: Feature Engineering (NLP + Link Analysis)         │
  ├── DAG 4: Risk Score Computation                            │
  └── DAG 5: Dashboard Data Refresh                           │
     │                                                          │
     ▼                                                          │
Supabase (PostgreSQL)                                          │
  ├── scan_logs table                                           │
  ├── domain_reputation table                                  │
  └── keyword_stats table                                      │
     │                                                          │
     ▼                                                          │
Next.js 14 Dashboard  ◄────────────────────────────────────────┘
  ├── Live Risk Feed
  ├── Threat Trend Charts (Recharts)
  ├── Domain Reputation Lookup
  └── Apache Superset Embed
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **UI** | Next.js 14 (App Router) | SSR, API routes, professional |
| **Styling** | Tailwind CSS + shadcn/ui | Fast, polished components |
| **Charts** | Recharts | Live data visualizations |
| **Backend** | FastAPI (Python) | Async, fast, auto-docs |
| **Pipeline** | Apache Airflow | DAG orchestration |
| **Database** | Supabase (PostgreSQL) | Free, real-time subscriptions |
| **Queue** | Redis via Upstash | Async job queue |
| **Extension** | Chrome MV3 | Gmail UI integration |
| **Dashboards** | Apache Superset | Advanced analytics |
| **Deploy FE** | Vercel | Free, instant |
| **Deploy BE** | Railway | Free tier |

---

## 📁 Folder Structure

```
phish-aware/
├── frontend/           # Next.js 14 dashboard
│   ├── app/
│   │   ├── page.tsx              # Main dashboard
│   │   ├── scan/page.tsx         # Manual scan page
│   │   ├── history/page.tsx      # Scan history
│   │   └── api/                  # Next.js API routes
│   ├── components/
│   │   ├── RiskScoreCard.tsx
│   │   ├── ThreatFeed.tsx
│   │   ├── DomainLookup.tsx
│   │   └── TrendChart.tsx
│   └── package.json
│
├── backend/            # FastAPI
│   ├── main.py                   # Entry point
│   ├── routers/
│   │   ├── scan.py               # POST /scan endpoint
│   │   ├── history.py            # GET /history endpoint
│   │   └── domain.py             # GET /domain/{domain} endpoint
│   ├── services/
│   │   ├── risk_scorer.py        # Core scoring logic
│   │   ├── whois_service.py      # Domain age lookup
│   │   ├── virustotal_service.py # Link reputation
│   │   └── nlp_service.py        # Urgent language detection
│   ├── models/
│   │   └── schemas.py            # Pydantic models
│   └── requirements.txt
│
├── pipeline/           # Apache Airflow DAGs
│   ├── dags/
│   │   ├── email_ingestion_dag.py
│   │   ├── domain_enrichment_dag.py
│   │   ├── feature_engineering_dag.py
│   │   ├── risk_scoring_dag.py
│   │   └── dashboard_refresh_dag.py
│   └── requirements.txt
│
├── extension/          # Chrome Extension
│   ├── manifest.json
│   ├── content.js                # Injects risk badge into Gmail
│   ├── background.js             # Service worker
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.js
│   └── icons/
│
├── database/           # Supabase
│   ├── schema.sql                # All table definitions
│   ├── seed.sql                  # Sample data for demo
│   └── migrations/
│
└── docs/
    ├── ARCHITECTURE.md
    ├── SETUP.md
    └── DEMO.md
```

---

## 🚀 Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/YOUR_USERNAME/phish-aware.git
cd phish-aware
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
uvicorn main:app --reload
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

### 4. Airflow Pipeline
```bash
cd pipeline
pip install apache-airflow
airflow db init
airflow webserver & airflow scheduler
```

### 5. Chrome Extension
- Open `chrome://extensions`
- Enable Developer Mode
- Click "Load Unpacked" → select `extension/` folder

---

## 🌍 SDG Alignment

**SDG 16 — Peace, Justice and Strong Institutions**
PhishAware protects individuals and institutions from digital fraud, phishing attacks, and social engineering — directly contributing to safer digital infrastructure and reduced cybercrime.

---

## 🏆 Hackathon
Built for **TechHacks 2.0 – Hack4Hope** at SRM Institute of Science and Technology
Deadline: March 9, 2026
