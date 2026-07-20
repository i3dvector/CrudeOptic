import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const [liveRes, historyRes] = await Promise.all([
      supabase.from("live_prices").select("*"),
      supabase
        .from("price_history")
        .select("*")
        .order("date", { ascending: false })
        .limit(730), // newest ~2 years of daily data
    ]);

    // Fetched newest-first for the limit; reverse to chronological for charting.
    const history = (historyRes.data ?? []).slice().reverse();

    return NextResponse.json({
      data: {
        live: liveRes.data ?? [],
        history,
      },
      updated_at: new Date().toISOString(),
      source: "supabase",
    });
  } catch (error) {
    console.error("[API:prices] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
