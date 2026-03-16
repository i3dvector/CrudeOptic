# CrudeOptic — Pages & Components Specification

## Design System

### Colors
```
Background:       #0A0A0A (near black)
Surface:          #111111 (card background)
Surface elevated: #1A1A1A (hover/active)
Border:           #2A2A2A
Text primary:     #F5F5F5
Text secondary:   #888888
Accent amber:     #F59E0B
Accent orange:    #F97316
Accent red:       #EF4444 (alerts/sanctions)
Accent green:     #22C55E (production/growth)
Accent blue:      #3B82F6 (imports)
Accent purple:    #A855F7 (exports)
```

### Typography
- Font: `Outfit` (Headings) / `Inter` (Body) (Google Fonts)
- Numbers: `Space Grotesk` (monospace/tabular for data values)
- Headings: Bold, tracked wide (letter-spacing)

### Spacing
- Page padding: `px-6 py-8` (24px / 32px)
- Card padding: `p-5` (20px)
- Section gap: `gap-6` (24px)
- Grid: 12-column, responsive

---

## Global Layout

### `layout.tsx`

```
┌────────────────────────────────────────────────────────────┐
│  NAVBAR                                                     │
│  [CrudeOptic logo]  [/ Home] [/explore Map]  [Search box]   │
├────────────────────────────────────────────────────────────┤
│  PRICE TICKER (scrolling strip)                            │
│  WTI: $XX.XX (+0.XX%)  │  Brent: $XX.XX (+0.XX%)  │ ...  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  {children}                                               │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  FOOTER: Data sources, disclaimers, last updated          │
└────────────────────────────────────────────────────────────┘
```

**`PriceTicker` component:**
- Sticky strip below navbar
- Scrolling marquee (CSS animation)
- Shows: WTI price, Brent price, day change, % change
- Updates on client via polling `/api/prices` every 15 min
- Color: green if up, red if down

---

## Page 1: Landing (`/`)

### Purpose
Global overview — immediately convey the scale and dynamics of global oil.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│  HERO SECTION                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │  3D Globe (react-globe.gl)                          │   │
│  │  - Rotating, clickable                              │   │
│  │  - Colored dots for top producers (amber)          │   │
│  │  - Arc lines showing major trade routes            │   │
│  │  - Click country → /country/[iso]                  │   │
│  └────────────────────────────────────────────────────┘   │
│  "Explore Global Oil Intelligence" [→ Explore Map]        │
├────────────────────────────────────────────────────────────┤
│  ALERTS BANNER (if active events)                         │
│  ⚠️ "Strait of Hormuz tension — 6 countries affected"    │
│  [SA] [IR] [AE] [IQ] [KW] [QA]                           │
├────────────────────────────────────────────────────────────┤
│  KEY STATS ROW (4 cards)                                  │
│  [World Production: 103M bbl/day]  [Top Producer: USA]   │
│  [World Consumption: 101M bbl/day] [WTI: $XX.XX]         │
├────────────────────────────────────────────────────────────┤
│  TWO COLUMNS                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐        │
│  │ TOP 10 PRODUCERS    │  │ TOP 10 CONSUMERS     │        │
│  │ (Horizontal bar     │  │ (Horizontal bar      │        │
│  │  chart, Recharts)   │  │  chart, Recharts)    │        │
│  │ 1. USA  12.9M bb/d  │  │ 1. USA  20.3M bb/d  │        │
│  │ 2. Russia  ...      │  │ 2. China ...         │        │
│  │ [Click → country]   │  │ [Click → country]    │        │
│  └─────────────────────┘  └─────────────────────┘        │
├────────────────────────────────────────────────────────────┤
│  TWO COLUMNS                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐        │
│  │ TOP IMPORTERS       │  │ TOP EXPORTERS        │        │
│  │ (Ranked cards)      │  │ (Ranked cards)       │        │
│  └─────────────────────┘  └─────────────────────┘        │
├────────────────────────────────────────────────────────────┤
│  OIL NEWS FEED                                            │
│  ┌─────────────────────────────────────────────────┐     │
│  │ Latest Oil & Energy Headlines                    │     │
│  │ [Reuters] Saudi Arabia Cuts Output... [IR][SA]  │     │
│  │ [OilPrice] China Crude Imports Hit Record...    │     │
│  │ [OPEC] OPEC+ Agrees to Extend Cuts...           │     │
│  │ [EIA] Weekly Petroleum Status Report ...        │     │
│  │ [OGJ] Pipeline Disruption in...                 │     │
│  └─────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────┘
```

### Components Used
- `GlobeHero` — react-globe.gl with producer dots + trade arc lines
- `AlertsBanner` — GDELT events with affected country tags
- `TopProducersChart` — Recharts `BarChart` (horizontal)
- `TopConsumersChart` — Recharts `BarChart` (horizontal)
- `CountryRankCard` — ranked importers/exporters (reusable)
- `NewsFeed` — RSS items list with source badge + country tags

---

## Page 2: Explore (`/explore`)

### Purpose
Interactive world map for drill-down. Primary navigation mechanism.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│  MAP CONTROLS BAR                                          │
│  [Production] [Consumption] [Imports] [Exports]            │
│  [Reserves] [Sanctions] [News Events]                      │
│  ─────────────────────────────────────────────────        │
│  [Show Chokepoints ☑] [Show Trade Routes ☐]               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  WORLD CHOROPLETH MAP (full-width, ~70vh)                 │
│  ┌──────────────────────────────────────────────────┐    │
│  │                                                   │    │
│  │    [React Simple Maps + D3 color scale]          │    │
│  │                                                   │    │
│  │    Colors:                                        │    │
│  │    Production: amber gradient (low → high)        │    │
│  │    Consumption: blue gradient                     │    │
│  │    Sanctions: red highlight                       │    │
│  │    News Events: pulsing red border               │    │
│  │                                                   │    │
│  │    Chokepoint overlays:                          │    │
│  │    ━━━ Strait of Hormuz                          │    │
│  │    ━━━ Suez Canal                                │    │
│  │    ━━━ Strait of Malacca                         │    │
│  │    ━━━ Bab el-Mandeb                             │    │
│  │                                                   │    │
│  │    Tooltip on hover: country name + metric value │    │
│  │    Click → /country/[iso]                        │    │
│  └──────────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────────┤
│  LEGEND                           ACTIVE ALERTS           │
│  [Color gradient scale]           [List of active events] │
└────────────────────────────────────────────────────────────┘
```

