"use client";

interface Props {
  reservesDays: number | null;
  reservesBbl?: number | null;
}

function getColor(days: number): string {
  if (days >= 365) return "#22C55E";
  if (days >= 90) return "#F59E0B";
  if (days >= 30) return "#F97316";
  return "#EF4444";
}

function getLabel(days: number): string {
  if (days >= 365) return "Abundant";
  if (days >= 90) return "Comfortable";
  if (days >= 30) return "Moderate";
  return "Critical";
}

export default function ReservesGauge({ reservesDays, reservesBbl }: Props) {
  if (reservesDays == null) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-heading text-sm font-bold text-white mb-2">
          Strategic Petroleum Reserves
        </h3>
        <p className="text-gray-500 text-sm">No reserves data available.</p>
      </div>
    );
  }

  const cappedDays = Math.min(reservesDays, 1000);
  const pct = (cappedDays / 1000) * 100;
  const color = getColor(reservesDays);
  const label = getLabel(reservesDays);

  return (
    <div className="glass-card p-6">
      <h3 className="font-heading text-sm font-bold text-white mb-4">
        Strategic Petroleum Reserves
      </h3>

      <div className="flex items-end gap-4 mb-4">
        <div>
          <div className="stat-number text-4xl font-bold" style={{ color }}>
            {reservesDays.toLocaleString()}
          </div>
          <div className="text-gray-400 text-sm mt-1">days of supply</div>
        </div>
        <div className="mb-1">
          <span
            className="text-xs font-mono font-bold px-2 py-1 rounded"
            style={{ background: `${color}22`, color }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>0</span>
        <span>500d</span>
        <span>1000d</span>
      </div>

      {reservesBbl != null && (
        <div className="mt-3 text-xs text-gray-500">
          Proven reserves:{" "}
          <span className="text-gray-300">
            {(reservesBbl / 1_000_000_000).toFixed(1)}B barrels
          </span>
        </div>
      )}
    </div>
  );
}
