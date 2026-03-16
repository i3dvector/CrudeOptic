/**
 * ETL: Live Oil Prices
 * Fetches WTI and Brent crude prices from yahoo-finance2
 * Writes to Supabase `live_prices` table
 * Schedule: Every 15 minutes via GitHub Actions
 */
import { createClient } from "@supabase/supabase-js";
import yahooFinance from "yahoo-finance2";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface QuoteResult {
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
}

async function fetchPrice(symbol: string): Promise<QuoteResult> {
  const result = await yahooFinance.quote(symbol);
  return {
    regularMarketPrice: result.regularMarketPrice,
    regularMarketChange: result.regularMarketChange,
    regularMarketChangePercent: result.regularMarketChangePercent,
  };
}

async function main() {
  console.log("[ETL:prices] Fetching WTI and Brent prices...");

  const [wti, brent] = await Promise.all([
    fetchPrice("CL=F"),
    fetchPrice("BZ=F"),
  ]);

  const now = new Date().toISOString();

  const rows = [
    {
      benchmark: "WTI",
      price: wti.regularMarketPrice ?? 0,
      change: wti.regularMarketChange ?? 0,
      change_percent: wti.regularMarketChangePercent ?? 0,
      updated_at: now,
    },
    {
      benchmark: "BRENT",
      price: brent.regularMarketPrice ?? 0,
      change: brent.regularMarketChange ?? 0,
      change_percent: brent.regularMarketChangePercent ?? 0,
      updated_at: now,
    },
  ];

  const { error } = await supabase
    .from("live_prices")
    .upsert(rows, { onConflict: "benchmark" });

  if (error) {
    console.error("[ETL:prices] Supabase upsert error:", error);
    process.exit(1);
  }

  console.log(`[ETL:prices] Updated WTI=$${wti.regularMarketPrice}, Brent=$${brent.regularMarketPrice}`);

  // Also append to price_history for historical charts
  const historyRows = rows.map((r) => ({
    date: now.split("T")[0],
    benchmark: r.benchmark,
    price: r.price,
  }));

  const { error: histErr } = await supabase
    .from("price_history")
    .upsert(historyRows, { onConflict: "date,benchmark" });

  if (histErr) {
    console.error("[ETL:prices] price_history upsert error:", histErr);
  }

  console.log("[ETL:prices] Done.");
}

main().catch((err) => {
  console.error("[ETL:prices] Fatal:", err);
  process.exit(1);
});
