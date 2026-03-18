/**
 * ETL: Proven Oil Reserves
 * Scrapes Worldometer for proven oil reserves per country
 * Writes to Supabase `reserves` table
 * Schedule: Monthly via GitHub Actions (reserves rarely change)
 */
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Country name → ISO2 mapping for Worldometer scraper */
const NAME_TO_ISO: Record<string, string> = {
  "Venezuela": "VE", "Saudi Arabia": "SA", "Iran": "IR",
  "Canada": "CA", "Iraq": "IQ", "United Arab Emirates": "AE",
  "Kuwait": "KW", "United States": "US", "Russia": "RU",
  "Libya": "LY", "Nigeria": "NG", "Kazakhstan": "KZ",
  "China": "CN", "Qatar": "QA", "Brazil": "BR",
  "Algeria": "DZ", "Guyana": "GY", "Ecuador": "EC",
  "Azerbaijan": "AZ", "Norway": "NO", "Mexico": "MX",
  "Sudan": "SD", "India": "IN", "Oman": "OM",
  "Vietnam": "VN", "Egypt": "EG", "Yemen": "YE",
  "Argentina": "AR", "Malaysia": "MY", "Angola": "AO",
  "Uganda": "UG", "Syria": "SY", "Indonesia": "ID",
  "Colombia": "CO", "Gabon": "GA", "Congo": "CG",
  "Australia": "AU", "Chad": "TD", "United Kingdom": "GB",
  "Equatorial Guinea": "GQ", "Brunei": "BN", "Peru": "PE",
  "Ghana": "GH", "Turkmenistan": "TM", "Romania": "RO",
  "Uzbekistan": "UZ", "Italy": "IT", "Turkey": "TR",
  "Tunisia": "TN", "Ukraine": "UA", "Denmark": "DK",
  "Pakistan": "PK", "Trinidad and Tobago": "TT",
  "Bolivia": "BO", "Thailand": "TH", "Cameroon": "CM",
  "Belarus": "BY", "DR Congo": "CD", "Bahrain": "BH",
  "Niger": "NE", "Chile": "CL", "Spain": "ES",
  "Albania": "AL", "Papua New Guinea": "PG", "Myanmar": "MM",
  "Philippines": "PH", "Cuba": "CU", "Poland": "PL",
  "Germany": "DE", "Suriname": "SR", "Mozambique": "MZ",
  "Côte d'Ivoire": "CI", "Guatemala": "GT", "Serbia": "RS",
  "Croatia": "HR", "France": "FR", "New Zealand": "NZ",
  "Japan": "JP", "Kyrgyzstan": "KG", "Georgia": "GE",
  "Austria": "AT", "Mauritania": "MR", "South Africa": "ZA",
  "Bulgaria": "BG", "Czech Republic": "CZ", "Hungary": "HU",
  "Israel": "IL", "Tajikistan": "TJ", "Lithuania": "LT",
  "Netherlands": "NL", "Greece": "GR", "Slovakia": "SK",
  "Benin": "BJ", "Belize": "BZ", "Bangladesh": "BD",
  "Taiwan": "TW", "Barbados": "BB", "Jordan": "JO",
  "Morocco": "MA", "Ethiopia": "ET",
  // Alternate names
  "Ivory Coast": "CI", "Cote d'Ivoire": "CI",
  "Democratic Republic of the Congo": "CD",
  "Republic of the Congo": "CG",
  "South Korea": "KR", "North Korea": "KP",
  "Singapore": "SG",
};

interface ScrapedReserve {
  iso: string;
  proven_reserves_bbl: number;
}

async function scrapeWorldometerReserves(): Promise<ScrapedReserve[]> {
  const results: ScrapedReserve[] = [];

  try {
    const res = await fetch("https://www.worldometers.info/oil/oil-reserves-by-country/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CrudeOptic/1.0; research)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      console.warn(`[ETL:reserves] Worldometer returned ${res.status}`);
      return results;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Worldometer uses a standard table with country name and reserves value
    $("table tbody tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 2) return;

      // Try multiple cell positions — Worldometer sometimes has rank in first col
      let country = "";
      let reservesStr = "";

      if (cells.length >= 3) {
        // Format: [rank, country, reserves, ...]
        country = $(cells[1]).text().trim();
        reservesStr = $(cells[2]).text().trim().replace(/,/g, "");
      } else {
        // Format: [country, reserves]
        country = $(cells[0]).text().trim();
        reservesStr = $(cells[1]).text().trim().replace(/,/g, "");
      }

      const iso = NAME_TO_ISO[country];
      const reserves = parseInt(reservesStr, 10);

      if (iso && !isNaN(reserves) && reserves > 0) {
        results.push({
          iso,
          proven_reserves_bbl: reserves,
        });
      }
    });
  } catch (err) {
    console.error("[ETL:reserves] Scraping failed:", err);
  }

  return results;
}

async function main() {
  console.log("[ETL:reserves] Scraping proven oil reserves from Worldometer...");

  const scraped = await scrapeWorldometerReserves();
  console.log(`[ETL:reserves] Scraped ${scraped.length} countries`);

  if (scraped.length === 0) {
    console.warn("[ETL:reserves] No data scraped — skipping upsert");
    return;
  }

  const now = new Date().toISOString();
  const year = new Date().getFullYear();

  const rows = scraped.map((r) => ({
    iso: r.iso,
    year,
    proven_reserves_bbl: r.proven_reserves_bbl,
    source: "Worldometer",
    updated_at: now,
  }));

  // Upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from("reserves")
      .upsert(batch, { onConflict: "iso,year" });

    if (error) {
      console.error(`[ETL:reserves] Upsert batch ${i} error:`, error.message);
    }
  }

  console.log(`[ETL:reserves] Upserted ${rows.length} reserves records for ${year}`);
  console.log("[ETL:reserves] Done.");
}

main().catch((err) => {
  console.error("[ETL:reserves] Fatal:", err);
  process.exit(1);
});
