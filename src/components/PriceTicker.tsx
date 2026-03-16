"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LivePrice } from "@/types/oil";

export default function PriceTicker() {
  const [prices, setPrices] = useState<LivePrice[]>([]);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("/api/prices");
        const json = await res.json();
        setPrices(json.data?.live ?? []);
      } catch {
        // Silently fail — ticker just won't show
      }
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  if (prices.length === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-crude-bg/90 backdrop-blur-sm border-b border-gradient-to-r from-crude-amber/20 via-transparent to-crude-amber/20">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-8 text-sm">
        {prices.map((p) => {
          const isUp = (p.change ?? 0) >= 0;
          return (
            <div key={p.benchmark} className="flex items-center gap-3">
              <span className="text-gray-400 font-medium">{p.benchmark}</span>
              <span className="stat-number text-lg font-bold text-white">
                ${(p.price ?? 0).toFixed(2)}
              </span>
              <span
                className={`flex items-center gap-1 stat-number text-sm ${
                  isUp ? "text-crude-green" : "text-crude-red"
                }`}
              >
                {isUp ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {isUp ? "+" : ""}
                {(p.change ?? 0).toFixed(2)} (
                {isUp ? "+" : ""}
                {(p.change_percent ?? 0).toFixed(2)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
