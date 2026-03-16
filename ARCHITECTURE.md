# CrudeOptic — Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  USER BROWSER                                                     │
│  Next.js 14 App (React, TypeScript, Tailwind CSS)                │
│  ├─ / (Landing)                                                   │
│  ├─ /explore (World Map)                                         │
│  └─ /country/[iso] (Country Detail)                              │
└─────────────────────────┬────────────────────────────────────────┘
                          │ HTTP / RSC
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│  NEXT.JS API ROUTES (Vercel Serverless Functions)                 │
│  ├─ GET /api/overview                                            │
│  ├─ GET /api/prices                                              │
│  ├─ GET /api/country/[iso]                                       │
│  ├─ GET /api/trade/[iso]                                         │
│  └─ GET /api/news                                                │
└──────────────────┬───────────────────────────────────────────────┘
                   │ Cache-aside (check KV → if miss → fetch → store)
                   ↓
┌──────────────────────────────────────────────────────────────────┐
│  VERCEL KV (Upstash Redis)  — API Response Cache                 │
│  TTL: 15 min (prices) / 30 min (news) / 12-24 hr (data)         │
└──────────────────┬───────────────────────────────────────────────┘
                   │ On cache miss
                   ↓
┌──────────────────────────────────────────────────────────────────┐
│  EXTERNAL DATA SOURCES                                           │
│  ├─ EIA API          → Production, imports, exports, SPR        │
│  ├─ UN Comtrade API  → Bilateral trade flows                     │
│  ├─ FRED API         → Historical WTI/Brent price series        │
│  ├─ Oil Price API    → Live WTI/Brent commodity prices          │
│  ├─ GDELT GEO 2.0   → Geo-tagged news events (every 15 min)    │
│  └─ RSS Feeds        → OilPrice.com, Reuters Energy, OPEC, EIA  │
└──────────────────────────────────────────────────────────────────┘
                   +
┌──────────────────────────────────────────────────────────────────┐
│  SUPABASE (PostgreSQL)  — Seeded / Slow-changing Data           │
│  ├─ consumption_by_type  (Energy Institute annual, seeded)      │
│  ├─ refinery_capacity    (KAPSARC/EIA annual, seeded)           │
│  ├─ pump_prices          (GlobalPetrolPrices.com, weekly cron)  │
│  └─ geopolitics          (OFAC/EU/UN curated, quarterly)        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Patterns

### Pattern 1: Live API Data (Prices, Production, Trade)
```
Request → API Route → Check Vercel KV cache
  → HIT:  Return cached JSON (fast, no external call)
  → MISS: Fetch from EIA/FRED/Comtrade → Store in KV → Return
```

### Pattern 2: Seeded Static Data (Consumption, Refinery, Geopolitics)
```
Request → API Route → Query Supabase
  → Returns pre-seeded annual data instantly (no external API call)
  → Supabase is updated once per year via seed script
```

### Pattern 3: News Feed (Real-time + Near Real-time)
```
Every 30 min (Vercel Cron):
  → Fetch RSS from OilPrice.com, Reuters Energy, OPEC, EIA
  → Parse with rss-parser
  → Run keyword matching against country/chokepoint dictionary
  → Store top 20 articles + affected country ISO codes in KV

Every 15 min (client-side polling or ISR):
  → GDELT GEO 2.0 query for oil keywords
  → Extract location mentions
  → Map to ISO country codes
  → Store event alerts in KV
```

### Pattern 4: Retail Pump Prices (Weekly Cron)
```
Every Monday 06:00 UTC (Vercel Cron):
  → Scrape GlobalPetrolPrices.com HTML table
  → Parse country, petrol_usd, diesel_usd columns
  → Upsert to Supabase pump_prices table
  → Invalidate any KV cache entries for pump prices
```

---

## Caching Strategy

| Data Type | Cache Layer | TTL | Reason |
|-----------|-------------|-----|--------|
| Live WTI/Brent prices | Vercel KV | 15 min | Oil Price API: 100 req/month free |
| Historical price series | Vercel KV | 24 hours | FRED updates daily |
| Country production stats | Vercel KV | 24 hours | EIA: monthly updates |
| Import/export flows | Vercel KV | 12 hours | Comtrade: 500 req/day limit |
| SPR / reserves | Vercel KV | 12 hours | EIA: weekly updates |
| News headlines (RSS) | Vercel KV | 30 min | RSS refresh rate |
| GDELT events | Vercel KV | 15 min | GDELT: 15-min cadence |
| Consumption by type | Supabase | Annual | Energy Institute: annual |
| Refinery capacity | Supabase | Annual | KAPSARC: annual |
| Pump prices | Supabase | Weekly | GlobalPetrolPrices: weekly |
| Geopolitics/sanctions | Supabase | Quarterly | Manual curation |

**Cache key naming convention:** `crudeoptic:{resource}:{param}` e.g. `crudeoptic:country:SA`, `crudeoptic:prices:wti`

---

## File Structure

