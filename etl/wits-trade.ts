/**
 * ETL: World Bank WITS — Bilateral Fuel Trade Flows
 * Fetches fuel (HS chapter 27) import/export data between countries
 * Writes to Supabase `trade_flows` table
 * Schedule: Weekly via GitHub Actions (data updates infrequently)
 *
 * WITS API is free, no API key required.
 * Product: "fuels" = entire HS chapter 27 (crude + refined + gas + coal)
 * This is broader than HS 2709 (crude only) but is the best available for free.
 */
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WITS_BASE = "https://wits.worldbank.org/API/V1/SDMX/V21/datasource/tradestats-trade";

/** Countries to query as reporters (major importers + exporters) */
const REPORTERS: { iso2: string; iso3: string }[] = [
  // Major importers
  { iso2: "US", iso3: "usa" }, { iso2: "CN", iso3: "chn" },
  { iso2: "IN", iso3: "ind" }, { iso2: "JP", iso3: "jpn" },
  { iso2: "KR", iso3: "kor" }, { iso2: "DE", iso3: "deu" },
  { iso2: "FR", iso3: "fra" }, { iso2: "IT", iso3: "ita" },
  { iso2: "ES", iso3: "esp" }, { iso2: "GB", iso3: "gbr" },
  { iso2: "NL", iso3: "nld" }, { iso2: "TR", iso3: "tur" },
  { iso2: "TH", iso3: "tha" }, { iso2: "AU", iso3: "aus" },
  { iso2: "ID", iso3: "idn" }, { iso2: "PK", iso3: "pak" },
  { iso2: "EG", iso3: "egy" }, { iso2: "ZA", iso3: "zaf" },
  { iso2: "PL", iso3: "pol" }, { iso2: "BR", iso3: "bra" },
  // Major exporters
  { iso2: "SA", iso3: "sau" }, { iso2: "RU", iso3: "rus" },
  { iso2: "IQ", iso3: "irq" }, { iso2: "AE", iso3: "are" },
  { iso2: "KW", iso3: "kwt" }, { iso2: "NG", iso3: "nga" },
  { iso2: "AO", iso3: "ago" }, { iso2: "CA", iso3: "can" },
  { iso2: "MX", iso3: "mex" }, { iso2: "NO", iso3: "nor" },
  { iso2: "KZ", iso3: "kaz" }, { iso2: "DZ", iso3: "dza" },
  { iso2: "MY", iso3: "mys" }, { iso2: "CO", iso3: "col" },
  { iso2: "EC", iso3: "ecu" }, { iso2: "QA", iso3: "qat" },
  { iso2: "OM", iso3: "omn" }, { iso2: "IR", iso3: "irn" },
  { iso2: "LY", iso3: "lby" }, { iso2: "VE", iso3: "ven" },
  { iso2: "SG", iso3: "sgp" },
];