### Map Toggle Modes

| Mode | Color Scale | Data Source | Description |
|------|-------------|-------------|-------------|
| Production | Amber → Orange | EIA | Oil production in bbl/day |
| Consumption | Light Blue → Dark Blue | EIA/EI | Oil consumption in bbl/day |
| Imports | Green → Dark Green | Comtrade/EIA | Total imports in bbl/day |
| Exports | Purple → Dark Purple | Comtrade/EIA | Total exports in bbl/day |
| Reserves | Yellow → Gold | EIA | Proved reserves in billion barrels |
| Sanctions | Gray / Red highlight | geopolitics.json | Red = sanctioned, Gray = not |
| News Events | Orange pulse | GDELT | Countries in active news events |

### Chokepoint Overlay Data (`data/chokepoints.json`)

```json
[
  {
    "id": "hormuz",
    "name": "Strait of Hormuz",
    "coordinates": [[55.0, 26.0], [57.5, 25.5]],
    "description": "~20% of world's oil supply passes through",
    "affected_producers": ["SA", "AE", "KW", "IQ", "IR", "QA", "OM"],
    "affected_importers": ["CN", "JP", "IN", "KR", "SG", "EU"],
    "daily_flow_mbbl": 21
  },
  {
    "id": "suez",
    "name": "Suez Canal",
    "coordinates": [[32.3, 30.7], [32.5, 29.9]],
    "description": "~9% of world's oil trade",
    "affected_producers": ["SA", "IQ", "KW", "RU"],
    "affected_importers": ["DE", "IT", "NL", "FR", "GB"],
    "daily_flow_mbbl": 9
  },
  {
    "id": "malacca",
    "name": "Strait of Malacca",
    "coordinates": [[103.8, 1.3], [100.3, 4.0]],
    "description": "~16M bbl/day — primary East Asia supply route",
    "affected_producers": ["SA", "IQ", "AE", "KW"],
    "affected_importers": ["CN", "JP", "KR", "TW", "SG"],
    "daily_flow_mbbl": 16
  },
  {
    "id": "babelmandeb",
    "name": "Bab el-Mandeb",
    "coordinates": [[43.5, 12.6], [43.3, 11.8]],
    "description": "Red Sea gateway; Houthi threat active",
    "affected_producers": ["SA", "RU", "IQ"],
    "affected_importers": ["DE", "IT", "FR", "GB"],
    "daily_flow_mbbl": 6
  }
]
```

