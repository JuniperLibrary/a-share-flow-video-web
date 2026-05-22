import { apiUrl } from '../utils';

export interface MarketOverview {
  totalSectors: number;
  inflowCount: number;
  outflowCount: number;
  totalNet: number;
  topSector: { name: string; net: number } | null;
  worstSector: { name: string; net: number } | null;
}

export interface RankingItem {
  name: string;
  net: number;
}

export interface TickEvent {
  time: string;
  sector: string;
  title: string;
  description: string;
  sentiment: string;
}

export interface TrendPoint {
  date: string;
  net: number;
}

export interface DashboardResponse {
  dates: string[];
  marketOverview: MarketOverview;
  ranking: RankingItem[];
  events: TickEvent[];
  trend: Record<string, TrendPoint[]>;
  trendDates: string[];
}

export async function fetchDashboardData(): Promise<DashboardResponse> {
  const res = await fetch(apiUrl('/api/dashboard'));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: DashboardResponse = await res.json();
  return data;
}
