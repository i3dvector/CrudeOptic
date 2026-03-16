"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PriceChartProps {
  data: { date: string; benchmark: string; price: number }[];
}

export default function PriceChart({ data }: PriceChartProps) {
  // Pivot data: group by date with wti/brent columns
  const dateMap = new Map<string, { date: string; WTI?: number; BRENT?: number }>();

  for (const d of data) {
    const existing = dateMap.get(d.date) ?? { date: d.date };
    existing[d.benchmark as "WTI" | "BRENT"] = d.price;
    dateMap.set(d.date, existing);
  }

  const chartData = Array.from(dateMap.values()).sort(
    (a, b) => a.date.localeCompare(b.date)
  );

  return (
    <div className="glass-card p-6">
      <h3 className="font-heading text-sm font-bold text-white mb-4">
        Price History
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="wtiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="brentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke="#444"
              fontSize={11}
              tickLine={false}
              tickFormatter={(d) => {
                const date = new Date(d);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#444"
              fontSize={12}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(17,17,17,0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#999" }}
              formatter={(value: number, name: string) => [
                `$${value.toFixed(2)}`,
                name,
              ]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="WTI"
              stroke="#F59E0B"
              strokeWidth={2}
              fill="url(#wtiGrad)"
            />
            <Area
              type="monotone"
              dataKey="BRENT"
              stroke="#F97316"
              strokeWidth={2}
              fill="url(#brentGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
