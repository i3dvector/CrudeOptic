/**
 * ETL: Live Oil Prices
 * Fetches WTI (CL=F) and Brent (BZ=F) directly from Yahoo Finance API
 * Writes to Supabase `live_prices` and `price_history` tables
 * Schedule: Every 15 minutes via GitHub Actions
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface YahooQuote {
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

async function fetchYahooQuote(symbol: string): Promise<YahooQuote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; CrudeOptic/1.0)",
    },
  });

  if (!res.ok) throw new Error(`Yahoo Finance ${res.status} for ${symbol}`);

  const json = await res.json() as {
    chart: {
      result: Array<{
        meta: {
          regularMarketPrice: number;
          chartPreviousClose: number;
        };
      }>;
      error?: unknown;
    };
  };

  if (json.chart.error) throw new Error(`Yahoo Finance error: ${JSON.stringify(json.chart.error)}`);

  const meta = json.chart.result?.[0]?.meta;
  if (!meta) throw new Error(`No data for ${symbol}`);

  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose;
  const change = price - prev;
  const changePercent = (change / prev) * 100;

  return { regularMarketPrice: price, regularMarketChange: change, regularMarketChangePercent: changePercent };
}

async function main() {
  console.log("[ETL:prices] Fetching WTI (CL=F) and Brent (BZ=F)...");

  const [wti, brent] = await Promise.all([
    fetchYahooQuote("CL=F"),
    fetchYahooQuote("BZ=F"),
  ]);

  const now = new Date().toISOString();

  const rows = [
    {
      benchmark: "WTI",
      price: wti.regularMarketPrice,
      change: wti.regularMarketChange,
      change_percent: wti.regularMarketChangePercent,
      updated_at: now,
    },
    {
      benchmark: "BRENT",
      price: brent.regularMarketPrice,
      change: brent.regularMarketChange,
      change_percent: brent.regularMarketChangePercent,
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

  console.log(`[ETL:prices] WTI=$${wti.regularMarketPrice.toFixed(2)}, Brent=$${brent.regularMarketPrice.toFixed(2)}`);

  // Append to price_history
  const historyRows = rows.map((r) => ({
    date: now.split("T")[0],
    benchmark: r.benchmark,
    price: r.price,
  }));

  const { error: histErr } = await supabase
    .from("price_history")
    .upsert(historyRows, { onConflict: "date,benchmark" });

  if (histErr) console.error("[ETL:prices] price_history error:", histErr);

  console.log("[ETL:prices] Done.");
}

main().catch((err) => {
  console.error("[ETL:prices] Fatal:", err);
  process.exit(1);
});
