import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import PriceTicker from "@/components/PriceTicker";
import ProductionChart from "@/components/ProductionChart";
import PriceChart from "@/components/PriceChart";
import ConsumptionDonut from "@/components/ConsumptionDonut";
import ReservesGauge from "@/components/ReservesGauge";
import GeopoliticsPanel from "@/components/GeopoliticsPanel";
import NewsFeed from "@/components/NewsFeed";
import { COUNTRIES, formatNumber, formatPrice } from "@/lib/countries";
import { Droplets, TrendingUp, TrendingDown, Minus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import geopoliticsRaw from "@/data/geopolitics.json";
import type { GeopoliticsEntry, ConsumptionBreakdown } from "@/types/oil";
import dynamic from "next/dynamic";
import { createClient } from "@supabase/supabase-js";
import FlagIcon from "@/components/FlagIcon";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SankeyChart = dynamic(() => import("@/components/SankeyChart"), {
  ssr: false,
});

export const revalidate = 3600;

const geopoliticsMap = geopoliticsRaw as Record<string, GeopoliticsEntry>;

async function getCountryData(iso: string) {
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
        .limit(20),
      supabase
        .from("trade_flows")
        .select("*")
        .eq("source_iso", iso)
        .order("value_usd", { ascending: false })
        .limit(20),
      supabase
        .from("price_history")
        .select("*")
        .order("date", { ascending: true })
        .limit(365),
    ]);

    const latestProduction = productionRes.data?.[0];
    const latestReserves = reservesRes.data?.[0];

    const reservesDays =
      latestProduction?.production_bpd && latestReserves?.proven_reserves_bbl
        ? Math.round(
            latestReserves.proven_reserves_bbl / latestProduction.production_bpd
          )
        : null;

    return {
      country: {
        summary: {
          iso,
          name: iso,
          production_bpd: latestProduction?.production_bpd ?? null,
          consumption_bpd: null,
          net_imports_bpd: null,
          reserves_days: reservesDays,
        },
        proven_reserves_bbl: latestReserves?.proven_reserves_bbl ?? null,
        consumption: consumptionRes.data?.[0] ?? null,
        pump_price: pumpRes.data?.[0] ?? null,
        refinery: refineryRes.data?.[0] ?? null,
        production_history: (productionRes.data ?? []).map((d: { year: number; production_bpd: number }) => ({
          year: d.year,
          value: d.production_bpd,
        })),
        price_history: priceHistoryRes.data ?? [],
      },
      trade: {
        imports: importsRes.data ?? [],
        exports: exportsRes.data ?? [],
      },
    };
  } catch {
    return { country: null, trade: null };
  }
}

