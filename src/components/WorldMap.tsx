"use client";

import { useState, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleSequential } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import { useRouter } from "next/navigation";
import type { MapMode } from "@/types/oil";
import { COUNTRIES } from "@/lib/countries";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/** ISO numeric → ISO2 mapping for TopoJSON */
const NUMERIC_TO_ISO2: Record<string, string> = {
  "840": "US", "682": "SA", "643": "RU", "124": "CA", "368": "IQ",
  "156": "CN", "784": "AE", "076": "BR", "364": "IR", "414": "KW",
  "484": "MX", "578": "NO", "398": "KZ", "566": "NG", "434": "LY",
  "024": "AO", "012": "DZ", "826": "GB", "356": "IN", "392": "JP",
  "410": "KR", "276": "DE", "250": "FR", "380": "IT", "724": "ES",
  "036": "AU", "360": "ID", "764": "TH", "702": "SG", "818": "EG",
  "862": "VE", "170": "CO", "218": "EC", "634": "QA", "512": "OM",
  "458": "MY", "710": "ZA", "792": "TR", "616": "PL", "528": "NL",
  "586": "PK",
};

interface Props {
  mode: MapMode;
  productionData: Record<string, number>;
  sanctionedCountries: string[];
  alertedCountries: string[];
  onCountryHover: (iso: string | null) => void;
  hoveredCountry: string | null;
}

export default function WorldMap({
  mode,
  productionData,
  sanctionedCountries,
  alertedCountries,
  onCountryHover,
  hoveredCountry,
}: Props) {
  const router = useRouter();
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);

  const maxProd = Math.max(...Object.values(productionData), 1);
  const colorScale = scaleSequential(interpolateYlOrRd).domain([0, maxProd]);

  const getFill = useCallback(
    (iso: string) => {
      if (mode === "sanctions") {
        return sanctionedCountries.includes(iso) ? "#EF4444" : "#1F2937";
      }
      if (mode === "news") {
        if (alertedCountries.includes(iso)) return "#EF4444";
        return "#1F2937";
      }
      // production / default
      const val = productionData[iso] ?? 0;
      if (val === 0) return "#1F2937";
      return colorScale(val);
    },
    [mode, productionData, sanctionedCountries, alertedCountries, colorScale]
  );

  const handleMouseEnter = useCallback(
    (geo: { properties: { numeric?: string } }) => {
      const iso = NUMERIC_TO_ISO2[geo.properties.numeric ?? ""];
      if (iso) {
        onCountryHover(iso);
        const name = COUNTRIES[iso]?.name ?? iso;
        const val = productionData[iso];
        if (val) {
          setTooltipContent(`${name}: ${(val / 1000).toFixed(0)}K bbl/d`);
        } else {
          setTooltipContent(name);
        }
      }
    },
    [onCountryHover, productionData]
  );

  const handleMouseLeave = useCallback(() => {
    onCountryHover(null);
    setTooltipContent(null);
  }, [onCountryHover]);

  const handleClick = useCallback(
    (geo: { properties: { numeric?: string } }) => {
      const iso = NUMERIC_TO_ISO2[geo.properties.numeric ?? ""];
      if (iso) {
        router.push(`/country/${iso.toLowerCase()}`);
      }
    },
    [router]
  );

  return (
    <div className="relative w-full h-full">
      {tooltipContent && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 glass-card px-3 py-1.5 text-sm text-white pointer-events-none">
          {tooltipContent}
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup zoom={1}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const iso = NUMERIC_TO_ISO2[geo.properties.numeric ?? ""];
                const isHovered = iso === hoveredCountry;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHovered ? "#F59E0B" : getFill(iso ?? "")}
                    stroke="#0A0A0A"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none", cursor: iso ? "pointer" : "default" },
                      hover: { outline: "none", filter: "brightness(1.3)" },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={() => handleMouseEnter(geo)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClick(geo)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
