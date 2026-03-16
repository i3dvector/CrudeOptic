"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
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

export default function ConsumptionDonut({ data }: Props) {
  const entries = Object.entries(LABELS).map(([key, label]) => ({
    name: label,
    value: Number(data[key as keyof ConsumptionBreakdown]) || 0,
  })).filter((e) => e.value > 0);

  return (
    <div className="glass-card p-6">
      <h3 className="font-heading text-sm font-bold text-white mb-1">
        Consumption by Product
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        {data.year} · {data.unit?.replace("_", " ")}
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={entries}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {entries.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgba(17,17,17,0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
              formatter={(v: number) => [`${v.toFixed(1)} kbd`, ""]}
            />
            <Legend
              iconSize={8}
              formatter={(v) => <span style={{ color: "#9CA3AF", fontSize: 12 }}>{v}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
