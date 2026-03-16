/**
 * ETL: FRED API — Historical Price Series
 * Fetches WTI (DCOILWTICO) and Brent (DCOILBRENTEU) daily prices
 * Writes to Supabase `price_history` table
 * Schedule: Daily via GitHub Actions
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FRED_API_KEY = process.env.FRED_API_KEY!;
const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

interface FREDResponse {
  observations: Array<{
    date: string;
    value: string;
  }>;
}

async function fetchFRED(seriesId: string, limit: number = 365): Promise<FREDResponse> {
  const url = new URL(FRED_BASE);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", FRED_API_KEY);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("limit", limit.toString());

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`FRED API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log("[ETL:fred] Fetching FRED historical prices...");

  const [wtiData, brentData] = await Promise.all([
    fetchFRED("DCOILWTICO", 365),
    fetchFRED("DCOILBRENTEU", 365),
  ]);

  const wtiRows = wtiData.observations
    .filter((o) => o.value !== ".")
    .map((o) => ({
      date: o.date,
      benchmark: "WTI",
      price: parseFloat(o.value),
    }));

  const brentRows = brentData.observations
    .filter((o) => o.value !== ".")
    .map((o) => ({
      date: o.date,
      benchmark: "BRENT",
      price: parseFloat(o.value),
    }));

  const allRows = [...wtiRows, ...brentRows];

  if (allRows.length > 0) {
    // Upsert in batches of 500
    for (let i = 0; i < allRows.length; i += 500) {
      const batch = allRows.slice(i, i + 500);
      const { error } = await supabase
        .from("price_history")
        .upsert(batch, { onConflict: "date,benchmark" });

      if (error) {
        console.error(`[ETL:fred] Batch ${i} upsert error:`, error);
      }
    }

    console.log(`[ETL:fred] Upserted ${allRows.length} price history records`);
  }

  console.log("[ETL:fred] Done.");
}

main().catch((err) => {
  console.error("[ETL:fred] Fatal:", err);
  process.exit(1);
});
