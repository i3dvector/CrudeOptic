"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { COUNTRIES, formatNumber } from "@/lib/countries";

interface CountryCardProps {
  iso: string;
  production_bpd: number | null;
  rank?: number | null;
  label?: string;
}

export default function CountryCard({
  iso,
  production_bpd,
  rank,
  label,
}: CountryCardProps) {
  const country = COUNTRIES[iso];
  const name = country?.name ?? iso;
  const flag = country?.flag ?? "";

  return (
    <Link href={`/country/${iso.toLowerCase()}`}>
      <motion.div
        className="glass-card-hover p-4 cursor-pointer"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{flag}</span>
            <div>
              <h3 className="text-white font-heading font-semibold text-sm">
                {name}
              </h3>
              {label && (
                <span className="text-xs text-gray-400">{label}</span>
              )}
            </div>
          </div>
          {rank && (
            <span className="bg-crude-amber/20 text-crude-amber text-xs font-mono font-bold px-2 py-0.5 rounded">
              #{rank}
            </span>
          )}
        </div>
        <div className="mt-3">
          <div className="text-xs text-gray-400 uppercase tracking-wider">
            Production
          </div>
          <div className="stat-number text-lg font-bold gradient-text">
            {formatNumber(production_bpd)} bbl/d
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
