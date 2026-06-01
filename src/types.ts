export interface Sector {
  name: string;
  net: number;
  rate: number;
  change_pct?: number;
  super_net?: number;
  super_rate?: number;
  big_net?: number;
  big_rate?: number;
  color: string;
  source: string;
  rank_group: string;
  is_auto_fill: boolean;
}

export interface DateItem {
  date: string;
  videos: string[];
  sector_count: number;
  文案_count: number;
  ai_count: number;
}

export interface ConfigData {
  has_api_key: boolean;
  api_base: string;
  model: string;
  sessions: Record<string, string>;
}

export interface SSEMessage {
  type: string;
  text: string;
}

export interface CLSNewsRecord {
  id: number;
  title: string;
  content: string;
  brief: string;
  level: string;
  reading_num: number;
  ctime: string;
  shareurl: string;
  sectors: string; // JSON array string
  created_at: string;
}

export interface NewsListResponse {
  records: CLSNewsRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface NewsSearchResponse extends NewsListResponse {
  q: string;
}

export interface NewsStatusResponse {
  status: string;
  total_news: number;
  last_poll: string;
  last_count: number;
}

export interface NewsDateResponse extends NewsListResponse {
  date: string;
}
