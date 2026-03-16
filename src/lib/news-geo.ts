import type { ISO2 } from "@/types/oil";

/** Keyword → country ISO mapping for auto-tagging news */
const KEYWORD_TO_COUNTRY: Record<string, ISO2[]> = {
  // Country names
  "saudi arabia": ["SA"],
  "saudi": ["SA"],
  "russia": ["RU"],
  "russian": ["RU"],
  "iran": ["IR"],
  "iranian": ["IR"],
  "iraq": ["IQ"],
  "iraqi": ["IQ"],
  "china": ["CN"],
  "chinese": ["CN"],
  "india": ["IN"],
  "indian": ["IN"],
  "united states": ["US"],
  "u.s.": ["US"],
  "america": ["US"],
  "venezuela": ["VE"],
  "venezuelan": ["VE"],
  "libya": ["LY"],
  "libyan": ["LY"],
  "nigeria": ["NG"],
  "nigerian": ["NG"],
  "angola": ["AO"],
  "algeria": ["DZ"],
  "kuwait": ["KW"],
  "kuwaiti": ["KW"],
  "uae": ["AE"],
  "emirates": ["AE"],
  "qatar": ["QA"],
  "oman": ["OM"],
  "norway": ["NO"],
  "norwegian": ["NO"],
  "canada": ["CA"],
  "canadian": ["CA"],
  "brazil": ["BR"],
  "brazilian": ["BR"],
  "mexico": ["MX"],
  "mexican": ["MX"],
  "kazakhstan": ["KZ"],
  "colombia": ["CO"],
  "ecuador": ["EC"],
  "japan": ["JP"],
  "south korea": ["KR"],
  "germany": ["DE"],
  "france": ["FR"],
  "united kingdom": ["GB"],
  "uk": ["GB"],
  "egypt": ["EG"],

  // Organizations
  "opec": ["SA", "IQ", "IR", "KW", "AE", "VE", "LY", "NG", "AO", "DZ", "EC", "QA"],
  "opec+": ["SA", "IQ", "IR", "KW", "AE", "VE", "LY", "NG", "AO", "DZ", "EC", "QA", "RU", "KZ", "MX"],

  // Chokepoints
  "strait of hormuz": ["IR", "AE", "SA", "IQ", "KW", "QA", "OM"],
  "hormuz": ["IR", "AE", "SA", "IQ", "KW", "QA", "OM"],
  "suez canal": ["EG"],
  "suez": ["EG"],
  "bab el-mandeb": ["EG"],
  "bab-el-mandeb": ["EG"],
  "strait of malacca": ["MY", "ID", "SG"],
  "malacca": ["MY", "ID", "SG"],

  // Sanctions-related
  "sanctions": [],
  "embargo": [],
  "oil embargo": [],
};

/** Severity keywords for alert classification */
const SEVERITY_KEYWORDS: Record<string, string[]> = {
  critical: ["blockade", "war", "attack", "explosion", "shut down", "halt", "suspend"],
  high: ["sanctions", "embargo", "disruption", "threat", "tension", "conflict", "crisis"],
  medium: ["cut", "reduce", "quota", "restriction", "dispute", "protest"],
  low: ["meeting", "talks", "negotiate", "plan", "consider", "review"],
};

/** Extract country ISO codes mentioned in text */
export function extractCountries(text: string): ISO2[] {
  const lower = text.toLowerCase();
  const found = new Set<ISO2>();

  for (const [keyword, isos] of Object.entries(KEYWORD_TO_COUNTRY)) {
    if (lower.includes(keyword)) {
      isos.forEach((iso) => found.add(iso));
    }
  }

  return Array.from(found);
}

/** Classify alert severity from text */
export function classifySeverity(text: string): "critical" | "high" | "medium" | "low" {
  const lower = text.toLowerCase();

  for (const [level, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return level as "critical" | "high" | "medium" | "low";
      }
    }
  }

  return "low";
}

/** Detect if text is related to a chokepoint and return its ID */
export function detectChokepoint(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("hormuz")) return "hormuz";
  if (lower.includes("suez")) return "suez";
  if (lower.includes("bab el-mandeb") || lower.includes("bab-el-mandeb") || lower.includes("red sea"))
    return "bab-el-mandeb";
  if (lower.includes("malacca")) return "malacca";
  if (lower.includes("bosphorus") || lower.includes("turkish straits")) return "bosphorus";
  if (lower.includes("panama canal")) return "panama";
  return null;
}
