# CrudeOptic — API Specification

All endpoints are Next.js API Routes (serverless functions on Vercel).
Base path: `/api/`
All responses: `Content-Type: application/json`
All errors: `{ error: string, code: number }`

---

## GET `/api/overview`

Returns global summary data for the landing page.

### Query Parameters
None

### Response
```json
{
  "updatedAt": "2026-03-15T10:00:00Z",
  "worldProduction": 102800000,
  "worldConsumption": 101200000,
  "wtiPrice": 74.52,
  "brentPrice": 78.14,
  "wtiChange": 0.34,
  "brentChange": 0.41,
  "topProducers": [
    { "iso": "US", "name": "United States", "production": 12900000, "rank": 1 },
    { "iso": "SA", "name": "Saudi Arabia", "production": 9000000, "rank": 2 },
    { "iso": "RU", "name": "Russia", "production": 8900000, "rank": 3 }
  ],
  "topConsumers": [
    { "iso": "US", "name": "United States", "consumption": 20300000, "rank": 1 },
    { "iso": "CN", "name": "China", "consumption": 16400000, "rank": 2 },
    { "iso": "IN", "name": "India", "consumption": 5700000, "rank": 3 }
  ],
  "topImporters": [
    { "iso": "CN", "name": "China", "imports": 11400000, "rank": 1 },
    { "iso": "US", "name": "United States", "imports": 8900000, "rank": 2 }
  ],
  "topExporters": [
    { "iso": "SA", "name": "Saudi Arabia", "exports": 7200000, "rank": 1 },
    { "iso": "RU", "name": "Russia", "exports": 5800000, "rank": 2 }
  ]
}
```

### Data Source
- `topProducers` / `topConsumers`: EIA API
- `wtiPrice` / `brentPrice`: Oil Price API (cached 15 min)
- `topImporters` / `topExporters`: UN Comtrade + EIA (cached 12 hr)

### Cache
- Key: `crudeoptic:overview`
- TTL: 1 hour (production/consumption are monthly data; price updates separately)

---

## GET `/api/prices`

Returns current and historical WTI/Brent prices.

### Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | `1M` \| `3M` \| `1Y` \| `5Y` | `1Y` | Historical range |

### Response
```json
{
  "live": {
    "wti": 74.52,
    "brent": 78.14,
    "wtiChange": 0.34,
    "brentChange": 0.41,
    "wtiChangePct": 0.46,
    "brentChangePct": 0.53,
    "updatedAt": "2026-03-15T09:45:00Z"
  },
  "history": {
    "wti": [
      { "date": "2026-03-14", "value": 74.18 },
      { "date": "2026-03-13", "value": 73.95 }
    ],
    "brent": [
      { "date": "2026-03-14", "value": 77.73 },
      { "date": "2026-03-13", "value": 77.42 }
    ]
  }
}
```

### Data Source
- `live`: Oil Price API (or FRED daily close as fallback)
- `history`: FRED API (DCOILWTICO, DCOILBRENTEU)

### Cache
- `crudeoptic:prices:live` — TTL: 15 min
- `crudeoptic:prices:history:{period}` — TTL: 24 hours

---

## GET `/api/country/[iso]`

Full country oil profile.

### Path Parameters
| Param | Type | Description |
|-------|------|-------------|
| `iso` | `string` | ISO 3166-1 alpha-2 code (e.g., `SA`, `CN`, `US`) |

