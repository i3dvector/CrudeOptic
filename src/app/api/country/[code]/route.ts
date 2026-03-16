import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 3600; // 1 hour

export async function GET(
  _request: Request,
  { params }: { params: { code: string } }
) {
  const iso = params.code.toUpperCase();

  try {
    const [
      productionRes,
      consumptionRes,
      reservesRes,
      pumpRes,
      refineryRes,
      importsRes,
      exportsRes,
      priceHistoryRes,
    ] = await Promise.all([
      supabase
        .from("country_production")
        .select("*")
        .eq("iso", iso)
        .order("year", { ascending: false })
        .limit(10),
      supabase
        .from("consumption_by_type")
        .select("*")
        .eq("iso", iso)
        .order("year", { ascending: false })
        .limit(1),
      supabase
        .from("reserves")
        .select("*")
        .eq("iso", iso)
        .order("year", { ascending: false })
        .limit(1),
      supabase
        .from("pump_prices")
        .select("*")
        .eq("iso", iso)
        .limit(1),
      supabase
        .from("refinery_capacity")
        .select("*")
        .eq("iso", iso)
        .order("year", { ascending: false })
        .limit(1),
      supabase
        .from("trade_flows")
        .select("*")
        .eq("target_iso", iso)
        .order("value_usd", { ascending: false })
        .limit(10),
      supabase
        .from("trade_flows")
        .select("*")
        .eq("source_iso", iso)
        .order("value_usd", { ascending: false })
        .limit(10),
      supabase
        .from("price_history")
        .select("*")
        .order("date", { ascending: true })
        .limit(365),
    ]);

    const latestProduction = productionRes.data?.[0];
    const latestReserves = reservesRes.data?.[0];

    // Calculate reserves in days
    const reservesDays =
      latestProduction?.production_bpd && latestReserves?.proven_reserves_bbl
        ? Math.round(
            latestReserves.proven_reserves_bbl / latestProduction.production_bpd
          )
        : null;

    return NextResponse.json({
      data: {
        summary: {
          iso,
          name: iso,
          production_bpd: latestProduction?.production_bpd ?? null,
          consumption_bpd: null,
          net_imports_bpd: null,
          reserves_days: reservesDays,
          rank_producer: null,
          rank_consumer: null,
        },
        consumption: consumptionRes.data?.[0] ?? null,
        imports: importsRes.data ?? [],
        exports: exportsRes.data ?? [],
        geopolitics: null, // loaded client-side from static JSON
        pump_price: pumpRes.data?.[0] ?? null,
        refinery: refineryRes.data?.[0] ?? null,
        production_history: (productionRes.data ?? []).map((d) => ({
          year: d.year,
          value: d.production_bpd,
        })),
        price_history: priceHistoryRes.data ?? [],
      },
      updated_at: new Date().toISOString(),
      source: "supabase",
    });
  } catch (error) {
    console.error(`[API:country/${iso}] Error:`, error);
    return NextResponse.json(
      { error: `Failed to fetch data for ${iso}` },
      { status: 500 }
    );
  }
}
