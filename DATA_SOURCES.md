# CrudeOptic — Data Sources Reference

## Overview

All data sources used are free. Total estimated cost: $0/month.

---

## 1. EIA OpenData API

**URL:** https://www.eia.gov/opendata/
**Cost:** Free
**Registration:** Required (free API key at eia.gov/opendata)
**Rate Limit:** No published limit; generous for web apps

### What We Use

| Dataset | EIA Series | Update | Notes |
|---------|-----------|--------|-------|
| Global oil production by country | `INTL.57-1-{country}-TBPD.A` | Monthly | kb/day, annual |
| U.S. crude oil imports by country | `PET.MCRIMUS1.M` | Monthly | |
| U.S. oil exports by destination | `PET.MCREXUS1.M` | Monthly | |
| Strategic petroleum reserve (U.S.) | `PET.WCSSTUS1.W` | Weekly | Million barrels |
| Global proved oil reserves | `INTL.57-6-{country}-BB.A` | Annual | Billion barrels |
| World oil production total | `INTL.57-1-WLD-TBPD.A` | Monthly | |

### Key API Endpoints

```
Base URL: https://api.eia.gov/v2/

# Country production
GET /international/data?api_key={KEY}&facets[activityId][]=1&facets[productId][]=57&facets[unit][]=TBPD

# U.S. imports by source country
GET /petroleum/move/imp/d35/data?api_key={KEY}&frequency=monthly&sort[0][column]=period&sort[0][direction]=desc&length=12

# SPR levels
GET /petroleum/stoc/wstk/data?api_key={KEY}&facets[series][]=WCSSTUS1
```

### Notes
- Detailed granular data is U.S.-centric; international data is summary-level
- Use for global production rankings and reserve estimates
- ISO 3166-1 alpha-3 country codes used in EIA; map to alpha-2 for app

---

## 2. UN Comtrade API

**URL:** https://comtradedeveloper.un.org/
**Cost:** Free with registration
**Rate Limit:** 500 API calls/day (free tier)
**Registration:** Required (UN Comtrade account)

### What We Use

Bilateral trade flows: for any country, find its top 10 import sources and top 10 export destinations for petroleum (crude + refined products).

### HS Codes for Petroleum

| HS Code | Product |
|---------|---------|
| 2709 | Crude oil from petroleum/bituminous minerals |
| 2710 | Petroleum oils (non-crude): petrol, diesel, kerosene, fuel oil |
| 2711 | Petroleum gas (LNG, LPG) |
| 2712 | Petroleum jelly, mineral waxes |
| 2713 | Petroleum coke, petroleum bitumen |

### Key API Endpoints

```
Base URL: https://comtradeapi.un.org/data/v1/

# Country's top import sources for crude oil (HS 2709)
GET /get/C/A/{reporterCode}/2709?flowCode=M&partnerCode=0&period=2023&includeDesc=true

# Country's top export destinations
GET /get/C/A/{reporterCode}/2709?flowCode=X&partnerCode=0&period=2023&includeDesc=true

# Parameters:
# C = commodities
# A = annual
# reporterCode = ISO numeric code (e.g., 682 = Saudi Arabia, 156 = China)
# flowCode = M (import) / X (export)
```

### Python Library (for seeding data)
```bash
pip install comtradeapicall
```

### Notes
- Data lags by 1-3 months (reported after customs clearing)
- Not real-time — but the most comprehensive bilateral trade flow data available free
- 500 calls/day is sufficient with 12-hour caching
- Use ISO numeric codes (Comtrade) mapped to ISO alpha-2/alpha-3

---

## 3. FRED API (Federal Reserve Economic Data)

**URL:** https://fred.stlouisfed.org/
**Cost:** Free
**Rate Limit:** None published; very generous
**Registration:** Required (free API key)

### What We Use

| Series ID | Description | History |
|-----------|-------------|---------|
| `DCOILWTICO` | WTI crude oil spot price ($/barrel, daily) | 1986–present |
| `DCOILBRENTEU` | Brent crude oil spot price ($/barrel, daily) | 1987–present |

### Key API Endpoint

