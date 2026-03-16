/**
 * ETL: UN Comtrade — Bilateral Trade Flows
 * Fetches crude oil (HS 2709) import/export data between countries
 * Writes to Supabase `trade_flows` table
 * Schedule: Daily via GitHub Actions
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COMTRADE_BASE = "https://comtradeapi.un.org/data/v1/get/C/A";

/** Top oil-trading countries to query */
const REPORTER_ISOS = [
  "US", "CN", "IN", "JP", "KR", "DE", "FR", "IT", "ES", "GB",
  "NL", "TR", "TH", "AU", "ID", "PK", "EG", "ZA", "PL", "BR",
];

/** ISO2 → UN M49 numeric code mapping */
const ISO_TO_M49: Record<string, string> = {
  US: "842", CN: "156", IN: "356", JP: "392", KR: "410",
  DE: "276", FR: "250", IT: "380", ES: "724", GB: "826",
  NL: "528", TR: "792", TH: "764", AU: "036", ID: "360",
  PK: "586", EG: "818", ZA: "710", PL: "616", BR: "076",
  SA: "682", RU: "643", IQ: "368", IR: "364", KW: "414",
  AE: "784", NG: "566", AO: "024", CA: "124", MX: "484",
  NO: "578", KZ: "398", LY: "434", DZ: "012", VE: "862",
  CO: "170", EC: "218", QA: "634", OM: "512", MY: "458",
};

const M49_TO_ISO: Record<string, string> = Object.fromEntries(
  Object.entries(ISO_TO_M49).map(([k, v]) => [v, k])
);

interface ComtradeRecord {
  reporterCode: number;
  partnerCode: number;
  primaryValue: number;
  netWgt?: number;
  qty?: number;
  period: number;
}

async function fetchComtrade(reporterM49: string, year: number): Promise<ComtradeRecord[]> {
  const subscriptionKey = process.env.COMTRADE_API_KEY;
  const url = new URL(COMTRADE_BASE);
  url.searchParams.set("reporterCode", reporterM49);
  url.searchParams.set("period", year.toString());
  url.searchParams.set("cmdCode", "2709");
  url.searchParams.set("flowCode", "M");
  url.searchParams.set("partnerCode", "");

  const headers: Record<string, string> = {};
  if (subscriptionKey) {
    headers["Ocp-Apim-Subscription-Key"] = subscriptionKey;
  }

  try {
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      console.warn(`[ETL:comtrade] ${reporterM49} returned ${res.status}`);
      return [];
    }
    const json = await res.json();
    return json.data ?? [];
  } catch (err) {
    console.warn(`[ETL:comtrade] Fetch failed for ${reporterM49}:`, err);
    return [];
  }
}

async function main() {
  console.log("[ETL:comtrade] Fetching bilateral trade flows...");

  const currentYear = new Date().getFullYear();
  const queryYear = currentYear - 1; // Comtrade data lags ~1 year

  const allRows: Array<{
    source_iso: string;
    target_iso: string;
    volume_bpd: number;
    value_usd: number;
    year: number;
    hs_code: string;
    updated_at: string;
  }> = [];

  // Fetch sequentially to respect rate limits (500/day free tier)
  for (const iso of REPORTER_ISOS) {
    const m49 = ISO_TO_M49[iso];
    if (!m49) continue;

    const records = await fetchComtrade(m49, queryYear);

    for (const rec of records) {
      const partnerIso = M49_TO_ISO[rec.partnerCode.toString()];
      if (!partnerIso) continue;

      // Convert net weight (kg) to approximate barrels per day
      // 1 barrel ≈ 136 kg, 365 days/year
      const kgPerYear = rec.netWgt ?? 0;
      const bpd = Math.round(kgPerYear / 136 / 365);

      allRows.push({
        source_iso: partnerIso,
        target_iso: iso,
        volume_bpd: bpd,
        value_usd: rec.primaryValue ?? 0,
        year: queryYear,
        hs_code: "2709",
        updated_at: new Date().toISOString(),
      });
    }

    // Rate limiting: 100ms between requests
    await new Promise((r) => setTimeout(r, 100));
  }

  if (allRows.length > 0) {
    for (let i = 0; i < allRows.length; i += 500) {
      const batch = allRows.slice(i, i + 500);
      const { error } = await supabase
        .from("trade_flows")
        .upsert(batch, { onConflict: "source_iso,target_iso,year,hs_code" });

      if (error) console.error(`[ETL:comtrade] Batch ${i} error:`, error);
    }
    console.log(`[ETL:comtrade] Upserted ${allRows.length} trade flow records`);
  }

  console.log("[ETL:comtrade] Done.");
}

main().catch((err) => {
  console.error("[ETL:comtrade] Fatal:", err);
  process.exit(1);
});
