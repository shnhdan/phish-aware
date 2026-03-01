-- PhishAware Database Schema
-- Run this in your Supabase SQL editor

-- ============================================
-- SCAN LOGS: every email scan result
-- ============================================
CREATE TABLE scan_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Email metadata (anonymized)
  email_hash TEXT NOT NULL,           -- SHA256 of email body (privacy-first)
  sender_domain TEXT NOT NULL,
  sender_display_name TEXT,
  subject_snippet TEXT,               -- first 60 chars only
  
  -- Pipeline stage tracking
  ingested_at TIMESTAMPTZ,
  enriched_at TIMESTAMPTZ,
  scored_at TIMESTAMPTZ,
  
  -- Risk scoring output
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  risk_label TEXT CHECK (risk_label IN ('SAFE', 'SUSPICIOUS', 'DANGEROUS')),
  
  -- Feature breakdown (what drove the score)
  domain_age_days INTEGER,
  domain_age_score INTEGER,
  link_count INTEGER,
  malicious_link_count INTEGER,
  link_score INTEGER,
  urgent_keyword_count INTEGER,
  urgent_keywords TEXT[],
  nlp_score INTEGER,
  spf_pass BOOLEAN,
  dkim_pass BOOLEAN,
  auth_score INTEGER
);

-- Index for fast dashboard queries
CREATE INDEX idx_scan_logs_created_at ON scan_logs(created_at DESC);
CREATE INDEX idx_scan_logs_risk_label ON scan_logs(risk_label);
CREATE INDEX idx_scan_logs_sender_domain ON scan_logs(sender_domain);

-- ============================================
-- DOMAIN REPUTATION: cached enrichment results
-- ============================================
CREATE TABLE domain_reputation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  
  -- WHOIS data
  registration_date DATE,
  age_days INTEGER,
  registrar TEXT,
  country TEXT,
  
  -- VirusTotal data
  vt_malicious_count INTEGER DEFAULT 0,
  vt_suspicious_count INTEGER DEFAULT 0,
  vt_clean_count INTEGER DEFAULT 0,
  vt_last_analysis TIMESTAMPTZ,
  
  -- DNS checks
  has_spf BOOLEAN DEFAULT FALSE,
  has_dmarc BOOLEAN DEFAULT FALSE,
  
  -- Computed reputation score (0=bad, 100=good)
  reputation_score INTEGER,
  
  -- Cache TTL: re-check after 24 hours
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_domain_reputation_domain ON domain_reputation(domain);
CREATE INDEX idx_domain_reputation_expires ON domain_reputation(expires_at);

-- ============================================
-- KEYWORD STATS: NLP feature tracking
-- ============================================
CREATE TABLE keyword_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  category TEXT CHECK (category IN ('urgency', 'threat', 'reward', 'impersonation')),
  occurrence_count INTEGER DEFAULT 0,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  avg_risk_score FLOAT
);

CREATE UNIQUE INDEX idx_keyword_stats_keyword ON keyword_stats(keyword);

-- ============================================
-- PIPELINE RUNS: Airflow DAG audit trail
-- ============================================
CREATE TABLE pipeline_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dag_name TEXT NOT NULL,
  run_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('running', 'success', 'failed')),
  records_processed INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT
);

-- ============================================
-- REAL-TIME: enable Supabase realtime on scan_logs
-- ============================================
ALTER TABLE scan_logs REPLICA IDENTITY FULL;

-- ============================================
-- SEED DATA: sample rows for demo
-- ============================================
INSERT INTO domain_reputation (domain, age_days, reputation_score, has_spf, has_dmarc, vt_malicious_count) VALUES
  ('google.com', 9500, 99, TRUE, TRUE, 0),
  ('paypal.com', 9200, 98, TRUE, TRUE, 0),
  ('amaz0n-secure.xyz', 3, 2, FALSE, FALSE, 47),
  ('verify-bankofamerica.net', 12, 5, FALSE, FALSE, 31),
  ('srmist.edu.in', 4200, 95, TRUE, TRUE, 0);

INSERT INTO keyword_stats (keyword, category, occurrence_count, avg_risk_score) VALUES
  ('verify your account', 'urgency', 234, 78),
  ('account suspended', 'threat', 189, 82),
  ('click here immediately', 'urgency', 156, 71),
  ('you have won', 'reward', 98, 65),
  ('confirm your identity', 'urgency', 203, 75),
  ('unusual sign-in activity', 'threat', 142, 69),
  ('limited time offer', 'reward', 87, 55),
  ('dear customer', 'impersonation', 312, 61);
