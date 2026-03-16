# CrudeOptic — Global Oil Intelligence Dashboard

## Overview

CrudeOptic is a geopolitical oil-tracking web application that provides comprehensive, per-country oil intelligence in real time. Built in the context of an increasingly volatile global energy landscape, it visualizes oil imports, exports, production, consumption, reserves, pricing, and geopolitical risk for every major country — all in one place.

## Goals

- **Track all oil flows globally** — who buys from whom, at what volume
- **Show consumption breakdown** by product type (petrol, diesel, kerosene, jet fuel, LPG, fuel oil)
- **Surface geopolitical risk** — sanctions, embargoes, OPEC quotas, chokepoint disruptions
- **Monitor oil news in real time** — with automatic country/region tagging on the map
- **Show live + weekly benchmark prices** (WTI/Brent) and indicative retail pump prices
- **Provide strategic reserve data** — days of supply per country

## Key Differentiator

The geopolitical intelligence layer: when an event like "Strait of Hormuz blockade" is detected in global news, the app automatically highlights all affected producer and importer countries on the map, quantifies the supply impact, and links to relevant country detail pages.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS v3 |
| World Map | React Simple Maps (choropleth) |
| Charts | Recharts (line, bar, pie/donut) |
| Trade Flows | D3-Sankey |
| 3D Globe | React-Globe.gl (landing hero) |
| Icons | Lucide React |
| News/Events | GDELT GEO 2.0 API + RSS (rss-parser) |
| Caching | Vercel KV (Upstash Redis) |
| Database | Supabase (PostgreSQL, free tier) |
| Deployment | Vercel Hobby (free) |

**Total infrastructure cost: $0/month** (all free tiers)

---

## Application Structure

```
/ (Landing)          → Globe hero, live prices, top producers/consumers, news feed, alerts
/explore             → Interactive choropleth world map with toggles + chokepoint overlays
/country/[iso]       → Full country detail: imports, exports, production, consumption, reserves, prices, geopolitics
```

---

## Documentation Index

| File | Description |
|------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, data flow, caching strategy, file structure |
| [DATA_SOURCES.md](./DATA_SOURCES.md) | All data sources: APIs, scraping, free downloads, rate limits |
| [PAGES_AND_COMPONENTS.md](./PAGES_AND_COMPONENTS.md) | Per-page UI specification and component breakdown |
| [API_SPEC.md](./API_SPEC.md) | Next.js API route specs: endpoints, request/response shapes |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Supabase table schemas and seed data strategy |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Phase-by-phase build plan with task checklists |

---

## Data Coverage Summary

| Data Type | Source | Freshness | Countries |
|-----------|--------|-----------|-----------|
| Production | EIA API | Monthly | ~180 |
| Imports/Exports (bilateral) | UN Comtrade + EIA | Monthly | 200+ |
| Consumption by product type | Energy Institute (seeded) | Annual | 80+ |
| Strategic reserves (days) | EIA + IEA | Weekly/Monthly | ~50 |
| WTI/Brent prices | Oil Price API + FRED | Live / Daily | Global |
| Retail pump prices | GlobalPetrolPrices.com (scrape) | Weekly | ~150 |
| Oil news headlines | OilPrice.com + Reuters RSS | Real-time | Global |
| Geo-tagged news events | GDELT GEO 2.0 | Every 15 min | Global |
| Sanctions / Embargoes | OFAC + EU + UN (curated) | Quarterly update | ~30+ |
| OPEC quotas | OPEC ASB (curated) | Annual | 13 OPEC members |
| Refinery capacity | KAPSARC + EIA (seeded) | Annual | 100+ |

---

## Design Principles

- **Dark theme** — charcoal/black backgrounds with amber (#F59E0B) and orange (#F97316) accents
- **Data-dense but scannable** — card grid layout, clear hierarchy
- **Map-first** — the world map is the primary navigation mechanism
- **Transparency on data quality** — every metric labeled with its source and freshness
- **Public, read-only** — no user accounts required
