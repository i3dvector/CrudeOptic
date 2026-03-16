import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 43200; // 12 hours

export async function GET(
  _request: Request,
  { params }: { params: { code: string } }
) {
  const iso = params.code.toUpperCase();

  try {
    const [importsRes, exportsRes] = await Promise.all([
      supabase
        .from("trade_flows")
        .select("*")
        .eq("target_iso", iso)
        .order("value_usd", { ascending: false })
        .limit(20),
      supabase
        .from("trade_flows")
        .select("*")
        .eq("source_iso", iso)
        .order("value_usd", { ascending: false })
        .limit(20),
    ]);

    return NextResponse.json({
      data: {
        imports: importsRes.data ?? [],
        exports: exportsRes.data ?? [],
      },
      updated_at: new Date().toISOString(),
      source: "supabase",
    });
  } catch (error) {
    console.error(`[API:trade/${iso}] Error:`, error);
    return NextResponse.json(
      { error: `Failed to fetch trade data for ${iso}` },
      { status: 500 }
    );
  }
}