/** ISO3 → ISO2 mapping for partner resolution */
const ISO3_TO_ISO2: Record<string, string> = {
  USA: "US", CHN: "CN", IND: "IN", JPN: "JP", KOR: "KR",
  DEU: "DE", FRA: "FR", ITA: "IT", ESP: "ES", GBR: "GB",
  NLD: "NL", TUR: "TR", THA: "TH", AUS: "AU", IDN: "ID",
  PAK: "PK", EGY: "EG", ZAF: "ZA", POL: "PL", BRA: "BR",
  SAU: "SA", RUS: "RU", IRQ: "IQ", ARE: "AE", KWT: "KW",
  NGA: "NG", AGO: "AO", CAN: "CA", MEX: "MX", NOR: "NO",
  KAZ: "KZ", DZA: "DZ", MYS: "MY", COL: "CO", ECU: "EC",
  QAT: "QA", OMN: "OM", IRN: "IR", LBY: "LY", VEN: "VE",
  SGP: "SG", TWN: "TW", PHL: "PH", VNM: "VN", BGD: "BD",
  LKA: "LK", MMR: "MM", CHL: "CL", PER: "PE", ARG: "AR",
  URY: "UY", PRY: "PY", BOL: "BO", GUY: "GY", SUR: "SR",
  BEL: "BE", LUX: "LU", CHE: "CH", AUT: "AT", SWE: "SE",
  DNK: "DK", FIN: "FI", IRL: "IE", PRT: "PT", GRC: "GR",
  CZE: "CZ", HUN: "HU", ROU: "RO", BGR: "BG", HRV: "HR",
  SVK: "SK", SVN: "SI", LTU: "LT", LVA: "LV", EST: "EE",
  UKR: "UA", BLR: "BY", GEO: "GE", AZE: "AZ", ARM: "AM",
  UZB: "UZ", TKM: "TM", TJK: "TJ", KGZ: "KG",
  ISR: "IL", JOR: "JO", LBN: "LB", BHR: "BH", YEM: "YE",
  SYR: "SY", SDN: "SD", TUN: "TN", MAR: "MA",
  KEN: "KE", TZA: "TZ", ETH: "ET", GHA: "GH", CMR: "CM",
  CIV: "CI", SEN: "SN", MOZ: "MZ", MDG: "MG", COD: "CD",
  GAB: "GA", COG: "CG", TCD: "TD", GNQ: "GQ", NER: "NE",
  BEN: "BJ", TGO: "TG", MLI: "ML", BFA: "BF",
  NZL: "NZ", PNG: "PG", BRN: "BN", FJI: "FJ",
  CUB: "CU", DOM: "DO", JAM: "JM", TTO: "TT",
  GTM: "GT", SLV: "SV", HND: "HN", NIC: "NI", CRI: "CR", PAN: "PA",
  SRB: "RS", BIH: "BA", MKD: "MK", ALB: "AL", MNE: "ME",
  MNG: "MN", NPL: "NP", BTN: "BT",
};

interface TradeRecord {
  source_iso: string;
  target_iso: string;
  value_usd: number;
  volume_bpd: number;
  year: number;
  hs_code: string;
}

/**
 * Parse SDMX XML from WITS and extract bilateral trade data
 */
function parseWitsXml(xml: string, reporterIso2: string, flow: "import" | "export"): TradeRecord[] {
  const records: TradeRecord[] = [];
  const $ = cheerio.load(xml, { xmlMode: true });

  // SDMX structure: <Series PARTNER="XXX"> containing <Obs OBS_VALUE="...">
  $("Series").each((_, series) => {
    const partnerIso3 = $(series).attr("PARTNER") ?? "";
    const partnerIso2 = ISO3_TO_ISO2[partnerIso3.toUpperCase()];

    // Skip regional aggregates (EAS, SAS, WLD, etc.) and unmapped partners
    if (!partnerIso2) return;
    // Skip self-trade
    if (partnerIso2 === reporterIso2) return;

    $(series).find("Obs").each((_, obs) => {
      const valueStr = $(obs).attr("OBS_VALUE") ?? "0";
      const yearStr = $(obs).attr("TIME_PERIOD") ?? "";
      const value = parseFloat(valueStr);
      const year = parseInt(yearStr, 10);

      if (isNaN(value) || value <= 0 || isNaN(year)) return;

      // value is in thousands of USD from WITS
      const valueUsd = Math.round(value * 1000);

      // Rough estimate: convert USD value to bpd
      // Average crude price ~$75/bbl, 365 days/year
      // This is approximate — actual volumes would need quantity data
      const estimatedBpd = Math.round(valueUsd / 75 / 365);

      if (flow === "import") {
        records.push({
          source_iso: partnerIso2,   // partner is the exporter (source)
          target_iso: reporterIso2,   // reporter is the importer (target)
          value_usd: valueUsd,
          volume_bpd: estimatedBpd,
          year,
          hs_code: "27",  // HS chapter 27 (fuels)
        });
      } else {
        records.push({
          source_iso: reporterIso2,   // reporter is the exporter (source)
          target_iso: partnerIso2,    // partner is the importer (target)
          value_usd: valueUsd,
          volume_bpd: estimatedBpd,
          year,
          hs_code: "27",
        });
      }
    });
  });

  return records;
}

