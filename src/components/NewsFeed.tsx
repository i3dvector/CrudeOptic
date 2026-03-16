"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { NewsHeadline } from "@/types/oil";
import { COUNTRIES } from "@/lib/countries";

export default function NewsFeed() {
  const [headlines, setHeadlines] = useState<NewsHeadline[]>([]);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news?limit=8");
        const json = await res.json();
        setHeadlines(json.data?.headlines ?? []);
      } catch {
        // Fail silently
      }
    }

    fetchNews();
    const interval = setInterval(fetchNews, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="glass-card p-6">
      <h2 className="font-heading text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-crude-amber animate-pulse" />
        Oil News Feed
      </h2>

      {headlines.length === 0 ? (
        <p className="text-gray-500 text-sm">No news available yet.</p>
      ) : (
        <div className="space-y-3">
          {headlines.map((h, i) => (
            <motion.a
              key={h.id}
              href={h.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm text-gray-200 group-hover:text-white transition-colors leading-snug line-clamp-2">
                  {h.title}
                </h3>
                <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-crude-amber flex-shrink-0 mt-0.5" />
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="text-crude-amber/80">{h.source}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(h.published_at)}
                </span>
                {h.countries?.length > 0 && (
                  <span className="flex gap-1">
                    {h.countries.slice(0, 3).map((iso) => (
                      <span key={iso} title={COUNTRIES[iso]?.name}>
                        {COUNTRIES[iso]?.flag ?? iso}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
}