```
CrudeOptic/                       ← Spec docs (this folder)
crudeoptic/                         ← App source code
├─ app/
│   ├─ layout.tsx                 # Root layout: navbar, price ticker, footer
│   ├─ page.tsx                   # Landing page
│   ├─ explore/
│   │   └─ page.tsx               # World map explore page
│   ├─ country/
│   │   └─ [iso]/
│   │       └─ page.tsx           # Country detail page (SSR + ISR)
│   └─ api/
│       ├─ overview/route.ts      # GET /api/overview
│       ├─ prices/route.ts        # GET /api/prices
│       ├─ country/
│       │   └─ [iso]/route.ts     # GET /api/country/[iso]
│       ├─ trade/
│       │   └─ [iso]/route.ts     # GET /api/trade/[iso]
│       └─ news/route.ts          # GET /api/news
│
├─ components/
│   ├─ layout/
│   │   ├─ Navbar.tsx             # Top navigation + search
│   │   ├─ PriceTicker.tsx        # Live WTI/Brent price banner
│   │   └─ Footer.tsx
│   ├─ landing/
│   │   ├─ GlobeHero.tsx          # react-globe.gl 3D hero
│   │   ├─ TopProducersChart.tsx  # Recharts bar chart
│   │   ├─ TopConsumersChart.tsx  # Recharts bar chart
│   │   ├─ NewsFeeed.tsx          # RSS headlines list
│   │   └─ AlertsBanner.tsx       # GDELT alerts + affected countries
│   ├─ explore/
│   │   ├─ WorldMap.tsx           # React Simple Maps choropleth
│   │   ├─ MapControls.tsx        # Toggle: Production/Consumption/Sanctions/etc.
│   │   ├─ ChokepointOverlay.tsx  # SVG lines for straits + canals
│   │   └─ MapTooltip.tsx         # Hover tooltip
│   └─ country/
│       ├─ CountryHeader.tsx      # Flag, name, rank badges, geopolitical banner
│       ├─ KeyStatsBar.tsx        # Production, Consumption, Net, Reserves
│       ├─ ImportSankey.tsx       # D3-Sankey: import sources
│       ├─ ExportSankey.tsx       # D3-Sankey: export destinations
│       ├─ ConsumptionDonut.tsx   # Donut: product type breakdown
│       ├─ ProductionChart.tsx    # Line: 5-year production trend
│       ├─ PriceChart.tsx         # Line: WTI/Brent + pump price history
│       ├─ ReservesGauge.tsx      # Days of supply gauge
│       ├─ RefineryChart.tsx      # Bar: capacity vs throughput
│       ├─ TradeBalance.tsx       # Area: net import/export over time
│       └─ GeopoliticsPanel.tsx   # Sanctions, embargoes, OPEC quota, notes
│
├─ lib/
│   ├─ eia.ts                     # EIA API client (fetch + typed responses)
│   ├─ comtrade.ts                # UN Comtrade API client
│   ├─ fred.ts                    # FRED API client
│   ├─ oilprice.ts                # Oil Price API client
│   ├─ gdelt.ts                   # GDELT GEO 2.0 API client
│   ├─ rss.ts                     # RSS feed aggregator (rss-parser)
│   ├─ news-geo.ts                # Keyword → ISO country mapper
│   ├─ pump-prices.ts             # GlobalPetrolPrices.com scraper
│   ├─ worldbank.ts               # World Bank API client (pump price fallback)
│   ├─ supabase.ts                # Supabase client (server-side)
│   ├─ cache.ts                   # Vercel KV get/set helpers with TTL
│   └─ countries.ts               # ISO codes, names, flags, coordinates
│
├─ data/
│   ├─ geopolitics.json           # Per-country: sanctions[], embargoes[], opecQuota, notes
│   └─ chokepoints.json           # Chokepoint → affected producers + importers
│
├─ scripts/
│   ├─ seed-consumption.ts        # One-time: parse Energy Institute Excel → Supabase
│   ├─ seed-refinery.ts           # One-time: parse KAPSARC data → Supabase
│   └─ seed-geopolitics.ts        # One-time: parse OFAC/EU/UN → geopolitics.json
│
├─ types/
│   └─ oil.ts                     # All TypeScript interfaces/types
│
├─ vercel.json                    # Cron job config
└─ .env.local                     # API keys (EIA, FRED, Supabase, Oil Price API)
```

---

## Environment Variables

```env
# EIA
EIA_API_KEY=

# FRED
FRED_API_KEY=

# Oil Price API
OIL_PRICE_API_KEY=

# UN Comtrade (optional — some endpoints are keyless)
COMTRADE_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vercel KV (auto-injected by Vercel when KV store is linked)
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

---

## Vercel Cron Jobs

Defined in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-news",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/cron/refresh-gdelt",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/refresh-pump-prices",
      "schedule": "0 6 * * 1"
    }
  ]
}
```

> Note: Vercel Hobby allows 2 cron jobs max. Consolidate `refresh-news` and `refresh-gdelt` into one `/api/cron/refresh-intelligence` route if needed.

---

## Rendering Strategy

| Page | Strategy | Reason |
|------|----------|--------|
| `/` (Landing) | ISR (revalidate: 3600) | Top producers/consumers change rarely; news reloaded client-side |
| `/explore` | Client-side (CSR) | Map is fully interactive, no SEO needed |
| `/country/[iso]` | ISR (revalidate: 3600) | Good for SEO; data updates hourly at most |
| `/api/*` | Serverless Functions | Always fresh, cache managed manually via KV |

---

## Rate Limit Budget

| API | Daily Limit | Expected Usage | Buffer |
|-----|-------------|----------------|--------|
| EIA | Unlimited | ~100 calls/day | ✓ |
| UN Comtrade | 500/day | ~50/day (12h cache) | ✓ |
| Oil Price API | 100/month (~3/day) | 96/day with 15min cache | ✓ |
| FRED | Unlimited | ~20/day | ✓ |
| GDELT | Unlimited | ~96/day (15min) | ✓ |
| World Bank | Unlimited | ~10/day | ✓ |
