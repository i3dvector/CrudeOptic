"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import PriceTicker from "@/components/PriceTicker";
import type { MapMode } from "@/types/oil";
import geopoliticsData from "@/data/geopolitics.json";

const WorldMap = dynamic(() => import("@/components/WorldMap"), { ssr: false });

const MAP_MODES: { id: MapMode; label: string; desc: string }[] = [
  { id: "production", label: "Production", desc: "Oil production by country (bbl/d)" },
  { id: "consumption", label: "Consumption", desc: "Total oil consumption (K bbl/d)" },
  { id: "reserves", label: "Reserves", desc: "Proven oil reserves (billion bbl)" },
  { id: "imports", label: "Imports", desc: "Volume of crude imports" },
  { id: "exports", label: "Exports", desc: "Volume of crude exports" },
  { id: "sanctions", label: "Sanctions", desc: "Countries under oil sanctions" },
  { id: "news", label: "News Events", desc: "Countries in recent oil news" },
];

export default function ExplorePage() {
  const [mode, setMode] = useState<MapMode>("production");
  const [productionData, setProductionData] = useState<Record<string, number>>({});
  const [consumptionData, setConsumptionData] = useState<Record<string, number>>({});
  const [reservesData, setReservesData] = useState<Record<string, number>>({});
  const [alertedCountries, setAlertedCountries] = useState<string[]>([]);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const sanctionedCountries = Object.entries(geopoliticsData as Record<string, { sanctions?: unknown[] }>)
    .filter(([, d]) => d.sanctions && d.sanctions.length > 0)
    .map(([iso]) => iso);

  useEffect(() => {
    // Fetch production data
    fetch("/api/overview")
      .then((r) => r.json())
      .then((json) => {
        const prod: Record<string, number> = {};
        for (const p of json.data?.top_producers ?? []) {
          prod[p.iso] = p.production_bpd ?? 0;
        }
        setProductionData(prod);
      })
      .catch(() => {});

    // Fetch news/alerts
    fetch("/api/news")
      .then((r) => r.json())
      .then((json) => {
        const countries = new Set<string>();
        for (const alert of json.data?.alerts ?? []) {
          for (const c of alert.countries ?? []) countries.add(c);
        }
        setAlertedCountries(Array.from(countries));
      })
      .catch(() => {});

    // Fetch consumption + reserves for map modes
    fetch("/api/map-data")
      .then((r) => r.json())
      .then((json) => {
        setConsumptionData(json.data?.consumption ?? {});
        setReservesData(json.data?.reserves ?? {});
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Navbar />
      <PriceTicker />

      <main className="pt-24 h-screen flex flex-col">
        {/* Mode selector */}
        <div className="px-4 py-3 bg-crude-bg/80 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap mr-2">
              View by:
            </span>
            {MAP_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  mode === m.id
                    ? "bg-crude-amber text-black"
                    : "glass-card text-gray-400 hover:text-white"
                }`}
                title={m.desc}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative overflow-hidden bg-[#0D1117]">
          <WorldMap
            mode={mode}
            productionData={productionData}
            consumptionData={consumptionData}
            reservesData={reservesData}
            sanctionedCountries={sanctionedCountries}
            alertedCountries={alertedCountries}
            onCountryHover={setHoveredCountry}
            hoveredCountry={hoveredCountry}
          />

          {/* Legend */}
          {mode === "production" && (
            <div className="absolute bottom-6 left-6 glass-card px-4 py-3">
              <div className="text-xs text-gray-400 mb-2">Production (bbl/d)</div>
              <div className="flex items-center gap-1">
                {["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"].map(
                  (c, i) => (
                    <div
                      key={i}
                      className="w-8 h-3 rounded-sm"
                      style={{ background: c }}
                    />
                  )
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          )}

          {mode === "consumption" && (
            <div className="absolute bottom-6 left-6 glass-card px-4 py-3">
              <div className="text-xs text-gray-400 mb-2">Consumption (K bbl/d)</div>
              <div className="flex items-center gap-1">
                {["#deebf7", "#9ecae1", "#4292c6", "#2171b5", "#084594"].map(
                  (c, i) => (
                    <div
                      key={i}
                      className="w-8 h-3 rounded-sm"
                      style={{ background: c }}
                    />
                  )
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          )}

          {mode === "reserves" && (
            <div className="absolute bottom-6 left-6 glass-card px-4 py-3">
              <div className="text-xs text-gray-400 mb-2">Proven Reserves (billion bbl)</div>
              <div className="flex items-center gap-1">
                {["#e5f5e0", "#a1d99b", "#74c476", "#31a354", "#006d2c"].map(
                  (c, i) => (
                    <div
                      key={i}
                      className="w-8 h-3 rounded-sm"
                      style={{ background: c }}
                    />
                  )
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          )}

          {(mode === "imports" || mode === "exports") && (
            <div className="absolute bottom-6 left-6 glass-card px-4 py-3">
              <div className="text-xs text-gray-400 mb-2">
                {mode === "imports" ? "Import" : "Export"} volume — trade data pending
              </div>
              <div className="text-xs text-gray-500">
                UN Comtrade data requires subscription key
              </div>
            </div>
          )}

          {mode === "sanctions" && (
            <div className="absolute bottom-6 left-6 glass-card px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span className="text-gray-300">Active oil sanctions</span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-1">
                <div className="w-4 h-4 rounded bg-[#2A3441]" />
                <span className="text-gray-500">No sanctions</span>
              </div>
            </div>
          )}

          {mode === "news" && (
            <div className="absolute bottom-6 left-6 glass-card px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded bg-red-500 animate-pulse" />
                <span className="text-gray-300">Active news events</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
