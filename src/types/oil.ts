/** ISO 3166-1 alpha-2 country code */
export type ISO2 = string;

/** Oil benchmark types */
export type Benchmark = "WTI" | "BRENT";

/** Map visualization modes */
export type MapMode =
  | "production"
  | "consumption"
  | "imports"
  | "exports"
  | "reserves"
  | "sanctions"
  | "news";

/** Price data point for time series */
export interface PricePoint {
  date: string; // ISO date
  wti: number;
  brent: number;
}

/** Live price snapshot */
export interface LivePrice {
  benchmark: Benchmark;
  price: number;
  change: number;
  change_percent: number;
  updated_at: string;
}

/** Country summary for landing/map */
export interface CountrySummary {
  iso: ISO2;
  name: string;
  production_bpd: number | null; // barrels per day
  consumption_bpd: number | null;
  net_imports_bpd: number | null;
  reserves_days: number | null;
  rank_producer: number | null;
  rank_consumer: number | null;
}

/** Consumption breakdown by product type */
export interface ConsumptionBreakdown {
  iso: ISO2;
  year: number;
  petrol: number;
  diesel: number;
  kerosene: number;
  jet_fuel: number;
  lpg: number;
  fuel_oil: number;
  other: number;
  total: number;
  unit: string; // "thousand_bpd"
}

/** Bilateral trade flow */
export interface TradeFlow {
  source_iso: ISO2;
  source_name: string;
  target_iso: ISO2;
  target_name: string;
  volume_bpd: number;
  value_usd: number;
  year: number;
  hs_code: string;
}

/** Geopolitical entry for a country */
export interface GeopoliticsEntry {
  iso: ISO2;
  sanctions: SanctionEntry[];
  embargoes: EmbargoEntry[];
  opec_member: boolean;
  opec_quota_bpd: number | null;
  trade_restrictions: string[];
  notes: string;
}

export interface SanctionEntry {
  body: "OFAC" | "EU" | "UN";
  type: string;
  since: string;
  details: string;
}

export interface EmbargoEntry {
  imposed_by: string;
  target_sector: string;
  since: string;
  details: string;
}

/** Chokepoint definition */
export interface Chokepoint {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  daily_flow_bpd: number;
  affected_producers: ISO2[];
  affected_importers: ISO2[];
  description: string;
}

/** News headline */
export interface NewsHeadline {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at: string;
  countries: ISO2[];
  sentiment: "positive" | "negative" | "neutral";
  summary: string;
}

/** Geo-tagged news alert */
export interface NewsAlert {
  id: string;
  title: string;
  event_type: string;
  severity: "critical" | "high" | "medium" | "low";
  countries: ISO2[];
  chokepoint_id: string | null;
  published_at: string;
  source_url: string;
}

/** Pump price per country */
export interface PumpPrice {
  iso: ISO2;
  petrol_usd_per_liter: number | null;
  diesel_usd_per_liter: number | null;
  source: "scrape" | "worldbank";
  updated_at: string;
}

/** Refinery capacity */
export interface RefineryCapacity {
  iso: ISO2;
  capacity_bpd: number;
  throughput_bpd: number | null;
  utilization_pct: number | null;
  year: number;
}

/** Country detail — full data for /country/[code] */
export interface CountryDetail {
  summary: CountrySummary;
  consumption: ConsumptionBreakdown | null;
  imports: TradeFlow[];
  exports: TradeFlow[];
  geopolitics: GeopoliticsEntry | null;
  pump_price: PumpPrice | null;
  refinery: RefineryCapacity | null;
  production_history: { year: number; value: number }[];
  price_history: PricePoint[];
}

/** API response wrapper */
export interface ApiResponse<T> {
  data: T;
  updated_at: string;
  source: string;
}

/** Overview data for landing page */
export interface OverviewData {
  top_producers: CountrySummary[];
  top_consumers: CountrySummary[];
  top_importers: CountrySummary[];
  top_exporters: CountrySummary[];
  live_prices: LivePrice[];
  latest_news: NewsHeadline[];
  active_alerts: NewsAlert[];
  global_production_bpd: number;
  global_consumption_bpd: number;
}
