export interface CountryMeta {
  iso: string;
  name: string;
  flag: string;
  region: string;
  coordinates: [number, number]; // [lng, lat]
}

/** Core country metadata — all major oil-producing and consuming nations */
export const COUNTRIES: Record<string, CountryMeta> = {
  US: { iso: "US", name: "United States", flag: "\ud83c\uddfa\ud83c\uddf8", region: "North America", coordinates: [-98.5, 39.8] },
  SA: { iso: "SA", name: "Saudi Arabia", flag: "\ud83c\uddf8\ud83c\udde6", region: "Middle East", coordinates: [45.0, 25.0] },
  RU: { iso: "RU", name: "Russia", flag: "\ud83c\uddf7\ud83c\uddfa", region: "Europe & Eurasia", coordinates: [105.3, 61.5] },
  CA: { iso: "CA", name: "Canada", flag: "\ud83c\udde8\ud83c\udde6", region: "North America", coordinates: [-106.3, 56.1] },
  IQ: { iso: "IQ", name: "Iraq", flag: "\ud83c\uddee\ud83c\uddf6", region: "Middle East", coordinates: [44.0, 33.2] },
  CN: { iso: "CN", name: "China", flag: "\ud83c\udde8\ud83c\uddf3", region: "Asia Pacific", coordinates: [104.2, 35.9] },
  AE: { iso: "AE", name: "United Arab Emirates", flag: "\ud83c\udde6\ud83c\uddea", region: "Middle East", coordinates: [53.8, 23.4] },
  BR: { iso: "BR", name: "Brazil", flag: "\ud83c\udde7\ud83c\uddf7", region: "South America", coordinates: [-51.9, -14.2] },
  IR: { iso: "IR", name: "Iran", flag: "\ud83c\uddee\ud83c\uddf7", region: "Middle East", coordinates: [53.7, 32.4] },
  KW: { iso: "KW", name: "Kuwait", flag: "\ud83c\uddf0\ud83c\uddfc", region: "Middle East", coordinates: [47.5, 29.3] },
  MX: { iso: "MX", name: "Mexico", flag: "\ud83c\uddf2\ud83c\uddfd", region: "North America", coordinates: [-102.5, 23.6] },
  NO: { iso: "NO", name: "Norway", flag: "\ud83c\uddf3\ud83c\uddf4", region: "Europe", coordinates: [8.5, 60.5] },
  KZ: { iso: "KZ", name: "Kazakhstan", flag: "\ud83c\uddf0\ud83c\uddff", region: "Central Asia", coordinates: [66.9, 48.0] },
  NG: { iso: "NG", name: "Nigeria", flag: "\ud83c\uddf3\ud83c\uddec", region: "Africa", coordinates: [8.7, 9.1] },
  LY: { iso: "LY", name: "Libya", flag: "\ud83c\uddf1\ud83c\uddfe", region: "Africa", coordinates: [17.2, 26.3] },
  AO: { iso: "AO", name: "Angola", flag: "\ud83c\udde6\ud83c\uddf4", region: "Africa", coordinates: [17.9, -11.2] },
  DZ: { iso: "DZ", name: "Algeria", flag: "\ud83c\udde9\ud83c\uddff", region: "Africa", coordinates: [1.7, 28.0] },
  GB: { iso: "GB", name: "United Kingdom", flag: "\ud83c\uddec\ud83c\udde7", region: "Europe", coordinates: [-3.4, 55.4] },
  IN: { iso: "IN", name: "India", flag: "\ud83c\uddee\ud83c\uddf3", region: "Asia Pacific", coordinates: [78.9, 20.6] },
  JP: { iso: "JP", name: "Japan", flag: "\ud83c\uddef\ud83c\uddf5", region: "Asia Pacific", coordinates: [138.3, 36.2] },
  KR: { iso: "KR", name: "South Korea", flag: "\ud83c\uddf0\ud83c\uddf7", region: "Asia Pacific", coordinates: [127.8, 35.9] },
  DE: { iso: "DE", name: "Germany", flag: "\ud83c\udde9\ud83c\uddea", region: "Europe", coordinates: [10.5, 51.2] },
  FR: { iso: "FR", name: "France", flag: "\ud83c\uddeb\ud83c\uddf7", region: "Europe", coordinates: [2.2, 46.2] },
  IT: { iso: "IT", name: "Italy", flag: "\ud83c\uddee\ud83c\uddf9", region: "Europe", coordinates: [12.6, 41.9] },
  ES: { iso: "ES", name: "Spain", flag: "\ud83c\uddea\ud83c\uddf8", region: "Europe", coordinates: [-3.7, 40.5] },
  AU: { iso: "AU", name: "Australia", flag: "\ud83c\udde6\ud83c\uddfa", region: "Asia Pacific", coordinates: [133.8, -25.3] },
  ID: { iso: "ID", name: "Indonesia", flag: "\ud83c\uddee\ud83c\udde9", region: "Asia Pacific", coordinates: [113.9, -0.8] },
  TH: { iso: "TH", name: "Thailand", flag: "\ud83c\uddf9\ud83c\udded", region: "Asia Pacific", coordinates: [100.9, 15.9] },
  SG: { iso: "SG", name: "Singapore", flag: "\ud83c\uddf8\ud83c\uddec", region: "Asia Pacific", coordinates: [103.8, 1.4] },
  EG: { iso: "EG", name: "Egypt", flag: "\ud83c\uddea\ud83c\uddec", region: "Africa", coordinates: [30.8, 26.8] },
  VE: { iso: "VE", name: "Venezuela", flag: "\ud83c\uddfb\ud83c\uddea", region: "South America", coordinates: [-66.6, 6.4] },
  CO: { iso: "CO", name: "Colombia", flag: "\ud83c\udde8\ud83c\uddf4", region: "South America", coordinates: [-74.3, 4.6] },
  EC: { iso: "EC", name: "Ecuador", flag: "\ud83c\uddea\ud83c\udde8", region: "South America", coordinates: [-78.2, -1.8] },
  QA: { iso: "QA", name: "Qatar", flag: "\ud83c\uddf6\ud83c\udde6", region: "Middle East", coordinates: [51.2, 25.4] },
  OM: { iso: "OM", name: "Oman", flag: "\ud83c\uddf4\ud83c\uddf2", region: "Middle East", coordinates: [55.9, 21.5] },
  MY: { iso: "MY", name: "Malaysia", flag: "\ud83c\uddf2\ud83c\uddfe", region: "Asia Pacific", coordinates: [101.7, 4.2] },
  ZA: { iso: "ZA", name: "South Africa", flag: "\ud83c\uddff\ud83c\udde6", region: "Africa", coordinates: [22.9, -30.6] },
  TR: { iso: "TR", name: "Turkey", flag: "\ud83c\uddf9\ud83c\uddf7", region: "Europe", coordinates: [35.2, 38.9] },
  PL: { iso: "PL", name: "Poland", flag: "\ud83c\uddf5\ud83c\uddf1", region: "Europe", coordinates: [19.1, 51.9] },
  NL: { iso: "NL", name: "Netherlands", flag: "\ud83c\uddf3\ud83c\uddf1", region: "Europe", coordinates: [5.3, 52.1] },
  PK: { iso: "PK", name: "Pakistan", flag: "\ud83c\uddf5\ud83c\uddf0", region: "Asia Pacific", coordinates: [69.3, 30.4] },
};

/** Get country by ISO code */
export function getCountry(iso: string): CountryMeta | undefined {
  return COUNTRIES[iso.toUpperCase()];
}

/** Get country name with fallback */
export function getCountryName(iso: string): string {
  return COUNTRIES[iso.toUpperCase()]?.name ?? iso;
}

/** Format large numbers with commas and K/M/B suffixes */
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "N/A";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/** Format price to 2 decimal places with $ */
export function formatPrice(n: number | null | undefined): string {
  if (n == null) return "N/A";
  return `$${n.toFixed(2)}`;
}

/** Format percentage */
export function formatPct(n: number | null | undefined): string {
  if (n == null) return "N/A";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}
