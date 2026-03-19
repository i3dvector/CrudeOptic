"use client";

import { useEffect, useRef, useState } from "react";
import { select } from "d3-selection";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import type { TradeFlow } from "@/types/oil";
import { getCountryName } from "@/lib/countries";

interface Props {
  flows: TradeFlow[];
  type: "imports" | "exports";
  iso: string;
}

export default function SankeyChart({ flows, type, iso }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || flows.length === 0) return;

    try {
      const width = svgRef.current.clientWidth || 560;
      const height = 300;
      const margin = { top: 10, right: 120, bottom: 10, left: 120 };

      // Build nodes and links using ISO as unique node ID
      const nodeSet = new Set<string>();
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const nodes: any[] = [];
      const links: any[] = [];

      const ensureNode = (nodeIso: string) => {
        if (!nodeSet.has(nodeIso)) {
          nodeSet.add(nodeIso);
          nodes.push({ id: nodeIso, name: getCountryName(nodeIso) });
        }
      };

      ensureNode(iso);

      // Deduplicate flows by partner ISO, top 10 only
      const seen = new Set<string>();
      for (const f of flows) {
        if (seen.size >= 10) break;

        const partnerIso = type === "imports" ? f.source_iso : f.target_iso;
        if (partnerIso === iso || seen.has(partnerIso)) continue;
        seen.add(partnerIso);

        ensureNode(partnerIso);
        const value = Math.max(f.value_usd || f.volume_bpd || 1, 1);

        if (type === "imports") {
          links.push({ source: partnerIso, target: iso, value });
        } else {
          links.push({ source: iso, target: partnerIso, value });
        }
      }

      if (links.length === 0) return;

      const svg = select(svgRef.current)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", width)
        .attr("height", height);

      svg.selectAll("*").remove();

      const g = svg.append("g");

      const layout = sankey()
        .nodeId((d: any) => d.id)
        .nodeWidth(12)
        .nodePadding(10)
        .extent([
          [margin.left, margin.top],
          [width - margin.right, height - margin.bottom],
        ]);

      const graph = layout({
        nodes: nodes.map((n: any) => ({ ...n })),
        links: links.map((l: any) => ({ ...l })),
      });

      // Draw links
      g.append("g")
        .selectAll("path")
        .data(graph.links)
        .join("path")
        .attr("d", sankeyLinkHorizontal())
        .attr("stroke", "#F59E0B")
        .attr("stroke-width", (d: any) => Math.max(1, d.width ?? 1))
        .attr("fill", "none")
        .attr("opacity", 0.4)
        .on("mouseover", function () {
          select(this).attr("opacity", 0.8);
        })
        .on("mouseout", function () {
          select(this).attr("opacity", 0.4);
        });

      // Draw nodes
      g.append("g")
        .selectAll("rect")
        .data(graph.nodes)
        .join("rect")
        .attr("x", (d: any) => d.x0 ?? 0)
        .attr("y", (d: any) => d.y0 ?? 0)
        .attr("width", (d: any) => (d.x1 ?? 0) - (d.x0 ?? 0))
        .attr("height", (d: any) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
        .attr("fill", (d: any) => (d.id === iso ? "#F97316" : "#F59E0B"))
        .attr("rx", 3);

      // Draw labels
      g.append("g")
        .selectAll("text")
        .data(graph.nodes)
        .join("text")
        .attr("x", (d: any) =>
          (d.x0 ?? 0) < width / 2 ? (d.x0 ?? 0) - 6 : (d.x1 ?? 0) + 6
        )
        .attr("y", (d: any) => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", (d: any) =>
          (d.x0 ?? 0) < width / 2 ? "end" : "start"
        )
        .attr("font-size", "11")
        .attr("fill", "#D1D5DB")
        .text((d: any) => (d.name ?? d.id ?? "").slice(0, 20));

      setError(null);
    } catch (err) {
      console.error("[SankeyChart] Render error:", err);
      setError(err instanceof Error ? err.message : "Chart render failed");
    }
  }, [flows, type, iso]);

  const title = type === "imports" ? "Import Sources" : "Export Destinations";

  if (flows.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-heading text-sm font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-500 text-sm">No trade flow data available.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-heading text-sm font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-500 text-sm">Chart could not render.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="font-heading text-sm font-bold text-white mb-4">{title}</h3>
      <svg ref={svgRef} className="w-full" />
    </div>
  );
}
