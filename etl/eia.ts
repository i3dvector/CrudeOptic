/**
 * ETL: EIA Open Data
 * Fetches crude oil production by country
 * Writes to Supabase `country_production`
 * Schedule: Daily via GitHub Actions
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EIA_API_KEY = process.env.EIA_API_KEY!;
const EIA_BASE = "https://api.eia.gov/v2";

interface EIARecord {
  period: string;
  value: string | number;
  unit?: string;
  countryRegionName?: string;
}

interface EIAResponse {
  response: { data: EIARecord[] };
}

async function fetchEIA(params: Record<string, string>): Promise<EIAResponse> {
  const url = new URL(`${EIA_BASE}/international/data`);
  url.searchParams.set("api_key", EIA_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`EIA API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<EIAResponse>;
}

/** EIA countryRegionName → ISO2 */
const EIA_COUNTRY_MAP: Record<string, string> = {
  "United States": "US",
  "Saudi Arabia": "SA",
  "Russia": "RU",
  "Canada": "CA",
  "Iraq": "IQ",
  "China": "CN",
  "United Arab Emirates": "AE",
  "Brazil": "BR",
  "Iran": "IR",
  "Kuwait": "KW",
  "Mexico": "MX",
  "Norway": "NO",
  "Kazakhstan": "KZ",
  "Nigeria": "NG",
  "Libya": "LY",
  "Angola": "AO",
  "Algeria": "DZ",
  "United Kingdom": "GB",
  "India": "IN",
  "Japan": "JP",
  "South Korea": "KR",
  "Germany": "DE",
  "France": "FR",
  "Italy": "IT",
  "Spain": "ES",
  "Indonesia": "ID",
  "Colombia": "CO",
  "Ecuador": "EC",
  "Venezuela": "VE",
  "Oman": "OM",
  "Qatar": "QA",
  "Egypt": "EG",
  "Thailand": "TH",
  "Australia": "AU",
  "Malaysia": "MY",
  "Pakistan": "PK",
  "Singapore": "SG",
  "South Africa": "ZA",
  "Turkey": "TR",
  "Netherlands": "NL",
  "Poland": "PL",
};

async function fetchProduction() {
  console.log("[ETL:eia] Fetching global crude oil production (TBPD)...");

  const data = await fetchEIA({
    "frequency": "annual",
    "data[0]": "value",
    "facets[productId][]": "57",   // Crude oil including lease condensate
    "facets[activityId][]": "1",   // Production
    "facets[unit][]": "TBPD",      // Thousand barrels per day
    "sort[0][column]": "period",
    "sort[0][direction]": "desc",
    "length": "2000",
  });

  // Deduplicate by (iso, year) — keep highest value per pair
  const seen = new Map<string, { iso: string; year: number; production_bpd: number; source: string; updated_at: string }>();

  for (const d of data.response.data) {
    const iso = EIA_COUNTRY_MAP[d.countryRegionName ?? ""];
    const val = parseFloat(String(d.value));
    if (!iso || isNaN(val) || val <= 0) continue;

    const year = parseInt(d.period);
    const key = `${iso}:${year}`;
    const bpd = Math.round(val * 1000);

    const existing = seen.get(key);
    if (!existing || bpd > existing.production_bpd) {
      seen.set(key, { iso, year, production_bpd: bpd, source: "EIA", updated_at: new Date().toISOString() });
    }
  }

  const rows = Array.from(seen.values());

  if (rows.length === 0) {
    console.warn("[ETL:eia] No production rows matched — check API response");
    return;
  }

  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabase
      .from("country_production")
      .upsert(batch, { onConflict: "iso,year" });
    if (error) console.error(`[ETL:eia] Batch ${i} upsert error:`, error.message);
  }

  console.log(`[ETL:eia] Upserted ${rows.length} production records (${seen.size} unique iso/year pairs)`);
}

async function main() {
  console.log("[ETL:eia] Starting EIA data refresh...");
  await fetchProduction();
  console.log("[ETL:eia] Done.");
}

main().catch((err) => {
  console.error("[ETL:eia] Fatal:", err);
  process.exit(1);
});
