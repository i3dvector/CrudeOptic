"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleSequential } from "d3-scale";
import { interpolateYlOrRd, interpolateBlues, interpolateGreens } from "d3-scale-chromatic";
import { useRouter } from "next/navigation";
import type { MapMode } from "@/types/oil";
import { COUNTRIES } from "@/lib/countries";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/** ISO 3166-1 numeric → ISO 3166-1 alpha-2 (all countries in world-atlas@2 110m) */
const NUMERIC_TO_ISO2: Record<string, string> = {
  "004": "AF", "008": "AL", "010": "AQ", "012": "DZ", "024": "AO",
  "031": "AZ", "032": "AR", "036": "AU", "040": "AT", "044": "BS",
  "050": "BD", "051": "AM", "056": "BE", "064": "BT", "068": "BO",
  "070": "BA", "072": "BW", "076": "BR", "084": "BZ", "090": "SB",
  "096": "BN", "100": "BG", "104": "MM", "108": "BI", "112": "BY",
  "116": "KH", "120": "CM", "124": "CA", "140": "CF", "144": "LK",
  "148": "TD", "152": "CL", "156": "CN", "158": "TW", "170": "CO",
  "178": "CG", "180": "CD", "188": "CR", "191": "HR", "192": "CU",
  "196": "CY", "203": "CZ", "204": "BJ", "208": "DK", "214": "DO",
  "218": "EC", "222": "SV", "226": "GQ", "231": "ET", "232": "ER",
  "233": "EE", "238": "FK", "242": "FJ", "246": "FI", "250": "FR",
  "260": "TF", "262": "DJ", "266": "GA", "268": "GE", "270": "GM",
  "275": "PS", "276": "DE", "288": "GH", "300": "GR", "304": "GL",
  "320": "GT", "324": "GN", "328": "GY", "332": "HT", "334": "MG",
  "340": "HN", "348": "HU", "352": "IS", "356": "IN", "360": "ID",
  "364": "IR", "368": "IQ", "372": "IE", "376": "IL", "380": "IT",
  "384": "CI", "388": "JM", "392": "JP", "398": "KZ", "400": "JO",
  "404": "KE", "408": "KP", "410": "KR", "414": "KW", "417": "KG",
  "418": "LA", "422": "LB", "426": "LS", "428": "LV", "430": "LR",
  "434": "LY", "440": "LT", "442": "LU", "454": "MW", "458": "MY",
  "466": "ML", "478": "MR", "484": "MX", "496": "MN", "498": "MD",
  "499": "ME", "504": "MA", "508": "MZ", "512": "OM", "516": "NA",
  "524": "NP", "528": "NL", "540": "NC", "548": "VU", "554": "NZ",
  "558": "NI", "562": "NE", "566": "NG", "578": "NO", "586": "PK",
  "591": "PA", "598": "PG", "600": "PY", "604": "PE", "608": "PH",
  "616": "PL", "620": "PT", "624": "GW", "626": "TL", "630": "PR",
  "634": "QA", "642": "RO", "643": "RU", "646": "RW", "682": "SA",
  "686": "SN", "688": "RS", "694": "SL", "700": "SG", "703": "SK",
  "705": "SI", "706": "SO", "710": "ZA", "716": "ZW", "724": "ES",
  "728": "SS", "729": "SD", "732": "EH", "740": "SR", "748": "SZ",
  "752": "SE", "756": "CH", "760": "SY", "762": "TJ", "764": "TH",
  "768": "TG", "780": "TT", "784": "AE", "788": "TN", "792": "TR",
  "795": "TM", "800": "UG", "804": "UA", "807": "MK", "818": "EG",
  "826": "GB", "834": "TZ", "840": "US", "854": "BF", "858": "UY",
  "860": "UZ", "862": "VE", "887": "YE", "894": "ZM",
  "702": "SG",
};

const BASE_FILL = "#2A3441";
const BASE_STROKE = "#141B22";

interface Props {
  mode: MapMode;
  productionData: Record<string, number>;
  consumptionData: Record<string, number>;
  reservesData: Record<string, number>;
  sanctionedCountries: string[];
  alertedCountries: string[];
  onCountryHover: (iso: string | null) => void;
  hoveredCountry: string | null;
}

