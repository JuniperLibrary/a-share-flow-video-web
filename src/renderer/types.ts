export interface SectorData {
  name: string;
  net: number;
  rate: number;
  color: string;
}

export interface MarketEvent {
  event_type: string;
  frame: number;
  text: string;
  subtext: string;
  importance: number;
  time?: string;
  sector?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface TimelineEvent {
  time: string;
  timeMinutes: number;
  sector: string;
  title: string;
  description: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface TickerItem {
  time: string;
  text: string;
}

export interface SectorTick {
  name: string;
  color: string;
  data: number[];
  times: string[];
  rate: number;
}

export interface BloombergVideoProps {
  dateStr: string;
  displayDate: string;
  totalFrames?: number;
  sectors: SectorData[];
  events?: MarketEvent[];
  timelineEvents?: TimelineEvent[];
  tickerItems?: TickerItem[];
  format?: 'mobile' | 'tv';
  width?: number;
  height?: number;
  session?: 'morning' | 'full';
  xLim?: [number, number];
  // Voiceover TTS fields — set by Go backend when AI copywriting is available
  titleText?: string;
  contentText?: string;
  titleAudioFile?: string;
  contentAudioFile?: string;
  titleAudioFrames?: number;
  contentAudioFrames?: number;
  baseAnimationFrames?: number;
  // News scene fields
  newsPages?: NewsPage[];
  newsAudioFiles?: string[];
  newsAudioFrames?: number[];
}

export interface NewsItem {
  title: string;
  level: string;
  time: string;
}

export interface SectorNews {
  sector: string;
  news: NewsItem[];
}

export interface NewsPage {
  sectors: SectorNews[];
}

// Multi-day Bar Chart Race types
export interface BarSnapshot {
  date: string;
  time?: string; // "09:30" — tick 时间点
  bars: SectorData[];
}

export interface TrendInsight {
  day: string;
  title: string;
  description: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sector: string;
}

export interface RankingChange {
  from_day: string;
  to_day: string;
  from_rank: number;
  to_rank: number;
  sector: string;
  description: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface SummaryText {
  title: string;
  content: string;
  key_sectors: string[];
}

export interface MultiDayTicker {
  day: string;
  text: string;
}

export interface MultiDayAnalysis {
  trendInsights: TrendInsight[];
  rankingChanges: RankingChange[];
  summaryText: SummaryText;
  tickerItems: MultiDayTicker[];
}

export interface MultiDayVideoProps {
  dates: string[];
  fullDates: string[];
  snapshots: BarSnapshot[];
  analysis: MultiDayAnalysis;
  format: 'mobile' | 'tv';
  width: number;
  height: number;
  totalFrames: number;
}