-- CrudeOptic — Supabase Schema
-- Run this in Supabase SQL Editor to set up all tables

-- ============================================================
-- LIVE PRICES (WTI / Brent) — written every 15 min by ETL
-- ============================================================
CREATE TABLE IF NOT EXISTS live_prices (
  benchmark TEXT PRIMARY KEY,  -- 'WTI' or 'BRENT'
  price NUMERIC NOT NULL,
  change NUMERIC DEFAULT 0,
  change_percent NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRICE HISTORY — daily WTI/Brent from FRED
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
  date DATE NOT NULL,
  benchmark TEXT NOT NULL,
  price NUMERIC NOT NULL,
  PRIMARY KEY (date, benchmark)
);

CREATE INDEX idx_price_history_benchmark ON price_history(benchmark, date DESC);

-- ============================================================
-- COUNTRY PRODUCTION — from EIA
-- ============================================================
CREATE TABLE IF NOT EXISTS country_production (
  iso TEXT NOT NULL,
  year INTEGER NOT NULL,
  production_bpd BIGINT NOT NULL,
  source TEXT DEFAULT 'EIA',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (iso, year)
);

CREATE INDEX idx_production_iso ON country_production(iso, year DESC);

-- ============================================================
-- RESERVES — proven oil reserves from EIA
-- ============================================================
CREATE TABLE IF NOT EXISTS reserves (
  iso TEXT NOT NULL,
  year INTEGER NOT NULL,
  proven_reserves_bbl NUMERIC NOT NULL,
  source TEXT DEFAULT 'EIA',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (iso, year)
);

-- ============================================================
-- TRADE FLOWS — bilateral from UN Comtrade
-- ============================================================
CREATE TABLE IF NOT EXISTS trade_flows (
  source_iso TEXT NOT NULL,
  target_iso TEXT NOT NULL,
  volume_bpd BIGINT DEFAULT 0,
  value_usd NUMERIC DEFAULT 0,
  year INTEGER NOT NULL,
  hs_code TEXT DEFAULT '2709',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (source_iso, target_iso, year, hs_code)
);

CREATE INDEX idx_trade_target ON trade_flows(target_iso, year);
CREATE INDEX idx_trade_source ON trade_flows(source_iso, year);

-- ============================================================
-- CONSUMPTION BY TYPE — seeded annually from Energy Institute
-- ============================================================
CREATE TABLE IF NOT EXISTS consumption_by_type (
  iso TEXT NOT NULL,
  year INTEGER NOT NULL,
  petrol NUMERIC DEFAULT 0,
  diesel NUMERIC DEFAULT 0,
  kerosene NUMERIC DEFAULT 0,
  jet_fuel NUMERIC DEFAULT 0,
  lpg NUMERIC DEFAULT 0,
  fuel_oil NUMERIC DEFAULT 0,
  other NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'thousand_bpd',
  PRIMARY KEY (iso, year)
);

-- ============================================================
-- PUMP PRICES — weekly scrape + World Bank fallback
-- ============================================================
CREATE TABLE IF NOT EXISTS pump_prices (
  iso TEXT PRIMARY KEY,
  petrol_usd_per_liter NUMERIC,
  diesel_usd_per_liter NUMERIC,
  source TEXT DEFAULT 'scrape',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REFINERY CAPACITY — seeded annually
-- ============================================================
CREATE TABLE IF NOT EXISTS refinery_capacity (
  iso TEXT NOT NULL,
  capacity_bpd BIGINT NOT NULL,
  throughput_bpd BIGINT,
  utilization_pct NUMERIC,
  year INTEGER NOT NULL,
  PRIMARY KEY (iso, year)
);

-- ============================================================
-- NEWS HEADLINES — from GDELT + RSS
-- ============================================================
CREATE TABLE IF NOT EXISTS news_headlines (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  countries TEXT[] DEFAULT '{}',
  sentiment TEXT DEFAULT 'neutral',
  summary TEXT
);

CREATE INDEX idx_news_published ON news_headlines(published_at DESC);

-- ============================================================
-- NEWS ALERTS — geo-tagged high-severity events
-- ============================================================
CREATE TABLE IF NOT EXISTS news_alerts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  countries TEXT[] DEFAULT '{}',
  chokepoint_id TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  source_url TEXT
);

CREATE INDEX idx_alerts_severity ON news_alerts(severity, published_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY — public read-only
-- ============================================================
ALTER TABLE live_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserves ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_by_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE pump_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE refinery_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_headlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_alerts ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads on all tables
CREATE POLICY "Public read" ON live_prices FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON price_history FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON country_production FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON reserves FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON trade_flows FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON consumption_by_type FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON pump_prices FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON refinery_capacity FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON news_headlines FOR SELECT TO anon USING (true);
CREATE POLICY "Public read" ON news_alerts FOR SELECT TO anon USING (true);
