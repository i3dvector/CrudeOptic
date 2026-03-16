"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Shield, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { NewsAlert } from "@/types/oil";
import { COUNTRIES } from "@/lib/countries";

const SEVERITY_STYLES = {
  critical: "border-red-500/50 bg-red-500/10 text-red-400",
  high: "border-orange-500/50 bg-orange-500/10 text-orange-400",
  medium: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  low: "border-blue-500/50 bg-blue-500/10 text-blue-400",
};

const SEVERITY_ICONS = {
  critical: AlertTriangle,
  high: AlertTriangle,
  medium: Shield,
  low: Shield,
};

export default function AlertsBanner() {
  const [alerts, setAlerts] = useState<NewsAlert[]>([]);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch("/api/news?limit=5");
        const json = await res.json();
        setAlerts(json.data?.alerts ?? []);
      } catch {
        // Fail silently
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="glass-card p-6">
      <h2 className="font-heading text-lg font-bold text-white mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-crude-red" />
        Live Alerts
      </h2>

      <AnimatePresence>
        <div className="space-y-3">
          {alerts.map((alert, i) => {
            const severity = alert.severity as keyof typeof SEVERITY_STYLES;
            const Icon = SEVERITY_ICONS[severity] ?? Shield;

            return (
              <motion.div
                key={alert.id}
                className={`p-3 rounded-lg border ${SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.low}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-start gap-2">
                  <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug line-clamp-2">
                      {alert.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs opacity-75">
                      {alert.chokepoint_id && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {alert.chokepoint_id}
                        </span>
                      )}
                      {alert.countries?.length > 0 && (
                        <span>
                          {alert.countries
                            .slice(0, 4)
                            .map((iso) => COUNTRIES[iso]?.flag ?? iso)
                            .join(" ")}
                          {alert.countries.length > 4 &&
                            ` +${alert.countries.length - 4}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                      severity === "critical"
                        ? "bg-red-500/20 animate-pulse-glow"
                        : ""
                    }`}
                  >
                    {severity}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
}
