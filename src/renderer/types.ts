export interface SectorData {
  name: string;
  net: number;
  rate: number;
  changePct?: number;
  superNet?: number;
  superRate?: number;
  bigNet?: number;
  bigRate?: number;
  volume?: number;
  turnover?: number;
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
  times?: string[];
  rate: number;
  changePct?: number;
  superNet?: number;
  superRate?: number;
  bigNet?: number;
  bigRate?: number;
  mainRate?: number;
  volume?: number;
  turnover?: number;
  turnoverRate?: number;
  leadStockName?: string;
  leadStockChangePct?: number;
  totalMarketCap?: number;
  circulatingMarketCap?: number;
}

export interface CatalysisInsight {
  text: string;
  source?: string;
  label?: string;
  timeMatch?: number;
  flowDelta?: number;
  score?: number;
}

export interface CatalysisSectorAnalysis {
  sector: string;
  analysis: string;
  insights: string[];
  newInsights?: CatalysisInsight[];
  confidence?: 'high' | 'medium' | 'low' | string;
  overallScore?: number;
  flow?: number;
  oralBlock?: string;
}

export interface CatalysisResult {
  sectors: CatalysisSectorAnalysis[];
}

export interface MainStructureAction {
  priority: 'high' | 'medium' | 'low' | string;
  text: string;
}

export interface MainStructureResult {
  conclusion: string;
  concentration: string;
  risk: string;
  structure: string;
  outlook: string;
  signal?: string;
  action?: string;
  actions?: MainStructureAction[];
  recap?: string;
  highlight?: string;
  risks?: string;
  plan_intro?: string;
  plan_actions?: string;
}

export interface BloombergVideoProps {
  dateStr: string;
  displayDate: string;
  totalFrames?: number;
  times?: string[];
  sectors: SectorData[];
  events?: MarketEvent[];
  timelineEvents?: TimelineEvent[];
  tickerItems?: TickerItem[];
  format?: 'mobile' | 'tv';
  width?: number;
  height?: number;
  session?: 'morning' | 'full';
  xLim?: [number, number];
  scene1Text?: string;
  scene2Text?: string;
  scene3Text?: string;
  scene4Text?: string;
  scene5Text?: string;
  scene1Audio?: string;
  scene2Audio?: string;
  scene3Audio?: string;
  scene4Audio?: string;
  scene5Audio?: string;
  scene1Frames?: number;
  scene2Frames?: number;
  scene3Frames?: number;
  scene4Frames?: number;
  scene5Frames?: number;
  baseAnimationFrames?: number;
  chartNarrationAudios?: string[];
  chartNarrationFrames?: number[];
  chartNarrationSegments?: number[];
  chartNarrationTexts?: string[];
  newsPages?: NewsPage[];
  newsAudioFiles?: string[];
  newsAudioFrames?: number[];
  newsNarrationTexts?: string[];
  mainStructureAudio?: string;
  mainStructureFrames?: number;
  mainStructureText?: string;
  catalysisResult?: CatalysisResult;
  mainStructureResult?: MainStructureResult;
  farewellAudio?: string;
  farewellFrames?: number;
  farewellText?: string;
  farewellBlessing?: string;
  farewellSignoff?: string;
}

export interface NewsItem {
  title: string;
  brief?: string;
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

export type DebateSpeaker = 'moderator' | 'bull' | 'bear' | 'sector' | 'risk' | 'synthesizer';

export type DebatePhase = 'open' | 'opening' | 'cross_exam' | 'rebuttal' | 'fact_check' | 'closing' | 'synthesis';

export interface DebateCitation {
  source: string;
  ref: string;
  quote?: string;
}

export interface DebateToolCall {
  name: string;
  args?: Record<string, unknown>;
}

export interface DebateTurn {
  index: number;
  phase?: DebatePhase;
  speaker: DebateSpeaker;
  text: string;
  emotion?: string;
  citations?: DebateCitation[];
  toolCalls?: DebateToolCall[];
}

export interface DebateAudioTurn {
  index: number;
  speaker: DebateSpeaker;
  text: string;
  audioFile: string;
  durationSec: number;
  frames: number;
}

export interface DebateVideoProps {
  taskId: string;
  moderatorName: string;
  bullName: string;
  bearName: string;
  sectorName: string;
  riskName: string;
  synthesizerName: string;
  stockName?: string;
  reportPeriod?: string;
  reportTitle: string;
  turns: DebateTurn[];
  audioTurns: DebateAudioTurn[];
  totalFrames: number;
  width: number;
  height: number;
  format: string;
}