```
Base URL: https://api.stlouisfed.org/fred/

# Get last 365 days of WTI prices
GET /series/observations?series_id=DCOILWTICO&api_key={KEY}&file_type=json&sort_order=desc&limit=365

# Get last 365 days of Brent prices
GET /series/observations?series_id=DCOILBRENTEU&api_key={KEY}&file_type=json&sort_order=desc&limit=365
```

### Notes
- Use for historical price charts (1-year, 5-year, 10-year views)
- Cache for 24 hours (FRED updates once daily)
- Values labeled as "." represent missing/non-trading days — filter out

---

## 4. Oil Price API

**URL:** https://oilpriceapi.com/
**Cost:** Free tier: 100 requests/month
**Rate Limit:** 100 req/month on free plan

### What We Use

- Live WTI crude spot price (updates every 60 seconds)
- Live Brent crude spot price
- Displayed in the price ticker banner

### Key API Endpoints

```
Base URL: https://api.oilpriceapi.com/v1/

# Latest WTI price
GET /prices/latest?by_code=WTI_USD

# Latest Brent price
GET /prices/latest?by_code=BRENT_USD

# Headers: Authorization: Token {API_KEY}
```

### Notes
- 100 req/month = ~3.3/day. With 15-minute caching: 96 reads/day served from cache, 3-4 actual API calls/day.
- If 100/month limit is exceeded, fall back to FRED API for daily close price
- Alternative: Crude Price API (crudepriceapi.com) — same free tier, 5-min updates

---

## 5. GDELT GEO 2.0 API

**URL:** https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/
**Cost:** Free, no API key required
**Rate Limit:** None published
**Update Frequency:** Every 15 minutes

### What We Use

Real-time detection of geopolitical events in global news that affect oil supply/demand. Extract mentioned locations and map them to countries.

### Key API Endpoint

```
Base URL: https://api.gdeltproject.org/api/v2/geo/geo

# Search for recent oil-related geopolitical events with location data
GET ?query=oil+sanctions+embargo&mode=artlist&maxrecords=25&format=json&timespan=1h

# Search for Strait of Hormuz events
GET ?query=%22Strait+of+Hormuz%22&mode=artlist&maxrecords=10&format=json&timespan=2h

# Parameters:
# query       = URL-encoded keyword string
# mode        = artlist (article list with geo), geojson, timelinecountryinfo
# maxrecords  = max 250
# format      = json, csv, geojson, html
# timespan    = 15m, 1h, 4h, 24h, 1w
# startdatetime / enddatetime = YYYYMMDDHHMMSS
```

### Keyword Sets to Query

```javascript
const OIL_KEYWORDS = [
  'crude oil sanctions',
  'OPEC production cut',
  'oil embargo',
  'Strait of Hormuz',
  'Suez Canal oil',
  'Russia oil ban',
  'oil pipeline attack',
  'oil refinery fire',
  'oil supply disruption',
  'petroleum sanctions',
];
```

### Response Fields Used

```json
{
  "articles": [
    {
      "title": "...",
      "url": "...",
      "seendate": "20260315T142300Z",
      "sourcecountry": "United States",
      "language": "English",
      "domain": "reuters.com",
      "socialimage": "...",
      "locations": [
        { "name": "Iran", "lat": 32.0, "lon": 53.0, "countrycode": "IR" },
        { "name": "Strait of Hormuz", "lat": 26.5, "lon": 56.3, "countrycode": "IR" }
      ]
    }
  ]
}
```

### Notes
- `countrycode` is ISO alpha-2 — direct match to app's country routing
- Filter out articles older than 6 hours to show only "active" alerts
- Deduplicate by domain to avoid article flood from single source
- Cache GDELT results for 15 min in Vercel KV

---

## 6. RSS News Feeds

**Cost:** Free
**Library:** `rss-parser` (npm)

### Feeds Used

| Source | URL | Content |
|--------|-----|---------|
| OilPrice.com | https://oilprice.com/rss/main | Top energy news, oil/gas focus |
| Reuters Energy | https://feeds.reuters.com/reuters/businessNews | Global business + energy |
| OPEC Newsroom | https://www.opec.org/opec_web/en/feeds.htm | Official OPEC press releases |
| EIA Releases | https://www.eia.gov/tools/rssfeeds/ | U.S. energy data releases |
| Oil & Gas Journal | https://www.ogj.com/rss | Industry trade publication |

