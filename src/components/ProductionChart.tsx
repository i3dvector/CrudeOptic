"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatNumber } from "@/lib/countries";

interface ProductionChartProps {
  data: { year: number; value: number }[];
  title?: string;
}

export default function ProductionChart({
  data,
  title = "Production Trend",
}: ProductionChartProps) {
  const sorted = [...data].sort((a, b) => a.year - b.year);

  return (
    <div className="glass-card p-6">
      <h3 className="font-heading text-sm font-bold text-white mb-4">
        {title}
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sorted}>
            <defs>
              <linearGradient id="prodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              stroke="#444"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#444"
              fontSize={12}
              tickLine={false}
              tickFormatter={(v) => formatNumber(v)}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(17,17,17,0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                backdropFilter: "blur(12px)",
              }}
              labelStyle={{ color: "#999" }}
              formatter={(value: number) => [
                `${formatNumber(value)} bbl/d`,
                "Production",
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#F59E0B"
              strokeWidth={2}
              fill="url(#prodGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
