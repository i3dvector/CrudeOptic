/**
 * ETL: Retail Pump Prices
 * Scrapes GlobalPetrolPrices.com for petrol & diesel prices per country
 * Falls back to World Bank API for uncovered countries
 * Writes to Supabase `pump_prices` table
 * Schedule: Weekly (Monday) via GitHub Actions
 */
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Country name → ISO2 mapping for GlobalPetrolPrices scraper */
const NAME_TO_ISO: Record<string, string> = {
  "United States": "US", "Saudi Arabia": "SA", "Russia": "RU",
  "Canada": "CA", "Iraq": "IQ", "China": "CN",
  "United Arab Emirates": "AE", "Brazil": "BR", "Iran": "IR",
  "Kuwait": "KW", "Mexico": "MX", "Norway": "NO",
  "Nigeria": "NG", "Libya": "LY", "Angola": "AO",
  "Algeria": "DZ", "United Kingdom": "GB", "India": "IN",
  "Japan": "JP", "South Korea": "KR", "Germany": "DE",
  "France": "FR", "Italy": "IT", "Spain": "ES",
  "Australia": "AU", "Indonesia": "ID", "Thailand": "TH",
  "Singapore": "SG", "Egypt": "EG", "Venezuela": "VE",
  "Colombia": "CO", "Ecuador": "EC", "Qatar": "QA",
  "Oman": "OM", "Malaysia": "MY", "South Africa": "ZA",
  "Turkey": "TR", "Poland": "PL", "Netherlands": "NL",
  "Pakistan": "PK", "Kazakhstan": "KZ",
};

async function scrapePetrolPrices(): Promise<Array<{
  iso: string;
  petrol_usd_per_liter: number | null;
  diesel_usd_per_liter: number | null;
}>> {
  const results: Array<{
    iso: string;
    petrol_usd_per_liter: number | null;
    diesel_usd_per_liter: number | null;
  }> = [];

  try {
    // Scrape gasoline prices
    const petrolRes = await fetch("https://www.globalpetrolprices.com/gasoline_prices/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CrudeOptic/1.0; research)",
      },
    });

    if (petrolRes.ok) {
      const html = await petrolRes.text();
      const $ = cheerio.load(html);

      const petrolMap: Record<string, number> = {};

      $("table#graphic tbody tr").each((_, row) => {
        const cells = $(row).find("td");
        const country = $(cells[0]).text().trim();
        const price = parseFloat($(cells[1]).text().trim());

        if (country && !isNaN(price) && NAME_TO_ISO[country]) {
          petrolMap[NAME_TO_ISO[country]] = price;
        }
      });

      // Scrape diesel prices
      const dieselRes = await fetch("https://www.globalpetrolprices.com/diesel_prices/", {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CrudeOptic/1.0; research)",
        },
      });

      const dieselMap: Record<string, number> = {};

      if (dieselRes.ok) {
        const dieselHtml = await dieselRes.text();
        const $d = cheerio.load(dieselHtml);

        $d("table#graphic tbody tr").each((_, row) => {
          const cells = $d(row).find("td");
          const country = $(cells[0]).text().trim();
          const price = parseFloat($(cells[1]).text().trim());

          if (country && !isNaN(price) && NAME_TO_ISO[country]) {
            dieselMap[NAME_TO_ISO[country]] = price;
          }
        });
      }

      // Merge petrol + diesel
      const allIsos = new Set([...Object.keys(petrolMap), ...Object.keys(dieselMap)]);
      for (const iso of allIsos) {
        results.push({
          iso,
          petrol_usd_per_liter: petrolMap[iso] ?? null,
          diesel_usd_per_liter: dieselMap[iso] ?? null,
        });
      }
    }
  } catch (err) {
    console.warn("[ETL:pump] Scraping failed:", err);
  }

  return results;
}

async function fetchWorldBankFallback(): Promise<Array<{
  iso: string;
  petrol_usd_per_liter: number;
}>> {
  const results: Array<{ iso: string; petrol_usd_per_liter: number }> = [];

  try {
    const res = await fetch(
      "https://api.worldbank.org/v2/country/all/indicator/EP.PMP.SGAS.CD?format=json&per_page=300&mrv=1"
    );

    if (res.ok) {
      const [, data] = await res.json();

      for (const item of data ?? []) {
        if (item.value && item.country?.id) {
          results.push({
            iso: item.country.id,
            petrol_usd_per_liter: item.value,
          });
        }
      }
    }
  } catch (err) {
    console.warn("[ETL:pump] World Bank fallback failed:", err);
  }

  return results;
}

async function main() {
  console.log("[ETL:pump] Scraping retail pump prices...");

  const scraped = await scrapePetrolPrices();
  console.log(`[ETL:pump] Scraped ${scraped.length} countries`);

  const scrapedIsos = new Set(scraped.map((r) => r.iso));

  // Fetch World Bank for countries not covered by scrape
  const wbData = await fetchWorldBankFallback();
  const wbFallbacks = wbData.filter((r) => !scrapedIsos.has(r.iso));

  const now = new Date().toISOString();

  const rows = [
    ...scraped.map((r) => ({
      ...r,
      source: "scrape" as const,
      updated_at: now,
    })),
    ...wbFallbacks.map((r) => ({
      iso: r.iso,
      petrol_usd_per_liter: r.petrol_usd_per_liter,
      diesel_usd_per_liter: null,
      source: "worldbank" as const,
      updated_at: now,
    })),
  ];

  if (rows.length > 0) {
    const { error } = await supabase
      .from("pump_prices")
      .upsert(rows, { onConflict: "iso" });

    if (error) console.error("[ETL:pump] upsert error:", error);
    else console.log(`[ETL:pump] Upserted ${rows.length} pump price records`);
  }

  console.log("[ETL:pump] Done.");
}

main().catch((err) => {
  console.error("[ETL:pump] Fatal:", err);
  process.exit(1);
});