export default function WorldMap({
  mode,
  productionData,
  consumptionData,
  reservesData,
  sanctionedCountries,
  alertedCountries,
  onCountryHover,
  hoveredCountry,
}: Props) {
  const router = useRouter();
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);

  const prodScale = useMemo(() => {
    const max = Math.max(...Object.values(productionData), 1);
    return scaleSequential(interpolateYlOrRd).domain([0, max]);
  }, [productionData]);

  const consScale = useMemo(() => {
    const max = Math.max(...Object.values(consumptionData), 1);
    return scaleSequential(interpolateBlues).domain([0, max]);
  }, [consumptionData]);

  const resScale = useMemo(() => {
    const max = Math.max(...Object.values(reservesData), 1);
    return scaleSequential(interpolateGreens).domain([0, max]);
  }, [reservesData]);

  const getFill = useCallback(
    (iso: string) => {
      if (!iso) return BASE_FILL;

      switch (mode) {
        case "sanctions":
          return sanctionedCountries.includes(iso) ? "#EF4444" : BASE_FILL;
        case "news":
          return alertedCountries.includes(iso) ? "#EF4444" : BASE_FILL;
        case "production": {
          const val = productionData[iso] ?? 0;
          return val === 0 ? BASE_FILL : prodScale(val);
        }
        case "consumption": {
          const val = consumptionData[iso] ?? 0;
          return val === 0 ? BASE_FILL : consScale(val);
        }
        case "reserves": {
          const val = reservesData[iso] ?? 0;
          return val === 0 ? BASE_FILL : resScale(val);
        }
        case "imports":
        case "exports": {
          // Use production data as proxy since we don't have trade flow data yet
          const val = productionData[iso] ?? 0;
          return val === 0 ? BASE_FILL : prodScale(val);
        }
        default:
          return BASE_FILL;
      }
    },
    [mode, productionData, consumptionData, reservesData, sanctionedCountries, alertedCountries, prodScale, consScale, resScale]
  );

  const getTooltip = useCallback(
    (iso: string): string => {
      const name = COUNTRIES[iso]?.name ?? iso;
      switch (mode) {
        case "production": {
          const val = productionData[iso];
          return val ? `${name}: ${(val / 1_000_000).toFixed(2)}M bbl/d` : name;
        }
        case "consumption": {
          const val = consumptionData[iso];
          return val ? `${name}: ${val.toLocaleString()} K bbl/d` : name;
        }
        case "reserves": {
          const val = reservesData[iso];
          return val ? `${name}: ${val.toFixed(1)}B bbl` : name;
        }
        case "sanctions":
          return sanctionedCountries.includes(iso) ? `${name} — Sanctioned` : name;
        case "news":
          return alertedCountries.includes(iso) ? `${name} — Active alerts` : name;
        default:
          return name;
      }
    },
    [mode, productionData, consumptionData, reservesData, sanctionedCountries, alertedCountries]
  );

  const handleMouseEnter = useCallback(
    (geo: { id?: string; properties?: { name?: string } }) => {
      const iso = NUMERIC_TO_ISO2[geo.id ?? ""];
      if (iso) {
        onCountryHover(iso);
        setTooltipContent(getTooltip(iso));
      } else if (geo.properties?.name) {
        setTooltipContent(geo.properties.name);
      }
    },
    [onCountryHover, getTooltip]
  );

  const handleMouseLeave = useCallback(() => {
    onCountryHover(null);
    setTooltipContent(null);
  }, [onCountryHover]);

  const handleClick = useCallback(
    (geo: { id?: string }) => {
      const iso = NUMERIC_TO_ISO2[geo.id ?? ""];
      if (iso && COUNTRIES[iso]) {
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
                const iso = NUMERIC_TO_ISO2[geo.id ?? ""];
                const isHovered = iso === hoveredCountry;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHovered ? "#F59E0B" : getFill(iso ?? "")}
                    stroke={BASE_STROKE}
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