### Components Used
- `WorldMap` — React Simple Maps with color scale + country click
- `MapControls` — toggle button group
- `ChokepointOverlay` — SVG `<line>` elements over the map
- `MapTooltip` — custom hover tooltip with country stats
- `AlertsBanner` — reused from landing page

---

## Page 3: Country Detail (`/country/[iso]`)

### Layout (scrollable, full-width)

```
┌────────────────────────────────────────────────────────────┐
│  COUNTRY HEADER                                            │
│  🇸🇦  Saudi Arabia                                         │
│  [#2 Producer] [#1 Exporter] [OPEC Member]                │
│  ⚠️  OPEC Member — Production Quota: 9.0M bbl/day         │
├────────────────────────────────────────────────────────────┤
│  KEY STATS BAR (5 cards)                                  │
│  Production   Consumption   Net Export   Reserves  Refinery│
│  9.0M bbl/d   3.1M bbl/d   5.9M bbl/d   259Bb   3.8M bbl/d│
├────────────────────────────────────────────────────────────┤
│  TWO COLUMNS (Sankey diagrams)                            │
│  ┌─────────────────────┐  ┌─────────────────────┐        │
│  │ WHERE IT GETS OIL   │  │ WHERE IT SELLS OIL   │        │
│  │ (Import Sources)    │  │ (Export Destinations) │        │
│  │                     │  │                      │        │
│  │ [D3 Sankey]         │  │ [D3 Sankey]          │        │
│  │                     │  │                      │        │
│  │ SA produces own oil │  │ China ───────── 55%  │        │
│  │ (minimal imports)   │  │ Japan ─────── 12%   │        │
│  │                     │  │ India ──────  8%    │        │
│  │                     │  │ South Korea ─  7%   │        │
│  └─────────────────────┘  └─────────────────────┘        │
├────────────────────────────────────────────────────────────┤
│  TWO COLUMNS                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐        │
│  │ CONSUMPTION BREAKDOWN│  │ PRODUCTION TREND     │        │
│  │ (Donut chart)        │  │ (Line chart, 5yr)   │        │
│  │                      │  │                      │        │
│  │  Diesel    42%       │  │ [Recharts LineChart] │        │
│  │  Gasoline  28%       │  │                      │        │
│  │  Jet Fuel  15%       │  │                      │        │
│  │  Fuel Oil   9%       │  │                      │        │
│  │  LPG        4%       │  │                      │        │
│  │  Other      2%       │  │                      │        │
│  └─────────────────────┘  └─────────────────────┘        │
├────────────────────────────────────────────────────────────┤
│  PRICES                                                    │
│  ┌──────────────────────────────────────────────────┐    │
│  │ WTI/Brent Price History (1 year)                  │    │
│  │ [Recharts AreaChart — dual axis: WTI + Brent]     │    │
│  │ ─────────────────────────────────────────         │    │
│  │ Pump Prices (Weekly estimate)                     │    │
│  │ Gasoline: $0.52/L   Diesel: $0.48/L              │    │
│  │ (Heavily subsidized — Saudi Arabia)               │    │
│  └──────────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────────┤
│  TWO COLUMNS                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐        │
│  │ STRATEGIC RESERVES  │  │ REFINERY CAPACITY    │        │
│  │                     │  │                      │        │
│  │ Days of supply: 90  │  │ [Bar chart]          │        │
│  │ [Gauge/donut]       │  │ Capacity: 3.8M bbl/d │        │
│  │ Inventory: 325Mb    │  │ Throughput: 3.1M bbl/d│        │
│  │ [Trend line]        │  │ Utilization: 82%     │        │
│  └─────────────────────┘  └─────────────────────┘        │
├────────────────────────────────────────────────────────────┤
│  GEOPOLITICAL CONTEXT                                     │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Sanctions & Restrictions                          │    │
│  │ [None — Saudi Arabia has no active sanctions]     │    │
│  │                                                   │    │
│  │ OPEC Membership                                   │    │
│  │ ✓ OPEC Member since 1960                         │    │
│  │ Current quota: 9.0M bbl/day                      │    │
│  │ Voluntary additional cut: 1M bbl/day             │    │
│  │                                                   │    │
│  │ Trade Relationships                               │    │
│  │ Key suppliers to: China (55%), Japan (12%)       │    │
│  │ Key chokepoints: Strait of Hormuz                │    │
│  │                                                   │    │
│  │ Notes: "Saudi Arabia serves as OPEC's de facto   │    │
│  │ swing producer, adjusting output to stabilize    │    │
│  │ global prices."                                  │    │
│  └──────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### `GlobeHero`
- **Library:** react-globe.gl
- **Props:** `producers: {lat, lon, iso, production}[]`, `tradeRoutes: {from, to, volume}[]`
- **Behavior:** Auto-rotates slowly; stops on hover; click country navigates to `/country/[iso]`
- **Visual:** Amber dots scaled to production volume; orange arcs for major trade routes

### `AlertsBanner`
- **Props:** `events: {title, countries: string[], chokepoint?: string, url: string}[]`
- **Behavior:** Hidden if no active events; shows warning icon + affected country flag chips
- **Example:** `⚠️ "Houthi Attack on Shipping — Bab el-Mandeb" [YE] [SA] [EG]`

### `WorldMap`
- **Library:** react-simple-maps
- **Props:** `mode: MapMode`, `data: Record<string, number>`, `highlighted: string[]`
- **Behavior:** Choropleth color scale (D3 `scaleSequential`); hover tooltip; click → navigate
- **Color domain:** Calculated from data min/max at render time

### `ImportSankey` / `ExportSankey`
- **Library:** d3-sankey
- **Props:** `links: {source: string, target: string, value: number}[]`
- **Visual:** Country name → center node → partner country; link width = trade volume
- **Tooltip:** Hover link shows exact volume in bbl/day and share %

### `ConsumptionDonut`
- **Library:** Recharts `PieChart` with `innerRadius`
- **Props:** `data: {type: string, mtoe: number}[]`
- **Color mapping:**
  - Gasoline: #F59E0B (amber)
  - Diesel: #3B82F6 (blue)
  - Jet Fuel: #8B5CF6 (purple)
  - Fuel Oil: #6B7280 (gray)
  - LPG: #22C55E (green)
  - Other: #374151 (dark gray)

### `ReservesGauge`
- **Implementation:** Recharts `RadialBarChart` or custom SVG arc
- **Props:** `daysOfSupply: number`, `maxDays: 180`
- **Color thresholds:** <30 days = red, 30-90 = amber, >90 = green
- **Below gauge:** Inventory trend (mini sparkline, last 12 months)

### `PriceChart`
- **Library:** Recharts `AreaChart`
- **Props:** `wti: PricePoint[]`, `brent: PricePoint[]`, `period: '1M'|'3M'|'1Y'|'5Y'`
- **Visual:** Dual lines (WTI amber, Brent orange) on same Y axis, gradient fills beneath lines.
- **Below chart:** Pump price row: Gasoline: $X.XX/L | Diesel: $X.XX/L | Source + date

### `GeopoliticsPanel`
- **Props:** `data: GeopoliticsEntry` (from geopolitics.json)
- **Sections:** Sanctions list, OPEC info, trade restrictions, notes
- **Sanction badges:** Color-coded by body (OFAC=red, EU=blue, UN=yellow)

### `NewsFeed`
- **Props:** `items: NewsItem[]` (from `/api/news`)
- **Each item:** Source badge, headline, time ago, flag icons for mentioned countries
- **Max items:** 8, with "View all" link

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| < 768px (mobile) | Single column; charts stack; Sankey replaced by table; globe disabled |
| 768–1024px (tablet) | 2-column grid; smaller charts |
| > 1024px (desktop) | Full layout as designed |

## Loading States
- All cards show skeleton pulse animation while loading
- Charts show a loading spinner placeholder at full card height
- Country page loads key stats first (fast), then deferred load for charts

## Error States
- If EIA/Comtrade API fails: show "Data temporarily unavailable" with last-known timestamp
- If country not found: 404 page with search suggestions
