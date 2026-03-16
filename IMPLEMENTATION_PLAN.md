# CrudeOptic — Implementation Plan

## Prerequisites (Before Writing Any Code)

### API Keys to Register
- [ ] **EIA API Key** — Register at https://www.eia.gov/opendata/register.php (instant, free)
- [ ] **FRED API Key** — Register at https://fred.stlouisfed.org/docs/api/api_key.html (instant, free)
- [ ] **Oil Price API Key** — Register at https://oilpriceapi.com (free tier, 100 req/month)
- [ ] **UN Comtrade Key** — Register at https://comtradedeveloper.un.org (free, 500 calls/day)
- [ ] **Supabase Project** — Create at https://supabase.com (free tier)
- [ ] **Vercel Account** — Create at https://vercel.com (free Hobby plan)
- [ ] **GitHub Repo** — Create `crudeoptic` repo and connect to Vercel

### One-Time Data Downloads
- [ ] Download Energy Institute Statistical Review Excel (energyinst.org/statistical-review)
- [ ] Download OPEC ASB data (asb.opec.org)
- [ ] Download KAPSARC refinery capacity dataset

---

## Phase 1 — Project Setup + Core Infrastructure

**Goal:** Working Next.js app deployed on Vercel, connected to Supabase, with basic API clients.

### Tasks

- [ ] Initialize Next.js 14 app
  ```bash
  npx create-next-app@latest crudeoptic --typescript --tailwind --app --src-dir=no
  ```
- [ ] Install dependencies:
  ```bash
  npm install @supabase/supabase-js @vercel/kv rss-parser cheerio d3-sankey
  npm install react-simple-maps recharts react-globe.gl lucide-react framer-motion
  npm install @types/d3-sankey @types/cheerio xlsx
  ```
- [ ] Set up environment variables (`.env.local`)
- [ ] Configure Tailwind with custom colors (amber, orange, dark backgrounds)
- [ ] Create `lib/cache.ts` — Vercel KV get/set helpers with typed TTL
- [ ] Create `lib/countries.ts` — ISO alpha-2 ↔ name ↔ numeric ↔ flag emoji mapping
- [ ] Create `lib/eia.ts` — EIA API client with typed fetch methods
- [ ] Create `lib/fred.ts` — FRED API client
- [ ] Create `lib/oilprice.ts` — Oil Price API client
- [ ] Set up Supabase project + run schema SQL (from DATABASE_SCHEMA.md)
- [ ] Run seed scripts: `seed-consumption.ts`, `seed-refinery.ts`, `seed-geopolitics.ts`
- [ ] Implement `GET /api/overview` with EIA data + KV cache
- [ ] Implement `GET /api/prices` with Oil Price API + FRED fallback + KV cache
- [ ] Create basic layout: `Navbar`, `PriceTicker` (static data first), `Footer`
- [ ] Build basic landing page (no globe, just stats cards + bar charts)
- [ ] Deploy to Vercel — confirm build passes

**Milestone:** Live URL with overview stats, price ticker, top producers/consumers

---

## Phase 2 — World Map (Explore Page)

**Goal:** Interactive choropleth map with all toggle modes.

### Tasks

- [ ] Implement `GET /api/map` for all modes (production, consumption, imports, exports, reserves)
- [ ] Create `lib/comtrade.ts` — UN Comtrade API client
- [ ] Build `WorldMap` component (React Simple Maps, choropleth)
  - D3 `scaleSequential` color scale per mode
  - Hover tooltip with country name + metric
  - Click → navigate to `/country/[iso]`
- [ ] Build `MapControls` — toggle button group
- [ ] Build `/explore` page layout
- [ ] Implement Sanctions mode (read from Supabase geopolitics table)
- [ ] Add `ChokepointOverlay` — static SVG lines from `data/chokepoints.json`
- [ ] Add legend component below map
- [ ] Mobile: map scrollable, simplified tooltips

**Milestone:** Fully interactive map, all toggle modes working, Strait of Hormuz and other chokepoints visible

---

## Phase 3 — Country Detail Pages