async function fetchWits(
  iso3: string,
  year: number,
  indicator: string
): Promise<string | null> {
  const url = `${WITS_BASE}/reporter/${iso3}/year/${year}/partner/all/product/fuels/indicator/${indicator}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/xml" },
    });

    if (!res.ok) {
      console.warn(`[ETL:wits] ${iso3} ${indicator} returned ${res.status}`);
      return null;
    }

    return await res.text();
  } catch (err) {
    console.warn(`[ETL:wits] Fetch failed for ${iso3}:`, err);
    return null;
  }
}

async function main() {
  console.log("[ETL:wits] Fetching bilateral fuel trade flows...");

  const currentYear = new Date().getFullYear();
  // WITS data lags — try years from most recent backwards until data is found
  const yearsToTry = [currentYear - 2, currentYear - 3, currentYear - 4];

  const allRecords: TradeRecord[] = [];
  let successCount = 0;
  let dataYear = 0;

  // Probe with first reporter to find the latest available year
  for (const year of yearsToTry) {
    const probeXml = await fetchWits(REPORTERS[0].iso3, year, "MPRT-TRD-VL");
    if (probeXml) {
      dataYear = year;
      const probeRecords = parseWitsXml(probeXml, REPORTERS[0].iso2, "import");
      allRecords.push(...probeRecords);
      console.log(`[ETL:wits] Found data for year ${year} (${REPORTERS[0].iso2} imports: ${probeRecords.length} partners)`);
      successCount++;
      break;
    }
    console.log(`[ETL:wits] No data for year ${year}, trying older...`);
  }

  if (dataYear === 0) {
    console.error("[ETL:wits] No data found for any recent year — aborting");
    return;
  }

  // Fetch exports for first reporter
  const firstExportsXml = await fetchWits(REPORTERS[0].iso3, dataYear, "XPRT-TRD-VL");
  if (firstExportsXml) {
    const exportRecords = parseWitsXml(firstExportsXml, REPORTERS[0].iso2, "export");
    allRecords.push(...exportRecords);
    console.log(`[ETL:wits] ${REPORTERS[0].iso2} exports: ${exportRecords.length} partners`);
    successCount++;
  }
  await new Promise((r) => setTimeout(r, 500));

  // Fetch remaining reporters
  for (const reporter of REPORTERS.slice(1)) {
    // Fetch imports
    const importsXml = await fetchWits(reporter.iso3, dataYear, "MPRT-TRD-VL");
    if (importsXml) {
      const importRecords = parseWitsXml(importsXml, reporter.iso2, "import");
      allRecords.push(...importRecords);
      console.log(`[ETL:wits] ${reporter.iso2} imports: ${importRecords.length} partners`);
      successCount++;
    }

    // Fetch exports
    const exportsXml = await fetchWits(reporter.iso3, dataYear, "XPRT-TRD-VL");
    if (exportsXml) {
      const exportRecords = parseWitsXml(exportsXml, reporter.iso2, "export");
      allRecords.push(...exportRecords);
      console.log(`[ETL:wits] ${reporter.iso2} exports: ${exportRecords.length} partners`);
      successCount++;
    }

    // Rate limiting: 500ms between requests to be polite
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`[ETL:wits] Fetched ${successCount} successful responses, ${allRecords.length} total records`);

  // Deduplicate: keep the record with the higher value for each pair
  // (since both reporter and partner may report the same flow)
  const deduped = new Map<string, TradeRecord>();
  for (const rec of allRecords) {
    const key = `${rec.source_iso}-${rec.target_iso}-${rec.year}`;
    const existing = deduped.get(key);
    if (!existing || rec.value_usd > existing.value_usd) {
      deduped.set(key, rec);
    }
  }

  const rows = Array.from(deduped.values()).map((r) => ({
    ...r,
    updated_at: new Date().toISOString(),
  }));

  if (rows.length > 0) {
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error } = await supabase
        .from("trade_flows")
        .upsert(batch, { onConflict: "source_iso,target_iso,year,hs_code" });

      if (error) console.error(`[ETL:wits] Batch ${i} error:`, error.message);
    }
    console.log(`[ETL:wits] Upserted ${rows.length} deduplicated trade flow records for ${dataYear}`);
  } else {
    console.warn("[ETL:wits] No records to upsert");
  }

  console.log("[ETL:wits] Done.");
}

main().catch((err) => {
  console.error("[ETL:wits] Fatal:", err);
  process.exit(1);
});