export default async function CountryPage({
  params,
}: {
  params: { code: string };
}) {
  const iso = params.code.toUpperCase();
  const meta = COUNTRIES[iso];

  if (!meta) notFound();

  const { country, trade } = await getCountryData(iso);
  const geopolitics = geopoliticsMap[iso] ?? null;

  const summary = country?.summary;
  const production = summary?.production_bpd;
  const reservesDays = summary?.reserves_days;
  const provenReservesBbl = country?.proven_reserves_bbl ?? null;

  // Net importer / exporter
  const totalImports = (trade?.imports ?? []).reduce(
    (s: number, f: { volume_bpd?: number }) => s + (f.volume_bpd ?? 0),
    0
  );
  const totalExports = (trade?.exports ?? []).reduce(
    (s: number, f: { volume_bpd?: number }) => s + (f.volume_bpd ?? 0),
    0
  );
  const netBalance = totalExports - totalImports;

  const pumpPrice = country?.pump_price;
  const consumption = country?.consumption as ConsumptionBreakdown | null;
  const refinery = country?.refinery;
  const priceHistory = country?.price_history ?? [];
  const productionHistory = country?.production_history ?? [];

  return (
    <>
      <Navbar />
      <PriceTicker />

      <main className="pt-28 pb-16 px-4 max-w-7xl mx-auto">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All countries
        </Link>

        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex flex-wrap items-start gap-4">
            <FlagIcon iso={iso} size={56} className="rounded" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-heading text-3xl font-bold text-white">
                  {meta.name}
                </h1>
                {geopolitics?.opec_member && (
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-crude-amber/20 text-crude-amber">
                    OPEC
                  </span>
                )}
                {geopolitics?.sanctions?.length > 0 && (
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-red-500/20 text-red-400">
                    SANCTIONED
                  </span>
                )}
              </div>
              <div className="text-gray-400 text-sm">{meta.region}</div>
            </div>
          </div>

          {/* Key stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Production</div>
              <div className="stat-number text-xl font-bold gradient-text">
                {formatNumber(production)} bbl/d
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Imports</div>
              <div className="stat-number text-xl font-bold text-white">
                {formatNumber(totalImports)} bbl/d
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Exports</div>
              <div className="stat-number text-xl font-bold text-white">
                {formatNumber(totalExports)} bbl/d
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Net Balance</div>
              <div
                className={`stat-number text-xl font-bold flex items-center gap-1 ${
                  netBalance > 0
                    ? "text-crude-green"
                    : netBalance < 0
                    ? "text-crude-red"
                    : "text-gray-400"
                }`}
              >
                {netBalance > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : netBalance < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
                {formatNumber(Math.abs(netBalance))} bbl/d
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {netBalance > 0 ? "Net exporter" : netBalance < 0 ? "Net importer" : "Balanced"}
              </div>
            </div>
          </div>
        </div>

        {/* Pump prices */}
        {pumpPrice && (
          <div className="glass-card p-5 mb-6 flex flex-wrap gap-6">
            <Droplets className="w-5 h-5 text-crude-amber self-center" />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Petrol Price
              </div>
              <div className="stat-number text-xl font-bold text-white">
                {formatPrice(pumpPrice.petrol_usd_per_liter)}/L
              </div>
            </div>
            {pumpPrice.diesel_usd_per_liter != null && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Diesel Price
                </div>
                <div className="stat-number text-xl font-bold text-white">
                  {formatPrice(pumpPrice.diesel_usd_per_liter)}/L
                </div>
              </div>
            )}
            <div className="text-xs text-gray-500 self-end pb-0.5">
              {pumpPrice.source === "scrape" ? "Weekly estimate" : "Annual average"} ·{" "}
              {new Date(pumpPrice.updated_at).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Charts grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Import sources */}
          {(trade?.imports?.length ?? 0) > 0 ? (
            <SankeyChart flows={trade!.imports} type="imports" iso={iso} />
          ) : (
            <div className="glass-card p-6">
              <h3 className="font-heading text-sm font-bold text-white mb-2">Import Sources</h3>
              <p className="text-gray-500 text-sm">Trade data loading via ETL.</p>
            </div>
          )}

          {/* Export destinations */}
          {(trade?.exports?.length ?? 0) > 0 ? (
            <SankeyChart flows={trade!.exports} type="exports" iso={iso} />
          ) : (
            <div className="glass-card p-6">
              <h3 className="font-heading text-sm font-bold text-white mb-2">Export Destinations</h3>
              <p className="text-gray-500 text-sm">Trade data loading via ETL.</p>
            </div>
          )}

          {/* Consumption donut */}
          {consumption ? (
            <ConsumptionDonut data={consumption} />
          ) : (
            <div className="glass-card p-6">
              <h3 className="font-heading text-sm font-bold text-white mb-2">
                Consumption by Product
              </h3>
              <p className="text-gray-500 text-sm">Seed annual data to see breakdown.</p>
            </div>
          )}

          {/* Reserves gauge */}
          <ReservesGauge
            reservesDays={reservesDays ?? null}
            reservesBbl={provenReservesBbl}
          />
        </div>

        {/* Production trend + price history */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {productionHistory.length > 0 ? (
            <ProductionChart data={productionHistory} />
          ) : (
            <div className="glass-card p-6">
              <h3 className="font-heading text-sm font-bold text-white mb-2">
                Production Trend
              </h3>
              <p className="text-gray-500 text-sm">EIA data loading via ETL.</p>
            </div>
          )}

          {priceHistory.length > 0 ? (
            <PriceChart data={priceHistory} />
          ) : (
            <div className="glass-card p-6">
              <h3 className="font-heading text-sm font-bold text-white mb-2">
                Price History
              </h3>
              <p className="text-gray-500 text-sm">FRED data loading via ETL.</p>
            </div>
          )}
        </div>

        {/* Refinery */}
        {refinery && (
          <div className="glass-card p-6 mb-6">
            <h3 className="font-heading text-sm font-bold text-white mb-4">
              Refinery Capacity
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Capacity</div>
                <div className="stat-number text-xl font-bold text-white">
                  {formatNumber(refinery.capacity_bpd)} bbl/d
                </div>
              </div>
              {refinery.throughput_bpd != null && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Throughput
                  </div>
                  <div className="stat-number text-xl font-bold text-white">
                    {formatNumber(refinery.throughput_bpd)} bbl/d
                  </div>
                </div>
              )}
              {refinery.utilization_pct != null && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Utilization
                  </div>
                  <div className="stat-number text-xl font-bold gradient-text">
                    {refinery.utilization_pct.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
            {refinery.capacity_bpd && refinery.throughput_bpd && (
              <div className="mt-4">
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-crude-amber"
                    style={{
                      width: `${Math.min(
                        (refinery.throughput_bpd / refinery.capacity_bpd) * 100,
                        100
                      ).toFixed(1)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom row: geopolitics + news */}
        <div className="grid lg:grid-cols-2 gap-6">
          {geopolitics ? (
            <GeopoliticsPanel data={geopolitics} />
          ) : (
            <div className="glass-card p-6">
              <h3 className="font-heading text-sm font-bold text-white mb-2">
                Geopolitical Context
              </h3>
              <p className="text-gray-500 text-sm">No sanctions or geopolitical data on file.</p>
            </div>
          )}
          <NewsFeed />
        </div>
      </main>
    </>
  );
}
