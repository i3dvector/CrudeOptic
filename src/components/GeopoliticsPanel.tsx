"use client";

import { Shield, AlertTriangle, Ban, Users } from "lucide-react";
import type { GeopoliticsEntry } from "@/types/oil";

interface Props {
  data: GeopoliticsEntry;
}

const BODY_COLORS: Record<string, string> = {
  OFAC: "text-red-400 bg-red-500/10 border-red-500/30",
  EU: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  UN: "text-purple-400 bg-purple-500/10 border-purple-500/30",
};

export default function GeopoliticsPanel({ data }: Props) {
  const hasSanctions = data.sanctions?.length > 0;
  const hasEmbargoes = data.embargoes?.length > 0;
  const isOpec = data.opec_member;

  return (
    <div className="glass-card p-6">
      <h3 className="font-heading text-sm font-bold text-white mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4 text-crude-amber" />
        Geopolitical Context
      </h3>

      {/* OPEC status */}
      {isOpec && (
        <div className="flex items-start gap-3 mb-4 p-3 rounded-lg bg-crude-amber/10 border border-crude-amber/20">
          <Users className="w-4 h-4 text-crude-amber mt-0.5" />
          <div>
            <div className="text-crude-amber text-sm font-medium">OPEC Member</div>
            {data.opec_quota_bpd != null && (
              <div className="text-gray-400 text-xs mt-0.5">
                Production quota:{" "}
                <span className="text-white font-mono">
                  {(data.opec_quota_bpd / 1000).toFixed(0)}K bbl/day
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sanctions */}
      {hasSanctions && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-crude-red" />
            Active Sanctions
          </h4>
          <div className="space-y-2">
            {data.sanctions.map((s, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border text-sm ${BODY_COLORS[s.body] ?? "text-gray-300 bg-white/5 border-white/10"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-xs">{s.body}</span>
                  <span className="text-xs opacity-70">Since {s.since}</span>
                </div>
                <div className="opacity-90 font-medium">{s.type}</div>
                <div className="text-xs opacity-70 mt-1">{s.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Embargoes */}
      {hasEmbargoes && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Ban className="w-3 h-3 text-crude-orange" />
            Embargoes
          </h4>
          <div className="space-y-2">
            {data.embargoes.map((e, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-orange-500/30 bg-orange-500/10 text-sm"
              >
                <div className="text-orange-400 font-medium">{e.imposed_by}</div>
                <div className="text-gray-300 text-xs mt-1">{e.details}</div>
                <div className="text-gray-500 text-xs mt-1">Since {e.since}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade restrictions */}
      {data.trade_restrictions?.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Trade Restrictions
          </h4>
          <ul className="space-y-1">
            {data.trade_restrictions.map((r, i) => (
              <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                <span className="text-crude-orange mt-1">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-white/5">
          {data.notes}
        </div>
      )}

      {!hasSanctions && !hasEmbargoes && !isOpec && (
        <div className="text-gray-500 text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-crude-green" />
          No active sanctions or embargoes.
        </div>
      )}
    </div>
  );
}
