# CrudeOptic — Database Schema (Supabase)

## Overview

Supabase (free tier: 500MB storage) is used for slow-changing data that doesn't need a live API call on every request. The database is seeded once (or updated via cron) and serves as a fast, queryable store.

**Not stored in Supabase:**
- Live prices (Vercel KV cache)
- Production/trade data (EIA/Comtrade API, Vercel KV cache)
- News/alerts (Vercel KV cache)

---

## Tables

### `consumption_by_type`

Stores annual oil consumption per country broken down by product type (petrol, diesel, etc.).

**Source:** Energy Institute Statistical Review (Excel, annual)
**Seeded via:** `scripts/seed-consumption.ts`
**Updated:** Annually (each June after new release)

```sql
CREATE TABLE consumption_by_type (
  id           SERIAL PRIMARY KEY,
  iso          CHAR(2) NOT NULL,           -- ISO 3166-1 alpha-2
  country_name VARCHAR(100) NOT NULL,
  year         INT NOT NULL,
  product_type VARCHAR(50) NOT NULL,       -- 'Gasoline', 'Diesel', 'Jet Fuel', 'Fuel Oil', 'LPG', 'Other'
  value_mtoe   NUMERIC(10, 3),             -- Million tonnes of oil equivalent
  value_kbblday NUMERIC(10, 1),            -- Thousand barrels/day (derived)
  source       VARCHAR(50) DEFAULT 'Energy Institute',
  created_at   TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(iso, year, product_type)
);

CREATE INDEX idx_consumption_iso ON consumption_by_type(iso);
CREATE INDEX idx_consumption_year ON consumption_by_type(year);
```

**Sample data:**
```
iso  | country_name   | year | product_type | value_mtoe
-----+----------------+------+--------------+-----------
SA   | Saudi Arabia   | 2023 | Gasoline     | 49.0
SA   | Saudi Arabia   | 2023 | Diesel       | 73.5
SA   | Saudi Arabia   | 2023 | Jet Fuel     | 26.25
SA   | Saudi Arabia   | 2023 | Fuel Oil     | 15.75
SA   | Saudi Arabia   | 2023 | LPG          | 7.0
SA   | Saudi Arabia   | 2023 | Other        | 3.5
```

---

### `pump_prices`

Weekly retail fuel prices per country (gasoline + diesel).

**Source:** GlobalPetrolPrices.com (scraped weekly) + World Bank API (annual fallback)
**Updated via:** Vercel Cron job `/api/cron/refresh-pump-prices` every Monday

```sql
CREATE TABLE pump_prices (
  id              SERIAL PRIMARY KEY,
  iso             CHAR(2) NOT NULL,            -- ISO 3166-1 alpha-2
  country_name    VARCHAR(100) NOT NULL,
  gasoline_usd    NUMERIC(6, 3),               -- USD per liter
  diesel_usd      NUMERIC(6, 3),               -- USD per liter
  source          VARCHAR(100) NOT NULL,        -- 'GlobalPetrolPrices' or 'World Bank'
  source_label    VARCHAR(100),                 -- Display label: 'Weekly estimate', 'Annual average'
  data_date       DATE NOT NULL,                -- Date of the price reading
  scraped_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(iso, data_date, source)
);

CREATE INDEX idx_pump_prices_iso ON pump_prices(iso);
CREATE INDEX idx_pump_prices_date ON pump_prices(data_date DESC);
```

**Query pattern (get latest price per country):**
```sql
SELECT DISTINCT ON (iso)
  iso, country_name, gasoline_usd, diesel_usd, source, source_label, data_date
FROM pump_prices
ORDER BY iso, data_date DESC;
```

---

### `refinery_capacity`

Refinery capacity and throughput by country (annual).

**Source:** KAPSARC Data Portal + EIA Refinery Capacity Report
**Seeded via:** `scripts/seed-refinery.ts`
**Updated:** Annually

```sql
CREATE TABLE refinery_capacity (
  id              SERIAL PRIMARY KEY,
  iso             CHAR(2) NOT NULL,
  country_name    VARCHAR(100) NOT NULL,
  year            INT NOT NULL,
  capacity_bblday INT,                         -- Distillation capacity, bbl/day
  throughput_bblday INT,                       -- Actual throughput, bbl/day
  utilization_pct NUMERIC(5, 2),               -- Calculated: throughput / capacity * 100
  refinery_count  INT,                         -- Number of refineries
  source          VARCHAR(50),
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(iso, year)
);

CREATE INDEX idx_refinery_iso ON refinery_capacity(iso);
```

---

### `geopolitics`

Per-country geopolitical context: sanctions, embargoes, OPEC membership, trade restrictions.

**Source:** Curated from OFAC, EU sanctions list, UN SC sanctions, OPEC MOMR
**Seeded via:** `scripts/seed-geopolitics.ts` (reads `data/geopolitics.json`)
**Updated:** Quarterly (manual review + re-seed)

