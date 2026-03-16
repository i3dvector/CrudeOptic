/**
 * ETL: EIA Open Data
 * Fetches production, imports, exports, reserves from EIA API
 * Writes to Supabase `country_production`, `trade_flows`, `reserves`
 * Schedule: Daily via GitHub Actions
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EIA_API_KEY = process.env.EIA_API_KEY!;
const EIA_BASE = "https://api.eia.gov/v2";

interface EIAResponse {
  response: {
    data: Array<{
      period: string;
      value: number;
      "area-name"?: string;
      areaName?: string;
    }>;
  };
}

async function fetchEIA(endpoint: string, params: Record<string, string>): Promise<EIAResponse> {
  const url = new URL(`${EIA_BASE}/${endpoint}`);
  url.searchParams.set("api_key", EIA_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`EIA API ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Country name → ISO mapping (EIA uses full names) */
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
};

async function fetchProduction() {
  console.log("[ETL:eia] Fetching global crude production...");

  try {
    const data = await fetchEIA("international/data", {
      "frequency": "annual",
      "data[0]": "value",
      "facets[productId][]": "57",
      "facets[activityId][]": "1",
      "sort[0][column]": "period",
      "sort[0][direction]": "desc",
      "length": "500",
    });

    const rows = data.response.data
      .filter((d) => {
        const name = d["area-name"] || d.areaName || "";
        return EIA_COUNTRY_MAP[name] && d.value > 0;
      })
      .map((d) => {
        const name = d["area-name"] || d.areaName || "";
        return {
          iso: EIA_COUNTRY_MAP[name],
          year: parseInt(d.period),
          production_bpd: Math.round(d.value * 1000),
          source: "EIA",
          updated_at: new Date().toISOString(),
        };
      });

    if (rows.length > 0) {
      const { error } = await supabase
        .from("country_production")
        .upsert(rows, { onConflict: "iso,year" });

      if (error) console.error("[ETL:eia] production upsert error:", error);
      else console.log(`[ETL:eia] Upserted ${rows.length} production records`);
    }
  } catch (err) {
    console.error("[ETL:eia] Production fetch failed:", err);
  }
}

async function fetchReserves() {
  console.log("[ETL:eia] Fetching proven reserves...");

  try {
    const data = await fetchEIA("international/data", {
      "frequency": "annual",
      "data[0]": "value",
      "facets[productId][]": "57",
      "facets[activityId][]": "6",
      "sort[0][column]": "period",
      "sort[0][direction]": "desc",
      "length": "500",
    });

    const rows = data.response.data
      .filter((d) => {
        const name = d["area-name"] || d.areaName || "";
        return EIA_COUNTRY_MAP[name] && d.value > 0;
      })
      .map((d) => {
        const name = d["area-name"] || d.areaName || "";
        return {
          iso: EIA_COUNTRY_MAP[name],
          year: parseInt(d.period),
          proven_reserves_bbl: d.value * 1_000_000_000,
          source: "EIA",
          updated_at: new Date().toISOString(),
        };
      });

    if (rows.length > 0) {
      const { error } = await supabase
        .from("reserves")
        .upsert(rows, { onConflict: "iso,year" });

      if (error) console.error("[ETL:eia] reserves upsert error:", error);
      else console.log(`[ETL:eia] Upserted ${rows.length} reserves records`);
    }
  } catch (err) {
    console.error("[ETL:eia] Reserves fetch failed:", err);
  }
}

async function main() {
  console.log("[ETL:eia] Starting EIA data refresh...");
  await fetchProduction();
  await fetchReserves();
  console.log("[ETL:eia] Done.");
}

main().catch((err) => {
  console.error("[ETL:eia] Fatal:", err);
  process.exit(1);
});
