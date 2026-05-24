/**
 * Static data adapter for GitHub Pages deployment.
 * Reads from JSON files (exported by the Go backend) when no API backend is available.
 */

const baseUrl = import.meta.env.VITE_BASE_URL || '';
const DATA_BASE = `${baseUrl}data`;

export interface SectorRow {
  datetime: string;
  name: string;
  net: number;
  rate: number;
  input_date: string;
}

export interface SectorAllRow {
  date: string;
  code: string;
  name: string;
  net: number;
  rate: number;
}

export interface CopywritingRow {
  date: string;
  session: string;
  type: string;
  content: string;
}

export interface TickEventRow {
  date: string;
  session: string;
  type: string;
  payload: string;
}

export interface CLSNewsRow {
  id: number;
  title: string;
  content: string;
  brief: string;
  level: string;
  reading_num: number;
  ctime: string;
  shareurl: string;
  sectors: string;
  created_at: string;
}

async function fetchJSON<T>(filename: string): Promise<T> {
  const res = await fetch(`${DATA_BASE}/${filename}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${filename}`);
  return res.json();
}

// Cache for loaded data (avoid re-fetching on every render)
let cache: Record<string, any> = {};

export function clearCache() {
  cache = {};
}

export async function getSectors(): Promise<SectorRow[]> {
  if (!cache.sectors) cache.sectors = await fetchJSON<SectorRow[]>('sectors.json');
  return cache.sectors;
}

export async function getSectorsAll(): Promise<SectorAllRow[]> {
  if (!cache.sectorsAll) cache.sectorsAll = await fetchJSON<SectorAllRow[]>('sectors_all.json');
  return cache.sectorsAll;
}

export async function getCopywriting(): Promise<CopywritingRow[]> {
  if (!cache.copywriting) cache.copywriting = await fetchJSON<CopywritingRow[]>('copywriting.json');
  return cache.copywriting;
}

export async function getTickEvents(): Promise<TickEventRow[]> {
  if (!cache.tickEvents) cache.tickEvents = await fetchJSON<TickEventRow[]>('tick_events.json');
  return cache.tickEvents;
}

export async function getCLSNews(): Promise<CLSNewsRow[]> {
  if (!cache.clsNews) cache.clsNews = await fetchJSON<CLSNewsRow[]>('cls_news.json');
  return cache.clsNews;
}

/** Get the latest date from sectors data */
export async function getLatestDate(): Promise<string | null> {
  const sectors = await getSectors();
  if (sectors.length === 0) return null;
  // Dates are in "2026-05-19 09:30" or "2026-05-19" format
  const dates = sectors.map(s => s.datetime.split(' ')[0]);
  const unique = [...new Set(dates)].sort();
  return unique[unique.length - 1] || null;
}

export async function getSectorsAllDates(): Promise<string[]> {
  const all = await getSectorsAll();
  const dates = [...new Set(all.map(s => s.date))].sort();
  return dates;
}

/** Compute dashboard data from static JSON */
export async function getDashboardData() {
  const sectors = await getSectors();
  const dates = [...new Set(sectors.map(s => s.datetime.split(' ')[0]))].sort().reverse();

  // Use the latest date's sector data for ranking
  const latestDate = dates[0];
  const latestSectors = sectors.filter(s => s.datetime.startsWith(latestDate));

  // Sort by net to get ranking
  const sorted = [...latestSectors].sort((a, b) => b.net - a.net);
  const ranking = sorted.map(s => ({ name: s.name, net: s.net, rate: s.rate }));

  const inflowCount = ranking.filter(s => s.net > 0).length;
  const outflowCount = ranking.filter(s => s.net < 0).length;
  const totalNet = ranking.reduce((sum, s) => sum + s.net, 0);

  return {
    dates,
    marketOverview: {
      totalSectors: ranking.length,
      inflowCount,
      outflowCount,
      totalNet,
      topSector: ranking.length > 0 ? { name: ranking[0].name, net: ranking[0].net } : null,
      worstSector: ranking.length > 0 ? { name: ranking[ranking.length - 1].name, net: ranking[ranking.length - 1].net } : null,
    },
    ranking,
    events: [],
    trend: {},
    trendDates: dates,
  };
}