### Response
```json
{
  "iso": "SA",
  "name": "Saudi Arabia",
  "flag": "🇸🇦",
  "ranks": {
    "production": 2,
    "consumption": 14,
    "exports": 1,
    "imports": null
  },
  "keyStats": {
    "productionBblDay": 9000000,
    "consumptionBblDay": 3100000,
    "netExportBblDay": 5900000,
    "provedReservesBB": 259.0,
    "reservesDaysOfSupply": 90,
    "refinerCapacityBblDay": 3800000
  },
  "productionTrend": [
    { "year": 2020, "value": 8500000 },
    { "year": 2021, "value": 8800000 },
    { "year": 2022, "value": 9100000 },
    { "year": 2023, "value": 9200000 },
    { "year": 2024, "value": 9000000 }
  ],
  "consumption": {
    "total_mtoe": 175,
    "breakdown": [
      { "type": "Diesel", "mtoe": 73.5, "pct": 42 },
      { "type": "Gasoline", "mtoe": 49.0, "pct": 28 },
      { "type": "Jet Fuel", "mtoe": 26.25, "pct": 15 },
      { "type": "Fuel Oil", "mtoe": 15.75, "pct": 9 },
      { "type": "LPG", "mtoe": 7.0, "pct": 4 },
      { "type": "Other", "mtoe": 3.5, "pct": 2 }
    ]
  },
  "pumpPrices": {
    "gasoline_usd_per_liter": 0.52,
    "diesel_usd_per_liter": 0.48,
    "source": "GlobalPetrolPrices.com",
    "label": "Weekly estimate",
    "updatedAt": "2026-03-10"
  },
  "reserves": {
    "spr_mb": null,
    "industryStocks_mb": null,
    "provedReservesBB": 259.0,
    "reservesDaysOfSupply": 90,
    "trend": [
      { "period": "2024-01", "value": 88 },
      { "period": "2024-04", "value": 91 }
    ]
  },
  "refinery": {
    "capacityBblDay": 3800000,
    "throughputBblDay": 3100000,
    "utilizationPct": 81.6
  },
  "geopolitics": {
    "sanctions": [],
    "embargoes": [],
    "isOPECMember": true,
    "opecQuota": 9000000,
    "tradeRestrictions": [],
    "notes": "OPEC's de facto swing producer. Extended voluntary cut of 1M bbl/day through Q2 2026.",
    "lastUpdated": "2026-01-15"
  }
}
```

### Data Sources
- `keyStats`, `productionTrend`: EIA API
- `consumption.breakdown`: Supabase `consumption_by_type`
- `pumpPrices`: Supabase `pump_prices`
- `reserves`: EIA (U.S. weekly) / World Bank for non-U.S.
- `refinery`: Supabase `refinery_capacity`
- `geopolitics`: Supabase `geopolitics` (from `data/geopolitics.json`)

### Cache
- Key: `crudeoptic:country:{iso}`
- TTL: 1 hour

### Error Cases
- `404`: Country ISO not found
- `503`: Upstream API unavailable (returns last cached value with `stale: true` flag)

---

## GET `/api/trade/[iso]`

Import and export flow data for a specific country.

### Path Parameters
| Param | Type | Description |
|-------|------|-------------|
| `iso` | `string` | ISO alpha-2 country code |

### Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `year` | `number` | Previous year | Data year |
| `limit` | `number` | 10 | Max partners to return |

### Response
```json
{
  "iso": "CN",
  "name": "China",
  "year": 2024,
  "imports": {
    "totalBblDay": 11400000,
    "sources": [
      {
        "partnerISO": "SA",
        "partnerName": "Saudi Arabia",
        "bblDay": 1740000,
        "sharePct": 15.3,
        "hsBreakdown": {
          "2709": 1600000,
          "2710": 140000
        }
      },
      {
        "partnerISO": "RU",
        "partnerName": "Russia",
        "bblDay": 2150000,
        "sharePct": 18.9
      }
    ]
  },
  "exports": {
    "totalBblDay": 1200000,
    "destinations": [
      {
        "partnerISO": "KR",
        "partnerName": "South Korea",
        "bblDay": 320000,
        "sharePct": 26.7
      }
    ]
  }
}
```

### Data Source
- UN Comtrade API (primary)
- EIA import/export data (supplementary for U.S.)

### Cache
- Key: `crudeoptic:trade:{iso}:{year}`
- TTL: 12 hours

---

## GET `/api/news`

Latest oil-related news and geo-tagged event alerts.

### Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | `headlines` \| `alerts` \| `all` | `all` | Filter by type |
| `iso` | `string` | (none) | Filter by country ISO |

