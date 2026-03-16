import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 900; // 15 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.toUpperCase();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  try {
    let headlinesQuery = supabase
      .from("news_headlines")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(limit);

    let alertsQuery = supabase
      .from("news_alerts")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(10);

    if (country) {
      headlinesQuery = headlinesQuery.contains("countries", [country]);
      alertsQuery = alertsQuery.contains("countries", [country]);
    }

    const [headlinesRes, alertsRes] = await Promise.all([
      headlinesQuery,
      alertsQuery,
    ]);

    return NextResponse.json({
      data: {
        headlines: headlinesRes.data ?? [],
        alerts: alertsRes.data ?? [],
      },
      updated_at: new Date().toISOString(),
      source: "supabase",
    });
  } catch (error) {
    console.error("[API:news] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
