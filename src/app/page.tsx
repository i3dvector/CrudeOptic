import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import PriceTicker from "@/components/PriceTicker";
import NewsFeed from "@/components/NewsFeed";
import AlertsBanner from "@/components/AlertsBanner";
import CountryCard from "@/components/CountryCard";
import PriceChart from "@/components/PriceChart";
import { COUNTRIES } from "@/lib/countries";
import { Globe2, Droplets, BarChart3, TrendingUp } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import FlagIcon from "@/components/FlagIcon";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 300;

async function getOverviewData() {
  try {
    const [pricesRes, productionRes] = await Promise.all([
      supabase.from("live_prices").select("*"),
      supabase
        .from("country_production")
        .select("*")
        .order("year", { ascending: false })
        .limit(200),
    ]);

    const productionData = productionRes.data ?? [];
    const latestYear = productionData[0]?.year ?? new Date().getFullYear() - 1;
    const latestProduction = productionData.filter((d: { year: number }) => d.year === latestYear);
    const sorted = [...latestProduction].sort(
      (a: { production_bpd: number | null }, b: { production_bpd: number | null }) =>
        (b.production_bpd ?? 0) - (a.production_bpd ?? 0)
    );

    const topProducers = sorted.slice(0, 10).map((d: { iso: string; production_bpd: number | null }, i: number) => ({
      iso: d.iso,
      name: d.iso,
      production_bpd: d.production_bpd,
      rank_producer: i + 1,
    }));

    const globalProduction = latestProduction.reduce(
      (sum: number, d: { production_bpd: number | null }) => sum + (d.production_bpd ?? 0),
      0
    );

    return {
      data: {
        top_producers: topProducers,
        live_prices: pricesRes.data ?? [],
        global_production_bpd: globalProduction,
      },
    };
  } catch {
    return null;
  }
}

async function getPriceHistory() {
  try {
    const { data } = await supabase
      .from("price_history")
      .select("*")
      .order("date", { ascending: true })
      .limit(730);

    if (!data || data.length === 0) return null;

    const history = data.map((d: { date: string; benchmark: string; price: number }) => ({
      date: d.date,
      benchmark: d.benchmark,
      price: d.price,
    }));

    return { data: { history } };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [overviewRes, pricesRes] = await Promise.all([
    getOverviewData(),
    getPriceHistory(),
  ]);

  const producers = overviewRes?.data?.top_producers ?? [];
  const priceHistory = pricesRes?.data?.history ?? [];

  const statCards = [
    {
      label: "Countries Tracked",
      value: Object.keys(COUNTRIES).length.toString(),
      icon: Globe2,
      sub: "with live oil data",
    },
    {
      label: "Global Production",
      value: "~100M",
      icon: Droplets,
      sub: "barrels per day",
    },
    {
      label: "Data Sources",
      value: "8+",
      icon: BarChart3,
      sub: "EIA, Comtrade, FRED, GDELT",
    },
    {
      label: "Price Updates",
      value: "15 min",
      icon: TrendingUp,
      sub: "WTI & Brent live",
    },
  ];

  return (
    <>
      <Navbar />
      <PriceTicker />

      <main className="pt-28 pb-16 px-4 max-w-7xl mx-auto">
        {/* Hero */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-crude-amber/10 border border-crude-amber/20 text-crude-amber text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-crude-amber animate-pulse" />
            Live Oil Intelligence Dashboard
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl font-bold text-white mb-4 leading-tight">
            The World&apos;s Oil Flow,{" "}
            <span className="gradient-text">Demystified</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Real-time production, trade flows, reserves, pricing, and
            geopolitical risk for every oil-producing nation — in one place.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/explore"
              className="px-6 py-3 rounded-xl bg-crude-amber text-black font-heading font-bold hover:bg-crude-orange transition-colors"
            >
              Explore the Map
            </Link>
            <Link
              href="/country/sa"
              className="px-6 py-3 rounded-xl glass-card hover:bg-white/10 transition-colors text-white font-medium"
            >
              View Saudi Arabia →
            </Link>
          </div>
        </section>

        {/* Stats row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {statCards.map((s) => (
            <div key={s.label} className="glass-card p-5">
              <s.icon className="w-5 h-5 text-crude-amber mb-3" />
              <div className="stat-number text-3xl font-bold gradient-text">
                {s.value}
              </div>
              <div className="text-sm font-medium text-white mt-1">{s.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </section>

        {/* Price chart */}
        {priceHistory.length > 0 && (
          <section className="mb-12">
            <PriceChart data={priceHistory} />
          </section>
        )}

        {/* Top producers */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-xl font-bold text-white">
              Top Oil Producers
            </h2>
            <Link
              href="/explore?mode=production"
              className="text-sm text-crude-amber hover:text-crude-orange transition-colors"
            >
              View on map →
            </Link>
          </div>
          {producers.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-gray-500">
                Production data loading — ETL pipeline needs to run first.
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Trigger GitHub Action:{" "}
                <code className="bg-white/5 px-2 py-0.5 rounded">
                  npm run etl:eia
                </code>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {producers.slice(0, 10).map((p: { iso: string; production_bpd: number | null; rank_producer: number | null }) => (
                <CountryCard
                  key={p.iso}
                  iso={p.iso}
                  production_bpd={p.production_bpd}
                  rank={p.rank_producer}
                />
              ))}
            </div>
          )}
        </section>

        {/* News + Alerts */}
        <section className="grid lg:grid-cols-2 gap-6 mb-12">
          <Suspense fallback={<div className="glass-card p-6 h-64 animate-pulse" />}>
            <NewsFeed />
          </Suspense>
          <Suspense fallback={<div className="glass-card p-6 h-64 animate-pulse" />}>
            <AlertsBanner />
          </Suspense>
        </section>

        {/* Country index */}
        <section>
          <h2 className="font-heading text-xl font-bold text-white mb-5">
            Browse Countries
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.values(COUNTRIES).map((c) => (
              <Link
                key={c.iso}
                href={`/country/${c.iso.toLowerCase()}`}
                className="glass-card-hover p-3 flex items-center gap-2 text-sm"
              >
                <FlagIcon iso={c.iso} size={24} />
                <span className="text-gray-300 truncate font-medium">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-600">
        <p>
          CrudeOptic · Data from EIA, UN Comtrade, FRED, GDELT · Not financial advice
        </p>
      </footer>
    </>
  );
}