**Goal:** Full per-country data page.

### Tasks

- [ ] Implement `GET /api/country/[iso]` (aggregates EIA + Supabase)
- [ ] Implement `GET /api/trade/[iso]` (Comtrade bilateral flows)
- [ ] Build `CountryHeader` — flag, name, rank badges, OPEC/sanctions badge
- [ ] Build `KeyStatsBar` — 5 metric cards
- [ ] Build `ImportSankey` + `ExportSankey` (D3-Sankey)
  - Nodes: partner countries
  - Links scaled to trade volume
  - Hover tooltip with volume + share %
- [ ] Build `ConsumptionDonut` (Recharts PieChart)
- [ ] Build `ProductionChart` (Recharts LineChart, 5-year)
- [ ] Build `PriceChart` (Recharts LineChart, WTI + Brent, period selector)
- [ ] Build `ReservesGauge` (RadialBarChart or custom SVG arc)
- [ ] Build `RefineryChart` (Recharts BarChart — capacity vs throughput)
- [ ] Build `GeopoliticsPanel` — sanctions list + OPEC info + notes
- [ ] Add pump price display row (from Supabase pump_prices — initially null/TBD)
- [ ] Generate static paths for top 50 countries (ISR)
- [ ] Add SEO metadata (title, description per country)
- [ ] Add "Related countries" section (top trading partners)

**Milestone:** All major country pages working with full data display

---

## Phase 4 — News Intelligence + Geopolitical Alerts

**Goal:** Real-time news feed + geopolitical event detection on map.

### Tasks

- [ ] Create `data/geopolitics.json` — curate entries for ~50 key countries
  - Source: OFAC SDN list, EU sanctions, UN SC resolutions, OPEC MOMR
  - Focus on: Iran, Russia, Venezuela, Libya, Sudan, Myanmar, Belarus, Cuba
- [ ] Create `data/chokepoints.json` — 4 chokepoints with affected countries
- [ ] Create `lib/gdelt.ts` — GDELT GEO 2.0 API client
  ```typescript
  // Query multiple oil keyword sets
  // Parse location mentions → ISO country codes
  // Merge into alert objects with severity scoring
  ```
- [ ] Create `lib/rss.ts` — RSS aggregator using rss-parser
- [ ] Create `lib/news-geo.ts` — keyword → ISO mapping dictionary (100+ entries)
- [ ] Implement `GET /api/news` endpoint
- [ ] Create cron endpoint `POST /api/cron/refresh-intelligence`
- [ ] Configure `vercel.json` with cron schedules
- [ ] Build `NewsFeed` component — headlines list with source badges + country flag chips
- [ ] Build `AlertsBanner` component
  - Hidden when no alerts
  - Expandable list showing all affected countries
  - Links to chokepoint info
- [ ] Add "News Events" mode to `WorldMap` (highlight countries from GDELT)
- [ ] Add pulsing animation to map countries with active alerts
- [ ] Wire `AlertsBanner` into landing page and explore page

**Milestone:** Breaking oil news displayed, Strait of Hormuz example triggers alert with country highlights

---

## Phase 5 — Retail Prices + Globe Hero + Polish

**Goal:** Pump prices, visual polish, mobile pass.

### Tasks

- [ ] Create `lib/pump-prices.ts` — Cheerio scraper for GlobalPetrolPrices.com
- [ ] Create `scripts/test-scrape.ts` to validate scraper manually
- [ ] Create cron endpoint `POST /api/cron/refresh-pump-prices`
- [ ] Add cron to `vercel.json` (check Vercel Hobby 2-cron limit — consolidate if needed)
- [ ] Display pump prices in country detail `PriceChart` section
- [ ] Add World Bank API fallback (`lib/worldbank.ts`) for uncovered countries
- [ ] Build `GlobeHero` component (react-globe.gl)
  - Replace landing page placeholder with 3D globe
  - Add producer dots (amber, scaled to production)
  - Add major trade route arcs (top 20 routes from Comtrade data)
  - Auto-rotate, stop on hover, click → country