### Parsing Example (Next.js API route)

```typescript
import Parser from 'rss-parser';
const parser = new Parser();

const feed = await parser.parseURL('https://oilprice.com/rss/main');
// feed.items[0] = { title, link, pubDate, content, summary }
```

### Country Extraction from RSS

After fetching RSS items, run keyword matching via `lib/news-geo.ts`:

```typescript
// Dictionary: keyword → ISO alpha-2 country code(s)
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  'saudi arabia': ['SA'],
  'russia': ['RU'],
  'iran': ['IR'],
  'iraq': ['IQ'],
  'strait of hormuz': ['IR', 'AE', 'SA', 'IQ', 'KW', 'QA', 'OM'],
  'suez canal': ['EG'],
  'opec': ['SA', 'RU', 'IQ', 'AE', 'KW', 'VE', 'NG', 'EC', 'GA', 'CD', 'GQ', 'IR'],
  'ukraine': ['UA', 'RU'],
  // ... ~100 entries
};
```

---

## 7. GlobalPetrolPrices.com (Web Scraper)

**URL:** https://www.globalpetrolprices.com/gasoline_prices/
**Cost:** Free (HTML scraping)
**Update Frequency:** Weekly (every Monday)
**Coverage:** ~150 countries

### Data Available

- Petrol (gasoline) price in USD/liter — per country
- Diesel price in USD/liter — per country
- Last updated date

### Scraping Strategy

```typescript
// lib/pump-prices.ts
import * as cheerio from 'cheerio';

async function scrapeGlobalPetrolPrices(type: 'gasoline' | 'diesel') {
  const url = `https://www.globalpetrolprices.com/${type}_prices/`;
  const html = await fetch(url, { headers: { 'User-Agent': 'CrudeOptic/1.0' } }).then(r => r.text());
  const $ = cheerio.load(html);

  const prices: { iso: string; price_usd: number }[] = [];

  $('table#graphWidgetData tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    const country = $(cells[0]).text().trim();
    const price = parseFloat($(cells[1]).text().trim());
    const iso = countryNameToISO(country); // lookup in countries.ts
    if (iso && !isNaN(price)) prices.push({ iso, price_usd: price });
  });

  return prices;
}
```

### Notes
- Respect robots.txt; add `User-Agent: CrudeOptic/1.0` header
- Cache in Supabase `pump_prices` table with `updated_at` timestamp
- Run via Vercel Cron every Monday 06:00 UTC
- Display with label: "Weekly estimate (GlobalPetrolPrices.com)"
- **Legal note:** Public data, non-commercial use; if app becomes commercial, consider attributing or licensing

---

## 8. World Bank API (Pump Price Fallback)

**URL:** https://data.worldbank.org/
**Cost:** Free, no API key needed
**Rate Limit:** None published

### What We Use

Fallback for countries not covered by GlobalPetrolPrices.com scrape.

| Indicator ID | Description |
|-------------|-------------|
| `EP.PMP.SGAS.CD` | Pump price for gasoline (USD/liter) |
| `EP.PMP.DESL.CD` | Pump price for diesel fuel (USD/liter) |

### Key API Endpoint

```
Base URL: https://api.worldbank.org/v2/

# Get gasoline pump prices for all countries, latest 3 years
GET /country/all/indicator/EP.PMP.SGAS.CD?format=json&per_page=300&mrv=3
```

### Notes
- Annual data only — use as a baseline reference, labeled "Annual average"
- Seed into Supabase `pump_prices` table as fallback rows

---

## 9. Energy Institute Statistical Review (Seeded Data)

**URL:** https://www.energyinst.org/statistical-review
**Cost:** Free
**Format:** Excel download + interactive tool
**Update:** Annual (released each June)

### What We Seed

- Oil consumption by country and product type (petrol, diesel, jet fuel, fuel oil, other)
- Production by country
- Proved reserves by country (as of year-end)

### Download Process

1. Visit the interactive tool at energyinst.org/statistical-review/resources-and-data/
2. Download "Oil — All data" Excel file
3. Run `scripts/seed-consumption.ts` to parse and load into Supabase `consumption_by_type` table

### Sheet Structure (typical)

```
Sheet: "Oil Consumption - Mtoe"
Row 1: Header (country names)
Col A: Year
Col B-...: Country values in Mtoe

