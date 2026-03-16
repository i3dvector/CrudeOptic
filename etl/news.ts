/**
 * ETL: News Intelligence
 * Fetches from GDELT GEO 2.0 + RSS feeds (OilPrice, Reuters, OPEC, EIA)
 * Extracts country mentions, classifies severity, detects chokepoints
 * Writes to Supabase `news_headlines` and `news_alerts`
 * Schedule: Every 30 minutes via GitHub Actions
 */
import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";
import { extractCountries, classifySeverity, detectChokepoint } from "../src/lib/news-geo";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const parser = new Parser();

const RSS_FEEDS = [
  { url: "https://oilprice.com/rss/main", source: "OilPrice.com" },
  { url: "https://www.eia.gov/rss/todayinenergy.xml", source: "EIA" },
];

const GDELT_QUERY =
  "https://api.gdeltproject.org/api/v2/doc/doc?query=oil%20OR%20crude%20OR%20petroleum%20OR%20OPEC&mode=artlist&maxrecords=50&format=json&timespan=1h";

interface GDELTArticle {
  title: string;
  url: string;
  seendate: string;
  domain: string;
  socialimage?: string;
}

interface GDELTResponse {
  articles?: GDELTArticle[];
}

async function fetchGDELT(): Promise<GDELTArticle[]> {
  try {
    const res = await fetch(GDELT_QUERY);
    if (!res.ok) {
      console.warn(`[ETL:news] GDELT returned ${res.status}`);
      return [];
    }
    const data: GDELTResponse = await res.json();
    return data.articles ?? [];
  } catch (err) {
    console.warn("[ETL:news] GDELT fetch failed:", err);
    return [];
  }
}

async function fetchRSSFeeds(): Promise<Array<{ title: string; url: string; source: string; date: string }>> {
  const results: Array<{ title: string; url: string; source: string; date: string }> = [];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of (parsed.items ?? []).slice(0, 15)) {
        results.push({
          title: item.title ?? "",
          url: item.link ?? "",
          source: feed.source,
          date: item.pubDate ?? new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn(`[ETL:news] RSS fetch failed for ${feed.source}:`, err);
    }
  }

  return results;
}

function generateId(title: string, source: string): string {
  const hash = Buffer.from(`${title}:${source}`).toString("base64").slice(0, 20);
  return hash.replace(/[^a-zA-Z0-9]/g, "");
}

async function main() {
  console.log("[ETL:news] Fetching news from GDELT + RSS...");

  const [gdeltArticles, rssItems] = await Promise.all([
    fetchGDELT(),
    fetchRSSFeeds(),
  ]);

  // Process into headlines
  const headlines: Array<{
    id: string;
    title: string;
    source: string;
    url: string;
    published_at: string;
    countries: string[];
    sentiment: string;
    summary: string;
  }> = [];

  const alerts: Array<{
    id: string;
    title: string;
    event_type: string;
    severity: string;
    countries: string[];
    chokepoint_id: string | null;
    published_at: string;
    source_url: string;
  }> = [];

  // Process GDELT articles
  for (const article of gdeltArticles) {
    const id = generateId(article.title, article.domain);
    const countries = extractCountries(article.title);
    const severity = classifySeverity(article.title);
    const chokepoint = detectChokepoint(article.title);

    headlines.push({
      id,
      title: article.title,
      source: article.domain,
      url: article.url,
      published_at: article.seendate
        ? new Date(article.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, "$1-$2-$3T$4:$5:$6Z")).toISOString()
        : new Date().toISOString(),
      countries,
      sentiment: "neutral",
      summary: article.title,
    });

    if (severity === "critical" || severity === "high" || countries.length > 0) {
      alerts.push({
        id: `alert-${id}`,
        title: article.title,
        event_type: chokepoint ? "chokepoint_disruption" : "geopolitical",
        severity,
        countries,
        chokepoint_id: chokepoint,
        published_at: headlines[headlines.length - 1].published_at,
        source_url: article.url,
      });
    }
  }

  // Process RSS items
  for (const item of rssItems) {
    const id = generateId(item.title, item.source);
    const countries = extractCountries(item.title);
    const severity = classifySeverity(item.title);
    const chokepoint = detectChokepoint(item.title);

    headlines.push({
      id,
      title: item.title,
      source: item.source,
      url: item.url,
      published_at: new Date(item.date).toISOString(),
      countries,
      sentiment: "neutral",
      summary: item.title,
    });

    if (severity === "critical" || severity === "high" || chokepoint) {
      alerts.push({
        id: `alert-${id}`,
        title: item.title,
        event_type: chokepoint ? "chokepoint_disruption" : "geopolitical",
        severity,
        countries,
        chokepoint_id: chokepoint,
        published_at: new Date(item.date).toISOString(),
        source_url: item.url,
      });
    }
  }

  // Write headlines
  if (headlines.length > 0) {
    const { error } = await supabase
      .from("news_headlines")
      .upsert(headlines, { onConflict: "id" });

    if (error) console.error("[ETL:news] headlines upsert error:", error);
    else console.log(`[ETL:news] Upserted ${headlines.length} headlines`);
  }

  // Write alerts
  if (alerts.length > 0) {
    const { error } = await supabase
      .from("news_alerts")
      .upsert(alerts, { onConflict: "id" });

    if (error) console.error("[ETL:news] alerts upsert error:", error);
    else console.log(`[ETL:news] Upserted ${alerts.length} alerts`);
  }

  // Cleanup: remove headlines older than 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("news_headlines").delete().lt("published_at", weekAgo);
  await supabase.from("news_alerts").delete().lt("published_at", weekAgo);

  console.log("[ETL:news] Done.");
}

main().catch((err) => {
  console.error("[ETL:news] Fatal:", err);
  process.exit(1);
});
