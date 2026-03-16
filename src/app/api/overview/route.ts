import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const [
      pricesRes,
      productionRes,
      newsRes,
      alertsRes,
    ] = await Promise.all([
      supabase.from("live_prices").select("*"),
      supabase
        .from("country_production")
        .select("*")
        .order("year", { ascending: false })
        .limit(200),
      supabase
        .from("news_headlines")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(10),
      supabase
        .from("news_alerts")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(5),
    ]);

    // Get latest year's production data
    const productionData = productionRes.data ?? [];
    const latestYear = productionData[0]?.year ?? new Date().getFullYear() - 1;
    const latestProduction = productionData.filter((d) => d.year === latestYear);

    // Sort by production_bpd descending
    const sorted = [...latestProduction].sort(
      (a, b) => (b.production_bpd ?? 0) - (a.production_bpd ?? 0)
    );

    const topProducers = sorted.slice(0, 10).map((d, i) => ({
      iso: d.iso,
      name: d.iso,
      production_bpd: d.production_bpd,
      consumption_bpd: null,
      net_imports_bpd: null,
      reserves_days: null,
      rank_producer: i + 1,
      rank_consumer: null,
    }));

    const globalProduction = latestProduction.reduce(
      (sum, d) => sum + (d.production_bpd ?? 0),
      0
    );

    return NextResponse.json({
      data: {
        top_producers: topProducers,
        top_consumers: [],
        top_importers: [],
        top_exporters: [],
        live_prices: pricesRes.data ?? [],
        latest_news: newsRes.data ?? [],
        active_alerts: alertsRes.data ?? [],
        global_production_bpd: globalProduction,
        global_consumption_bpd: 0,
      },
      updated_at: new Date().toISOString(),
      source: "supabase",
    });
  } catch (error) {
    console.error("[API:overview] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch overview data" },
      { status: 500 }
    );
  }
}
