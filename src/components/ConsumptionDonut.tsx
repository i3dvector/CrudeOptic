"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { ConsumptionBreakdown } from "@/types/oil";

const COLORS = ["#F59E0B", "#F97316", "#EF4444", "#8B5CF6", "#3B82F6", "#22C55E", "#6B7280"];

const LABELS: Record<string, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  kerosene: "Kerosene",
  jet_fuel: "Jet Fuel",
  lpg: "LPG",
  fuel_oil: "Fuel Oil",
  other: "Other",
};

interface Props {
  data: ConsumptionBreakdown;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div
      style={{
        background: "rgba(17,17,17,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "8px 12px",
      }}
    >
      <p style={{ color: "#D1D5DB", fontSize: 12, margin: 0 }}>{name}</p>
      <p style={{ color: "#F59E0B", fontSize: 14, fontWeight: 600, margin: "2px 0 0" }}>
        {Number(value).toLocaleString()} kbd
      </p>
    </div>
  );
}

export default function ConsumptionDonut({ data }: Props) {
  const entries = Object.entries(LABELS).map(([key, label]) => ({
    name: label,
    value: Number(data[key as keyof ConsumptionBreakdown]) || 0,
  })).filter((e) => e.value > 0);

  const total = entries.reduce((s, e) => s + e.value, 0);

  return (
    <div className="glass-card p-6">
      <h3 className="font-heading text-sm font-bold text-white mb-1">
        Consumption by Product
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        {data.year} · {data.unit?.replace("_", " ")}
      </p>

      {/* Chart */}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={entries}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {entries.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend as a separate grid below the chart */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
        {entries.map((e, i) => {
          const pct = total > 0 ? ((e.value / total) * 100).toFixed(1) : "0";
          return (
            <div key={e.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-gray-300 truncate">{e.name}</span>
              <span className="text-gray-500 ml-auto tabular-nums">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