```sql
CREATE TABLE geopolitics (
  id                SERIAL PRIMARY KEY,
  iso               CHAR(2) NOT NULL UNIQUE,
  country_name      VARCHAR(100) NOT NULL,
  sanctions         JSONB NOT NULL DEFAULT '[]',
  -- Array of: { body: string, type: string, since: string, notes: string }

  embargoes         TEXT[] NOT NULL DEFAULT '{}',
  -- ISO codes of countries that embargo this country

  is_opec_member    BOOLEAN NOT NULL DEFAULT FALSE,
  opec_quota_bblday INT,                        -- Current OPEC production quota, bbl/day
  trade_restrictions TEXT[] NOT NULL DEFAULT '{}',
  -- e.g. ['No USD transactions', 'SWIFT exclusion']

  notes             TEXT,
  last_updated      DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_geopolitics_iso ON geopolitics(iso);
CREATE INDEX idx_geopolitics_opec ON geopolitics(is_opec_member) WHERE is_opec_member = TRUE;
```

**Query: Get all sanctioned countries**
```sql
SELECT iso, country_name, sanctions
FROM geopolitics
WHERE jsonb_array_length(sanctions) > 0;
```

---

### `opec_production_history`

Historical OPEC member production data (supplementary to EIA for official OPEC figures).

**Source:** OPEC Annual Statistical Bulletin
**Seeded via:** `scripts/seed-opec.ts`

```sql
CREATE TABLE opec_production_history (
  id              SERIAL PRIMARY KEY,
  iso             CHAR(2) NOT NULL,
  country_name    VARCHAR(100) NOT NULL,
  year            INT NOT NULL,
  crude_kbblday   NUMERIC(10, 1),              -- Crude oil production, kb/day
  ngl_kbblday     NUMERIC(10, 1),              -- Natural gas liquids, kb/day
  total_kbblday   NUMERIC(10, 1),              -- Total liquids, kb/day
  exports_kbblday NUMERIC(10, 1),
  source          VARCHAR(50) DEFAULT 'OPEC ASB',
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(iso, year)
);
```

---

## Row Level Security (RLS)

All tables are **read-only for anonymous users** (public dashboard, no user accounts).

```sql
-- Enable RLS
ALTER TABLE consumption_by_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE pump_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE refinery_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE geopolitics ENABLE ROW LEVEL SECURITY;
ALTER TABLE opec_production_history ENABLE ROW LEVEL SECURITY;

-- Allow anyone to SELECT
CREATE POLICY "public_read_consumption" ON consumption_by_type
  FOR SELECT TO anon USING (true);

CREATE POLICY "public_read_pump_prices" ON pump_prices
  FOR SELECT TO anon USING (true);

CREATE POLICY "public_read_refinery" ON refinery_capacity
  FOR SELECT TO anon USING (true);

CREATE POLICY "public_read_geopolitics" ON geopolitics
  FOR SELECT TO anon USING (true);

CREATE POLICY "public_read_opec" ON opec_production_history
  FOR SELECT TO anon USING (true);
```

---

## Storage Estimate

| Table | Rows | Avg Row Size | Total |
|-------|------|-------------|-------|
| `consumption_by_type` | 80 countries × 6 types × 5 years = 2,400 | ~200 bytes | ~480 KB |
| `pump_prices` | 150 countries × 52 weeks = 7,800 | ~150 bytes | ~1.2 MB |
| `refinery_capacity` | 100 countries × 5 years = 500 | ~150 bytes | ~75 KB |
| `geopolitics` | 200 countries | ~2 KB | ~400 KB |
| `opec_production_history` | 13 × 30 years = 390 | ~200 bytes | ~78 KB |
| **Total** | | | **~2.2 MB** |

Well within Supabase free tier (500 MB).

---

## Seed Scripts

### `scripts/seed-consumption.ts`

```typescript
// 1. Download Energy Institute Excel from energyinst.org
// 2. Parse with 'xlsx' npm package
// 3. Extract: iso, year, product_type, value_mtoe
// 4. Upsert to consumption_by_type

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function seed() {
  const wb = XLSX.readFile('./data/energy-institute-2025.xlsx');
  // ... parse each product type sheet
  // ... map country names to ISO codes using lib/countries.ts
  // ... upsert rows
}
```

### `scripts/seed-geopolitics.ts`

```typescript
// 1. Read data/geopolitics.json
// 2. Upsert each entry to geopolitics table

import geopoliticsData from '../data/geopolitics.json';

async function seed() {
  for (const [iso, entry] of Object.entries(geopoliticsData)) {
    await supabase.from('geopolitics').upsert({ iso, ...entry });
  }
}
```

---

## Supabase Client Usage (in Next.js)

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Server-side (API routes, server components)
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Client-side (CSR components) — anon key, read-only
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```
