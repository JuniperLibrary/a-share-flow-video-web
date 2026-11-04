/**
 * Static data adapter for GitHub Pages deployment.
 * Reads from JSON files (exported by the Go backend) when no API backend is available.
 */

const baseUrl = (import.meta.env.VITE_BASE_URL || '').replace(/\/+$/, '');
const DATA_BASE = `${baseUrl}/data`;

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
  classify_status: string;
  retry_count: number;
  last_retry_at: string;
  last_error: string;
  created_at: string;
}

async function fetchJSON<T>(filename: string): Promise<T> {
  const res = await fetch(`${DATA_BASE}/${filename}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${filename}`);
  return res.json();
}

// Cache in-flight requests as well as loaded data so concurrent page loads
// share one fetch. Failed requests are evicted to allow an explicit retry.
let cache: Record<string, Promise<unknown>> = {};

export function clearCache() {
  cache = {};
}

function loadCached<T>(key: string, filename: string): Promise<T> {
  if (!cache[key]) {
    const pending = fetchJSON<T>(filename);
    cache[key] = pending;
    void pending.catch(() => {
      if (cache[key] === pending) delete cache[key];
    });
  }
  return cache[key] as Promise<T>;
}

export function getSectors(): Promise<SectorRow[]> {
  return loadCached('sectors', 'sectors.json');
}

export function getSectorsAll(): Promise<SectorAllRow[]> {
  return loadCached('sectorsAll', 'sectors_all.json');
}

export function getCopywriting(): Promise<CopywritingRow[]> {
  return loadCached('copywriting', 'copywriting.json');
}

export function getTickEvents(): Promise<TickEventRow[]> {
  return loadCached('tickEvents', 'tick_events.json');
}

export function getCLSNews(): Promise<CLSNewsRow[]> {
  return loadCached('clsNews', 'cls_news.json');
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
  const latestByName = new Map<string, SectorRow>();
  for (const row of latestSectors) {
    const prev = latestByName.get(row.name);
    if (!prev || row.datetime > prev.datetime) {
      latestByName.set(row.name, row);
    }
  }

  // Sort by net to get ranking
  const sorted = [...latestByName.values()].sort((a, b) => b.net - a.net);
  const ranking = sorted.map(s => ({ name: s.name, net: s.net, rate: s.rate, category: '' }));

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