### Response
```json
{
  "updatedAt": "2026-03-15T10:15:00Z",
  "alerts": [
    {
      "id": "gdelt-20260315-hormuz",
      "type": "geopolitical",
      "severity": "high",
      "title": "Shipping Tensions in Strait of Hormuz",
      "description": "Multiple news sources report increased naval presence near Strait of Hormuz",
      "affectedISOs": ["IR", "AE", "SA", "IQ", "KW", "QA", "OM"],
      "affectedChokepoint": "hormuz",
      "potentialImpactMbblDay": 21,
      "sourceCount": 14,
      "firstSeen": "2026-03-15T08:30:00Z",
      "urls": ["https://reuters.com/...", "https://oilprice.com/..."]
    }
  ],
  "headlines": [
    {
      "id": "rss-reuters-2026031501",
      "source": "Reuters",
      "sourceLogoColor": "#FF8000",
      "title": "Saudi Arabia Extends Output Cut by 90 Days",
      "url": "https://reuters.com/...",
      "publishedAt": "2026-03-15T07:00:00Z",
      "mentionedISOs": ["SA"],
      "summary": "Saudi Arabia announced an extension of its voluntary 1M bbl/day production cut..."
    },
    {
      "id": "rss-oilprice-2026031502",
      "source": "OilPrice.com",
      "sourceLogoColor": "#006400",
      "title": "China's Crude Imports Hit Record High in February",
      "url": "https://oilprice.com/...",
      "publishedAt": "2026-03-15T06:30:00Z",
      "mentionedISOs": ["CN", "SA", "RU"],
      "summary": "..."
    }
  ]
}
```

### Data Source
- `alerts`: GDELT GEO 2.0 API → processed by `lib/news-geo.ts`
- `headlines`: RSS feeds (OilPrice.com, Reuters Energy, OPEC, EIA, Oil & Gas Journal)

### Cache
- Key: `crudeoptic:news`
- TTL: 15 min

---

## GET `/api/map`

Aggregated data for the world map choropleth.

### Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | See below | `production` | Map data mode |

**Mode values:**
- `production` — production in bbl/day per country
- `consumption` — consumption in bbl/day
- `imports` — total imports in bbl/day
- `exports` — total exports in bbl/day
- `reserves` — proved reserves in billion barrels
- `sanctions` — boolean sanctioned flag
- `events` — news event intensity score (0-1, from GDELT)

### Response
```json
{
  "mode": "production",
  "unit": "bbl/day",
  "updatedAt": "2026-03-15T10:00:00Z",
  "data": {
    "US": 12900000,
    "SA": 9000000,
    "RU": 8900000,
    "IQ": 4500000,
    "CN": 4200000
  },
  "min": 0,
  "max": 12900000
}
```

### Cache
- Key: `crudeoptic:map:{mode}`
- TTL: 1 hour (production/consumption), 15 min (events)

---

## Cron Endpoints (Internal)

These are called by Vercel Cron — not for public use.

### POST `/api/cron/refresh-intelligence`

Fetches and caches:
1. RSS headlines from all feeds
2. GDELT event detection
3. Processes keyword → country mapping
4. Writes to `crudeoptic:news` cache key

**Vercel Cron schedule:** `*/30 * * * *` (every 30 min)

### POST `/api/cron/refresh-pump-prices`

1. Scrapes GlobalPetrolPrices.com for petrol + diesel prices
2. Upserts to Supabase `pump_prices` table

**Vercel Cron schedule:** `0 6 * * 1` (every Monday 6am UTC)

---

## Type Definitions (`types/oil.ts`)

```typescript
export type ISO2 = string; // e.g. "SA", "US", "CN"

export interface PricePoint {
  date: string; // ISO date "2026-03-15"
  value: number; // USD/barrel
}

export interface CountrySummary {
  iso: ISO2;
  name: string;
  flag: string;
  production?: number;  // bbl/day
  consumption?: number; // bbl/day
  exports?: number;     // bbl/day
  imports?: number;     // bbl/day
  rank?: number;
}

export interface ConsumptionBreakdown {
  type: 'Gasoline' | 'Diesel' | 'Jet Fuel' | 'Fuel Oil' | 'LPG' | 'Other';
  mtoe: number;
  pct: number;
}

export interface TradeFlow {
  partnerISO: ISO2;
  partnerName: string;
  bblDay: number;
  sharePct: number;
}

export interface GeopoliticsEntry {
  countryISO: ISO2;
  countryName: string;
  sanctions: { body: string; type: string; since: string; notes: string }[];
  embargoes: string[];
  isOPECMember: boolean;
  opecQuota: number | null; // bbl/day
  tradeRestrictions: string[];
  notes: string;
  lastUpdated: string;
}

export interface NewsAlert {
  id: string;
  type: 'geopolitical' | 'supply' | 'price' | 'policy';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  affectedISOs: ISO2[];
  affectedChokepoint?: string;
  potentialImpactMbblDay?: number;
  firstSeen: string;
}

export interface NewsHeadline {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string;
  mentionedISOs: ISO2[];
  summary: string;
}

export type MapMode = 'production' | 'consumption' | 'imports' | 'exports' | 'reserves' | 'sanctions' | 'events';
```
