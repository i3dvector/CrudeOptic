import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const [consumptionRes, reservesRes] = await Promise.all([
      supabase.from("consumption_by_type").select("iso, total_thousand_bpd").order("year", { ascending: false }),
      supabase.from("reserves").select("iso, proven_reserves_bbl"),
    ]);

    const consumption: Record<string, number> = {};
    for (const row of consumptionRes.data ?? []) {
      if (row.iso && row.total_thousand_bpd && !consumption[row.iso]) {
        consumption[row.iso] = row.total_thousand_bpd;
      }
    }

    const reserves: Record<string, number> = {};
    for (const row of reservesRes.data ?? []) {
      if (row.iso && row.proven_reserves_bbl && !reserves[row.iso]) {
        reserves[row.iso] = row.proven_reserves_bbl / 1_000_000_000; // Convert to billions
      }
    }

    return NextResponse.json({
      data: { consumption, reserves },
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API:map-data] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch map data" },
      { status: 500 }
    );
  }
}