Sheet: "Oil - Product Consumption"
Sub-sheets by product type: Gasoline, Diesel, Jet Fuel, Fuel Oil, Other
```

---

## 10. OPEC Annual Statistical Bulletin (Seeded Data)

**URL:** https://asb.opec.org/data/ASB_Data.php
**Cost:** Free Excel downloads
**Update:** Annual

### What We Seed

- Crude oil production by OPEC member (thousand barrels/day)
- OPEC member exports by destination
- Current production quotas

### Download Process

1. Visit opec.org/asb
2. Download "Table 3.2 — OPEC crude oil production" as Excel
3. Run `scripts/seed-opec.ts` to load into Supabase `opec_quotas` table

---

## 11. KAPSARC Data Portal (Seeded Data)

**URL:** https://datasource.kapsarc.org/
**Cost:** Free

### What We Seed

- Refinery distillation capacity by country (2009–2022)
- Refinery throughput by country

### Access

Direct dataset download from KAPSARC portal. Parse CSV/Excel and seed into Supabase `refinery_capacity` table.

---

## 12. Geopolitical Sources (Curated JSON)

These are not real-time APIs — they feed a quarterly-updated `data/geopolitics.json` file in the repo.

| Source | Data | URL |
|--------|------|-----|
| OFAC SDN List | U.S.-sanctioned countries | https://ofac.treasury.gov/sanctions-list-service |
| EU Consolidated Sanctions | EU-sanctioned entities/countries | https://data.europa.eu/euodp/en/data/dataset/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions |
| UN SC Sanctions | UN-mandated arms/oil embargoes | https://scsanctions.un.org/consolidated/ |
| OPEC MOMR | Current production quotas | https://publications.opec.org/momr |

### `data/geopolitics.json` Schema

```json
{
  "IR": {
    "countryISO": "IR",
    "countryName": "Iran",
    "sanctions": [
      { "body": "OFAC", "type": "comprehensive", "since": "1979-11-14", "notes": "Iranian Transactions and Sanctions Regulations" },
      { "body": "EU", "type": "nuclear+oil", "since": "2012-01-23", "notes": "EU Regulation 267/2012" },
      { "body": "UN", "type": "arms", "since": "2006-12-23", "notes": "UNSC Resolution 1737" }
    ],
    "embargoes": ["US", "EU", "UK"],
    "isOPECMember": true,
    "opecQuota": null,
    "tradeRestrictions": ["No US dollar transactions", "SWIFT exclusion for most banks"],
    "notes": "Major oil exporter with comprehensive U.S. and EU sanctions. Oil sold at discount to China, India via grey-market routes.",
    "lastUpdated": "2026-01-15"
  },
  "SA": {
    "countryISO": "SA",
    "countryName": "Saudi Arabia",
    "sanctions": [],
    "embargoes": [],
    "isOPECMember": true,
    "opecQuota": 9000,
    "tradeRestrictions": [],
    "notes": "OPEC+ de facto leader. Voluntary production cut of 1M bbl/day extended through Q2 2026.",
    "lastUpdated": "2026-01-15"
  }
}
```

---

## Data Freshness Summary

| Category | Source | Freshness |
|----------|--------|-----------|
| Live oil prices (WTI/Brent) | Oil Price API | Every 15 min (cached) |
| Historical prices | FRED | Daily |
| Production rankings | EIA | Monthly |
| Trade flows (bilateral) | UN Comtrade | Monthly (1-3 month lag) |
| Strategic reserves (U.S.) | EIA | Weekly |
| Strategic reserves (OECD) | IEA (limited free) | Monthly |
| Retail pump prices | GlobalPetrolPrices.com | Weekly |
| Oil news headlines | RSS feeds | Every 30 min |
| Geopolitical events | GDELT GEO 2.0 | Every 15 min |
| Consumption by product type | Energy Institute | Annual |
| Refinery capacity | KAPSARC | Annual |
| Sanctions/embargoes | OFAC/EU/UN (curated) | Quarterly |
| OPEC production quotas | OPEC MOMR (curated) | Monthly (manual) |
