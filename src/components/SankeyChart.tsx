"use client";

import { useEffect, useRef } from "react";
import { select } from "d3-selection";
import { sankey, sankeyLinkHorizontal, SankeyGraph } from "d3-sankey";
import type { TradeFlow } from "@/types/oil";
import { getCountryName, COUNTRIES } from "@/lib/countries";

interface SankeyNodeDatum {
  name: string;
  iso?: string;
}

interface SankeyLinkDatum {
  value: number;
}

interface Props {
  flows: TradeFlow[];
  type: "imports" | "exports";
  iso: string;
}

export default function SankeyChart({ flows, type, iso }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || flows.length === 0) return;

    const width = svgRef.current.clientWidth || 560;
    const height = 300;
    const margin = { top: 10, right: 120, bottom: 10, left: 120 };

    // Build nodes and links
    const nodeMap = new Map<string, number>();
    const nodes: SankeyNodeDatum[] = [];
    const links: Array<{ source: number; target: number; value: number }> = [];

    function addNode(id: string, label: string, nodeIso?: string): number {
      if (!nodeMap.has(id)) {
        nodeMap.set(id, nodes.length);
        nodes.push({ name: label, iso: nodeIso });
      }
      return nodeMap.get(id)!;
    }

    const mainName = getCountryName(iso);
    addNode(iso, mainName, iso);

    for (const f of flows.slice(0, 10)) {
      if (type === "imports") {
        const srcName = getCountryName(f.source_iso);
        addNode(f.source_iso, srcName, f.source_iso);
        links.push({
          source: nodeMap.get(f.source_iso)!,
          target: nodeMap.get(iso)!,
          value: Math.max(f.volume_bpd || 1, 1),
        });
      } else {
        const tgtName = getCountryName(f.target_iso);
        addNode(f.target_iso, tgtName, f.target_iso);
        links.push({
          source: nodeMap.get(iso)!,
          target: nodeMap.get(f.target_iso)!,
          value: Math.max(f.volume_bpd || 1, 1),
        });
      }
    }

    const svg = select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const g = svg.append("g");

    const layout = sankey<SankeyNodeDatum, SankeyLinkDatum>()
      .nodeId((d) => d.name)
      .nodeWidth(12)
      .nodePadding(10)
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ]);

    const graph: SankeyGraph<SankeyNodeDatum, SankeyLinkDatum> = layout({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l })),
    });

    // Draw links
    g.append("g")
      .selectAll("path")
      .data(graph.links)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", "#F59E0B")
      .attr("stroke-width", (d) => Math.max(1, d.width ?? 1))
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
      .attr("x", (d) => d.x0 ?? 0)
      .attr("y", (d) => d.y0 ?? 0)
      .attr("width", (d) => (d.x1 ?? 0) - (d.x0 ?? 0))
      .attr("height", (d) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .attr("fill", (d) => {
        const nodeIso = (d as SankeyNodeDatum & { iso?: string }).iso;
        return nodeIso === iso ? "#F97316" : "#F59E0B";
      })
      .attr("rx", 3);

    // Draw labels
    g.append("g")
      .selectAll("text")
      .data(graph.nodes)
      .join("text")
      .attr("x", (d) => ((d.x0 ?? 0) < width / 2 ? (d.x0 ?? 0) - 6 : (d.x1 ?? 0) + 6))
      .attr("y", (d) => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => ((d.x0 ?? 0) < width / 2 ? "end" : "start"))
      .attr("font-size", "11")
      .attr("fill", "#D1D5DB")
      .text((d) => {
        const nodeIso = (d as SankeyNodeDatum & { iso?: string }).iso;
        const flag = nodeIso ? (COUNTRIES[nodeIso]?.flag ?? "") : "";
        return `${flag} ${d.name}`.slice(0, 20);
      });
  }, [flows, type, iso]);

  if (flows.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-heading text-sm font-bold text-white mb-2">
          {type === "imports" ? "Import Sources" : "Export Destinations"}
        </h3>
        <p className="text-gray-500 text-sm">No trade flow data available.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="font-heading text-sm font-bold text-white mb-4">
        {type === "imports" ? "Import Sources" : "Export Destinations"}
      </h3>
      <svg ref={svgRef} className="w-full" />
    </div>
  );
}
