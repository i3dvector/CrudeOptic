/**
 * Seed annual data: consumption_by_type + refinery_capacity
 *
 * Sources: Energy Institute Statistical Review 2023, OPEC ASB 2022,
 *          EIA, IEA — representative 2022 figures (thousand bpd).
 *
 * Run: npm run seed
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YEAR = 2022;

// ---------------------------------------------------------------------------
// Consumption by product type — thousand barrels per day, 2022 estimates
// Source: Energy Institute Statistical Review 2023 / IEA
// ---------------------------------------------------------------------------
interface ConsumptionRow {
  iso: string;
  year: number;
  petrol: number;
  diesel: number;
  kerosene: number;
  jet_fuel: number;
  lpg: number;
  fuel_oil: number;
  other: number;
  total: number;
  unit: string;
}

const CONSUMPTION_DATA: Omit<ConsumptionRow, "year" | "unit">[] = [
  // ISO   petrol  diesel  kerosene  jet_fuel  lpg  fuel_oil  other
  { iso: "US", petrol: 8600, diesel: 4100, kerosene: 20,  jet_fuel: 1500, lpg: 600, fuel_oil: 200,  other: 1200, total: 16220 },
  { iso: "CN", petrol: 3800, diesel: 4200, kerosene: 300, jet_fuel: 1000, lpg: 700, fuel_oil: 600,  other: 900,  total: 11500 },
  { iso: "IN", petrol: 750,  diesel: 1800, kerosene: 100, jet_fuel: 170,  lpg: 650, fuel_oil: 90,   other: 200,  total: 3760  },
  { iso: "JP", petrol: 700,  diesel: 700,  kerosene: 200, jet_fuel: 290,  lpg: 180, fuel_oil: 200,  other: 300,  total: 2570  },
  { iso: "SA", petrol: 560,  diesel: 400,  kerosene: 10,  jet_fuel: 230,  lpg: 180, fuel_oil: 440,  other: 200,  total: 2020  },
  { iso: "RU", petrol: 1000, diesel: 950,  kerosene: 100, jet_fuel: 230,  lpg: 210, fuel_oil: 330,  other: 200,  total: 3020  },
  { iso: "BR", petrol: 950,  diesel: 1300, kerosene: 30,  jet_fuel: 280,  lpg: 350, fuel_oil: 120,  other: 200,  total: 3230  },
  { iso: "CA", petrol: 1100, diesel: 650,  kerosene: 20,  jet_fuel: 300,  lpg: 100, fuel_oil: 100,  other: 200,  total: 2470  },
  { iso: "DE", petrol: 540,  diesel: 750,  kerosene: 20,  jet_fuel: 220,  lpg: 60,  fuel_oil: 100,  other: 200,  total: 1890  },
  { iso: "KR", petrol: 250,  diesel: 500,  kerosene: 100, jet_fuel: 200,  lpg: 150, fuel_oil: 200,  other: 200,  total: 1600  },
  { iso: "FR", petrol: 400,  diesel: 650,  kerosene: 10,  jet_fuel: 200,  lpg: 80,  fuel_oil: 80,   other: 150,  total: 1570  },
  { iso: "GB", petrol: 450,  diesel: 550,  kerosene: 10,  jet_fuel: 270,  lpg: 70,  fuel_oil: 60,   other: 180,  total: 1590  },
  { iso: "IT", petrol: 400,  diesel: 600,  kerosene: 10,  jet_fuel: 140,  lpg: 100, fuel_oil: 100,  other: 150,  total: 1500  },
  { iso: "ES", petrol: 350,  diesel: 550,  kerosene: 10,  jet_fuel: 150,  lpg: 70,  fuel_oil: 80,   other: 100,  total: 1310  },
  { iso: "AU", petrol: 500,  diesel: 450,  kerosene: 20,  jet_fuel: 140,  lpg: 60,  fuel_oil: 50,   other: 80,   total: 1300  },
  { iso: "MX", petrol: 600,  diesel: 700,  kerosene: 30,  jet_fuel: 130,  lpg: 350, fuel_oil: 100,  other: 200,  total: 2110  },
  { iso: "IR", petrol: 700,  diesel: 600,  kerosene: 100, jet_fuel: 150,  lpg: 200, fuel_oil: 200,  other: 100,  total: 2050  },
  { iso: "ID", petrol: 550,  diesel: 600,  kerosene: 100, jet_fuel: 130,  lpg: 200, fuel_oil: 100,  other: 100,  total: 1780  },
  { iso: "TR", petrol: 200,  diesel: 450,  kerosene: 20,  jet_fuel: 130,  lpg: 100, fuel_oil: 80,   other: 100,  total: 1080  },
  { iso: "AE", petrol: 200,  diesel: 300,  kerosene: 10,  jet_fuel: 200,  lpg: 50,  fuel_oil: 200,  other: 100,  total: 1060  },
  { iso: "NL", petrol: 200,  diesel: 300,  kerosene: 10,  jet_fuel: 200,  lpg: 50,  fuel_oil: 100,  other: 50,   total: 910   },
  { iso: "EG", petrol: 200,  diesel: 350,  kerosene: 30,  jet_fuel: 80,   lpg: 100, fuel_oil: 100,  other: 100,  total: 960   },
  { iso: "MY", petrol: 250,  diesel: 280,  kerosene: 30,  jet_fuel: 80,   lpg: 80,  fuel_oil: 80,   other: 50,   total: 850   },
  { iso: "TH", petrol: 200,  diesel: 400,  kerosene: 30,  jet_fuel: 100,  lpg: 100, fuel_oil: 80,   other: 50,   total: 960   },
  { iso: "PL", petrol: 150,  diesel: 450,  kerosene: 10,  jet_fuel: 80,   lpg: 60,  fuel_oil: 50,   other: 50,   total: 850   },
  { iso: "ZA", petrol: 150,  diesel: 300,  kerosene: 20,  jet_fuel: 60,   lpg: 30,  fuel_oil: 60,   other: 50,   total: 670   },
  { iso: "IQ", petrol: 200,  diesel: 250,  kerosene: 20,  jet_fuel: 60,   lpg: 50,  fuel_oil: 100,  other: 50,   total: 730   },
  { iso: "KW", petrol: 120,  diesel: 100,  kerosene: 5,   jet_fuel: 60,   lpg: 30,  fuel_oil: 80,   other: 50,   total: 445   },
  { iso: "NG", petrol: 150,  diesel: 150,  kerosene: 30,  jet_fuel: 30,   lpg: 30,  fuel_oil: 50,   other: 50,   total: 490   },
  { iso: "DZ", petrol: 100,  diesel: 200,  kerosene: 30,  jet_fuel: 40,   lpg: 150, fuel_oil: 50,   other: 50,   total: 620   },
  { iso: "CO", petrol: 150,  diesel: 200,  kerosene: 20,  jet_fuel: 40,   lpg: 50,  fuel_oil: 50,   other: 50,   total: 560   },
  { iso: "VE", petrol: 150,  diesel: 100,  kerosene: 20,  jet_fuel: 30,   lpg: 100, fuel_oil: 50,   other: 50,   total: 500   },
  { iso: "QA", petrol: 70,   diesel: 80,   kerosene: 5,   jet_fuel: 70,   lpg: 20,  fuel_oil: 60,   other: 30,   total: 335   },
  { iso: "OM", petrol: 60,   diesel: 80,   kerosene: 5,   jet_fuel: 30,   lpg: 20,  fuel_oil: 50,   other: 30,   total: 275   },
  { iso: "KZ", petrol: 80,   diesel: 150,  kerosene: 20,  jet_fuel: 30,   lpg: 50,  fuel_oil: 50,   other: 50,   total: 430   },
  { iso: "NO", petrol: 100,  diesel: 200,  kerosene: 10,  jet_fuel: 90,   lpg: 20,  fuel_oil: 50,   other: 50,   total: 520   },
  { iso: "EC", petrol: 100,  diesel: 150,  kerosene: 15,  jet_fuel: 25,   lpg: 80,  fuel_oil: 30,   other: 30,   total: 430   },
  { iso: "AO", petrol: 50,   diesel: 80,   kerosene: 10,  jet_fuel: 15,   lpg: 10,  fuel_oil: 20,   other: 20,   total: 205   },
  { iso: "LY", petrol: 60,   diesel: 80,   kerosene: 10,  jet_fuel: 20,   lpg: 20,  fuel_oil: 40,   other: 20,   total: 250   },
  { iso: "PK", petrol: 200,  diesel: 350,  kerosene: 50,  jet_fuel: 40,   lpg: 200, fuel_oil: 50,   other: 50,   total: 940   },
  { iso: "SG", petrol: 80,   diesel: 120,  kerosene: 5,   jet_fuel: 230,  lpg: 20,  fuel_oil: 300,  other: 50,   total: 805   },
];

// ---------------------------------------------------------------------------
// Refinery capacity — thousand barrels per day, 2022
// Source: EIA, OPEC ASB, Oil & Gas Journal
// ---------------------------------------------------------------------------
interface RefineryRow {
  iso: string;
  capacity_bpd: number;
  throughput_bpd: number;
  utilization_pct: number;
  year: number;
}

const REFINERY_DATA: Omit<RefineryRow, "year">[] = [
  // capacity and throughput in thousand bpd
  { iso: "US", capacity_bpd: 18000, throughput_bpd: 15800, utilization_pct: 87.8 },
  { iso: "CN", capacity_bpd: 17500, throughput_bpd: 14500, utilization_pct: 82.9 },
  { iso: "RU", capacity_bpd: 6100,  throughput_bpd: 5500,  utilization_pct: 90.2 },
  { iso: "IN", capacity_bpd: 5000,  throughput_bpd: 4600,  utilization_pct: 92.0 },
  { iso: "SA", capacity_bpd: 3200,  throughput_bpd: 2900,  utilization_pct: 90.6 },
  { iso: "JP", capacity_bpd: 3100,  throughput_bpd: 2300,  utilization_pct: 74.2 },
  { iso: "KR", capacity_bpd: 3400,  throughput_bpd: 3000,  utilization_pct: 88.2 },
  { iso: "BR", capacity_bpd: 2100,  throughput_bpd: 1900,  utilization_pct: 90.5 },
  { iso: "CA", capacity_bpd: 2100,  throughput_bpd: 1900,  utilization_pct: 90.5 },
  { iso: "IR", capacity_bpd: 2100,  throughput_bpd: 1700,  utilization_pct: 81.0 },
  { iso: "IT", capacity_bpd: 2100,  throughput_bpd: 1500,  utilization_pct: 71.4 },
  { iso: "DE", capacity_bpd: 1900,  throughput_bpd: 1600,  utilization_pct: 84.2 },
  { iso: "MX", capacity_bpd: 1600,  throughput_bpd: 900,   utilization_pct: 56.3 },
  { iso: "NL", capacity_bpd: 1300,  throughput_bpd: 1100,  utilization_pct: 84.6 },
  { iso: "FR", capacity_bpd: 1300,  throughput_bpd: 1000,  utilization_pct: 76.9 },
  { iso: "ES", capacity_bpd: 1400,  throughput_bpd: 1200,  utilization_pct: 85.7 },
  { iso: "GB", capacity_bpd: 1700,  throughput_bpd: 1400,  utilization_pct: 82.4 },
  { iso: "AE", capacity_bpd: 900,   throughput_bpd: 800,   utilization_pct: 88.9 },
  { iso: "KW", capacity_bpd: 900,   throughput_bpd: 800,   utilization_pct: 88.9 },
  { iso: "IQ", capacity_bpd: 700,   throughput_bpd: 500,   utilization_pct: 71.4 },
  { iso: "ID", capacity_bpd: 1200,  throughput_bpd: 900,   utilization_pct: 75.0 },
  { iso: "MY", capacity_bpd: 600,   throughput_bpd: 500,   utilization_pct: 83.3 },
  { iso: "TH", capacity_bpd: 1100,  throughput_bpd: 900,   utilization_pct: 81.8 },
  { iso: "TR", capacity_bpd: 600,   throughput_bpd: 500,   utilization_pct: 83.3 },
  { iso: "EG", capacity_bpd: 800,   throughput_bpd: 700,   utilization_pct: 87.5 },
  { iso: "ZA", capacity_bpd: 500,   throughput_bpd: 400,   utilization_pct: 80.0 },
  { iso: "PL", capacity_bpd: 600,   throughput_bpd: 500,   utilization_pct: 83.3 },
  { iso: "NG", capacity_bpd: 450,   throughput_bpd: 100,   utilization_pct: 22.2 },
  { iso: "VE", capacity_bpd: 1300,  throughput_bpd: 400,   utilization_pct: 30.8 },
  { iso: "DZ", capacity_bpd: 600,   throughput_bpd: 500,   utilization_pct: 83.3 },
  { iso: "CO", capacity_bpd: 300,   throughput_bpd: 250,   utilization_pct: 83.3 },
  { iso: "KZ", capacity_bpd: 400,   throughput_bpd: 350,   utilization_pct: 87.5 },
  { iso: "NO", capacity_bpd: 300,   throughput_bpd: 250,   utilization_pct: 83.3 },
  { iso: "QA", capacity_bpd: 300,   throughput_bpd: 250,   utilization_pct: 83.3 },
  { iso: "OM", capacity_bpd: 200,   throughput_bpd: 190,   utilization_pct: 95.0 },
  { iso: "EC", capacity_bpd: 200,   throughput_bpd: 170,   utilization_pct: 85.0 },
  { iso: "LY", capacity_bpd: 380,   throughput_bpd: 200,   utilization_pct: 52.6 },
  { iso: "AO", capacity_bpd: 65,    throughput_bpd: 40,    utilization_pct: 61.5 },
  { iso: "PK", capacity_bpd: 460,   throughput_bpd: 350,   utilization_pct: 76.1 },
  { iso: "SG", capacity_bpd: 1500,  throughput_bpd: 1350,  utilization_pct: 90.0 },
];

// ---------------------------------------------------------------------------

async function seedConsumption() {
  console.log("[seed] Seeding consumption_by_type...");

  const rows: ConsumptionRow[] = CONSUMPTION_DATA.map((d) => ({
    ...d,
    year: YEAR,
    unit: "thousand_bpd",
  }));

  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabase
      .from("consumption_by_type")
      .upsert(batch, { onConflict: "iso,year" });

    if (error) {
      console.error(`[seed] consumption batch ${i} error:`, error.message);
    }
  }

  console.log(`[seed] Seeded ${rows.length} consumption records`);
}

async function seedRefinery() {
  console.log("[seed] Seeding refinery_capacity...");

  const rows: RefineryRow[] = REFINERY_DATA.map((d) => ({
    ...d,
    year: YEAR,
  }));

  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabase
      .from("refinery_capacity")
      .upsert(batch, { onConflict: "iso,year" });

    if (error) {
      console.error(`[seed] refinery batch ${i} error:`, error.message);
    }
  }

  console.log(`[seed] Seeded ${rows.length} refinery records`);
}

// ---------------------------------------------------------------------------
// Proven oil reserves — barrels, 2025
// Source: Worldometer (worldometers.info/oil/oil-reserves-by-country)
// ---------------------------------------------------------------------------
interface ReservesRow {
  iso: string;
  year: number;
  proven_reserves_bbl: number;
  source: string;
  updated_at: string;
}

const RESERVES_DATA: { iso: string; proven_reserves_bbl: number }[] = [
  // Source: Worldometer 2025 — values in barrels
  { iso: "VE", proven_reserves_bbl: 303_008_000_000 },
  { iso: "SA", proven_reserves_bbl: 267_230_000_000 },
  { iso: "IR", proven_reserves_bbl: 208_600_000_000 },
  { iso: "CA", proven_reserves_bbl: 163_108_000_000 },
  { iso: "IQ", proven_reserves_bbl: 145_019_000_000 },
  { iso: "AE", proven_reserves_bbl: 113_000_000_000 },
  { iso: "KW", proven_reserves_bbl: 101_500_000_000 },
  { iso: "US", proven_reserves_bbl: 83_729_430_000 },
  { iso: "RU", proven_reserves_bbl: 80_000_000_000 },
  { iso: "LY", proven_reserves_bbl: 48_363_000_000 },
  { iso: "NG", proven_reserves_bbl: 37_500_000_000 },
  { iso: "KZ", proven_reserves_bbl: 30_000_000_000 },
  { iso: "CN", proven_reserves_bbl: 28_182_000_000 },
  { iso: "QA", proven_reserves_bbl: 25_244_000_000 },
  { iso: "BR", proven_reserves_bbl: 15_894_160_000 },
  { iso: "DZ", proven_reserves_bbl: 12_200_000_000 },
  { iso: "GY", proven_reserves_bbl: 11_000_000_000 },
  { iso: "EC", proven_reserves_bbl: 8_273_000_000 },
  { iso: "AZ", proven_reserves_bbl: 7_000_000_000 },
  { iso: "NO", proven_reserves_bbl: 6_912_490_000 },
  { iso: "MX", proven_reserves_bbl: 5_901_800_000 },
  { iso: "SD", proven_reserves_bbl: 5_000_000_000 },
  { iso: "IN", proven_reserves_bbl: 4_980_857_000 },
  { iso: "OM", proven_reserves_bbl: 4_971_000_000 },
  { iso: "VN", proven_reserves_bbl: 4_400_000_000 },
  { iso: "EG", proven_reserves_bbl: 3_300_000_000 },
  { iso: "YE", proven_reserves_bbl: 3_000_000_000 },
  { iso: "AR", proven_reserves_bbl: 2_999_366_000 },
  { iso: "MY", proven_reserves_bbl: 2_700_000_000 },
  { iso: "AO", proven_reserves_bbl: 2_550_000_000 },
  { iso: "UG", proven_reserves_bbl: 2_500_000_000 },
  { iso: "SY", proven_reserves_bbl: 2_500_000_000 },
  { iso: "ID", proven_reserves_bbl: 2_410_000_000 },
  { iso: "CO", proven_reserves_bbl: 2_019_000_000 },
  { iso: "GA", proven_reserves_bbl: 2_000_000_000 },
  { iso: "CG", proven_reserves_bbl: 1_811_000_000 },
  { iso: "AU", proven_reserves_bbl: 1_803_000_000 },
  { iso: "TD", proven_reserves_bbl: 1_500_000_000 },
  { iso: "GB", proven_reserves_bbl: 1_500_000_000 },
  { iso: "GQ", proven_reserves_bbl: 1_100_000_000 },
  { iso: "BN", proven_reserves_bbl: 1_100_000_000 },
  { iso: "PE", proven_reserves_bbl: 671_214_000 },
  { iso: "GH", proven_reserves_bbl: 660_000_000 },
  { iso: "TM", proven_reserves_bbl: 600_000_000 },
  { iso: "RO", proven_reserves_bbl: 600_000_000 },
  { iso: "UZ", proven_reserves_bbl: 594_000_000 },
  { iso: "IT", proven_reserves_bbl: 578_023_000 },
  { iso: "TR", proven_reserves_bbl: 507_000_000 },
  { iso: "TN", proven_reserves_bbl: 425_000_000 },
  { iso: "UA", proven_reserves_bbl: 395_000_000 },
  { iso: "DK", proven_reserves_bbl: 364_808_000 },
  { iso: "PK", proven_reserves_bbl: 243_000_000 },
  { iso: "TT", proven_reserves_bbl: 242_982_000 },
  { iso: "BO", proven_reserves_bbl: 240_900_000 },
  { iso: "TH", proven_reserves_bbl: 239_880_000 },
  { iso: "CM", proven_reserves_bbl: 200_000_000 },
  { iso: "BY", proven_reserves_bbl: 198_000_000 },
  { iso: "CD", proven_reserves_bbl: 180_000_000 },
  { iso: "BH", proven_reserves_bbl: 169_900_000 },
  { iso: "NE", proven_reserves_bbl: 150_000_000 },
  { iso: "CL", proven_reserves_bbl: 150_000_000 },
  { iso: "ES", proven_reserves_bbl: 150_000_000 },
  { iso: "AL", proven_reserves_bbl: 150_000_000 },
  { iso: "PG", proven_reserves_bbl: 143_387_000 },
  { iso: "MM", proven_reserves_bbl: 139_000_000 },
  { iso: "PH", proven_reserves_bbl: 138_500_000 },
  { iso: "CU", proven_reserves_bbl: 124_000_000 },
  { iso: "PL", proven_reserves_bbl: 115_000_000 },
  { iso: "DE", proven_reserves_bbl: 105_840_000 },
  { iso: "SR", proven_reserves_bbl: 101_700_000 },
  { iso: "MZ", proven_reserves_bbl: 100_000_000 },
  { iso: "CI", proven_reserves_bbl: 100_000_000 },
  { iso: "GT", proven_reserves_bbl: 88_321_000 },
  { iso: "RS", proven_reserves_bbl: 77_500_000 },
  { iso: "HR", proven_reserves_bbl: 71_000_000 },
  { iso: "FR", proven_reserves_bbl: 67_583_000 },
  { iso: "NZ", proven_reserves_bbl: 45_355_000 },
  { iso: "JP", proven_reserves_bbl: 44_115_000 },
  { iso: "KG", proven_reserves_bbl: 40_000_000 },
  { iso: "GE", proven_reserves_bbl: 35_000_000 },
  { iso: "AT", proven_reserves_bbl: 27_700_000 },
  { iso: "MR", proven_reserves_bbl: 20_000_000 },
  { iso: "ZA", proven_reserves_bbl: 15_000_000 },
  { iso: "BG", proven_reserves_bbl: 15_000_000 },
  { iso: "CZ", proven_reserves_bbl: 15_000_000 },
  { iso: "HU", proven_reserves_bbl: 13_800_000 },
  { iso: "IL", proven_reserves_bbl: 12_730_000 },
  { iso: "TJ", proven_reserves_bbl: 12_000_000 },
  { iso: "LT", proven_reserves_bbl: 12_000_000 },
  { iso: "NL", proven_reserves_bbl: 10_693_000 },
  { iso: "GR", proven_reserves_bbl: 10_000_000 },
  { iso: "SK", proven_reserves_bbl: 9_000_000 },
  { iso: "BJ", proven_reserves_bbl: 8_000_000 },
  { iso: "BD", proven_reserves_bbl: 2_800_000 },
  { iso: "JO", proven_reserves_bbl: 1_000_000 },
  { iso: "MA", proven_reserves_bbl: 684_000 },
  { iso: "ET", proven_reserves_bbl: 428_000 },
];

async function seedReserves() {
  console.log("[seed] Seeding proven reserves...");

  // Deduplicate by iso (keep last occurrence)
  const seen = new Map<string, { iso: string; proven_reserves_bbl: number }>();
  for (const d of RESERVES_DATA) seen.set(d.iso, d);

  const rows: ReservesRow[] = Array.from(seen.values()).map((d) => ({
    iso: d.iso,
    year: 2025,
    proven_reserves_bbl: d.proven_reserves_bbl,
    source: "Worldometer 2025",
    updated_at: new Date().toISOString(),
  }));

  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabase
      .from("reserves")
      .upsert(batch, { onConflict: "iso,year" });
    if (error) console.error(`[seed] reserves batch ${i} error:`, error.message);
  }

  console.log(`[seed] Seeded ${rows.length} reserves records`);
}

async function main() {
  console.log(`[seed] Seeding annual data for ${YEAR}...`);
  await seedConsumption();
  await seedRefinery();
  await seedReserves();
  console.log("[seed] Done.");
}

main().catch((err) => {
  console.error("[seed] Fatal:", err);
  process.exit(1);
});