- [ ] Live `PriceTicker` — client-side polling `/api/prices` every 15 min
- [ ] Full mobile responsive pass:
  - GlobeHero: disabled on mobile, replaced with flat map thumbnail
  - Sankey charts: replaced with ranked table on mobile
  - Charts: reduce height on mobile
- [ ] Add loading skeleton animations (Tailwind `animate-pulse`)
- [ ] Add error boundary components
- [ ] Lighthouse performance audit → optimize (image lazy load, bundle splitting)
- [ ] Final SEO pass — meta tags, Open Graph, sitemap.xml

**Milestone:** Production-ready app, all features working, mobile responsive

---

## Phase 6 — Final Testing & Launch

### Testing Checklist

**Data Accuracy**
- [ ] Cross-check Saudi Arabia production (EIA) vs OPEC Monthly Oil Market Report
- [ ] Cross-check China imports (Comtrade) vs known figures (~11M bbl/day)
- [ ] Verify geopolitics.json: Iran sanctions correct, Russia sanctions current
- [ ] Verify pump prices scraper output for 5 known countries (US, Germany, Norway, Saudi Arabia, India)

**API / Caching**
- [ ] Verify Vercel KV cache keys set/get correctly for each endpoint
- [ ] Simulate cache miss → API call → cache fill flow
- [ ] Verify cron job triggers (check Vercel dashboard logs)

**UI / UX**
- [ ] All 195 country ISO codes resolve to country page without 404
- [ ] Top 50 ISR pages pre-generated at build time
- [ ] Map toggle modes all work with correct color scales
- [ ] Sankey charts: confirm import + export flows directional logic correct
- [ ] Chokepoint overlay visible on explore map

**News Intelligence**
- [ ] Test GDELT query for "Strait of Hormuz" → verify Iran, UAE highlighted
- [ ] Test RSS feeds — confirm articles parse correctly
- [ ] Test news-geo.ts keyword matching for 10 country names

**Mobile (375px)**
- [ ] Landing page readable, globe replaced by static image
- [ ] Explore map usable on touch
- [ ] Country page all sections visible, no overflow

**Performance**
- [ ] Landing page LCP < 2.5s (desktop)
- [ ] Country page LCP < 3s (desktop)
- [ ] API responses all < 200ms (from cache)

---

## Dependencies List

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@vercel/kv": "^1.0.0",
    "react-simple-maps": "^3.0.0",
    "recharts": "^2.10.0",
    "react-globe.gl": "^2.26.0",
    "d3-sankey": "^0.12.3",
    "d3-scale": "^4.0.0",
    "d3-scale-chromatic": "^3.0.0",
    "rss-parser": "^3.13.0",
    "cheerio": "^1.0.0",
    "xlsx": "^0.18.5",
    "lucide-react": "^0.300.0",
    "framer-motion": "^10.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/d3-sankey": "^0.12.3",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  }
}
```

---

## Environment Variables Checklist

```
# Required for Phase 1
EIA_API_KEY=
FRED_API_KEY=
OIL_PRICE_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auto-injected by Vercel when KV store linked
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Required for Phase 2
COMTRADE_API_KEY=                # optional, some Comtrade endpoints keyless
```

---

## Vercel Configuration (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-intelligence",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/cron/refresh-pump-prices",
      "schedule": "0 6 * * 1"
    }
  ]
}
```

> **Note:** Vercel Hobby tier allows max 2 cron jobs. This config uses both slots. GDELT (15-min cadence) and RSS (30-min cadence) are consolidated into one `refresh-intelligence` endpoint.

---

## Estimated Build Time

| Phase | Effort | Key Output |
|-------|--------|------------|
| Phase 1 | 3-4 days | Working app deployed, data pipeline, landing page |
| Phase 2 | 2-3 days | Interactive world map |
| Phase 3 | 3-4 days | Country detail pages with all charts |
| Phase 4 | 2-3 days | News intelligence + alerts |
| Phase 5 | 2-3 days | Pump prices, 3D globe, polish |
| Phase 6 | 1-2 days | Testing + launch |
| **Total** | **~2-3 weeks** | Production-ready app |
