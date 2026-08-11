export interface Sector {
  name: string;
  net: number;
  rate: number;
  change_pct?: number;
  super_net?: number;
  super_rate?: number;
  big_net?: number;
  big_rate?: number;
  volume?: number;
  turnover?: number;
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
  models?: Record<string, string>;
  sessions: Record<string, string>;
}

export type SectorCategory = 'industry' | 'concept' | 'region';

export interface SectorCatalogItem {
  bk_code: string;
  name: string;
  category: SectorCategory;
}

export interface SectorWatchItem {
  bk_code: string;
  name: string;
  category: SectorCategory;
  enabled: boolean;
}

export interface SSEMessage {
  type: string;
  text: string;
}

export interface TickGenerateTaskStatus {
  task_id: string;
  date: string;
  session: string;
  copy_mode: string;
  format: string;
  status: 'pending' | 'running' | 'done' | 'error' | 'cancelled';
  progress: string;
  logs: string[];
  error?: string;
  existing?: boolean;
  cancellable?: boolean;
  mobile_path?: string;
  mobile_url?: string;
  tv_path?: string;
  tv_url?: string;
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
  classify_status: string;
  retry_count: number;
  last_retry_at: string;
  last_error: string;
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
  pending_count: number;
  retrying_count: number;
  failed_count: number;
  skipped_count: number;
  classified_count: number;
  last_retry: string;
  last_retry_at: string;
  last_retry_queued: number;
  last_retry_dropped: number;
}

export interface NewsDateResponse extends NewsListResponse {
  date: string;
}

export interface DebateHistoryEntry {
  task_id: string;
  stock_code: string;
  stock_name: string;
  report_summary: string;
  turn_count: number;
  format: string;
  video_path: string;
  created_at: string;
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

export interface DebateScript {
  turns: DebateTurn[];
  reportHash?: string;
  stockCode?: string;
  stockName?: string;
  sessionId?: string;
  previousRefs?: string;
  verdict?: string;
}

export interface DebateAudioTurn {
  index: number;
  speaker: DebateSpeaker;
  text: string;
  audioFile: string;
  durationSec: number;
  frames: number;
}

export interface SectorSummary {
  name: string;
  category?: string;
  net: number;
  changePct: number;
  superNet: number;
  bigNet: number;
  superRate: number;
  bigRate: number;
  turnoverRate: number;
  leadStockName: string;
  leadStockChangePct: number;
  totalMarketCap: number;
  circulatingMarketCap: number;
}

export interface NewsBrief {
  title: string;
  level: string;
  time: string;
  brief?: string;
  sectors?: string[];
}

export interface ReportMetric {
  label: string;
  value: string;
  note?: string;
  tone?: 'up' | 'down' | 'neutral';
}

export interface ReportHighlight {
  title: string;
  detail: string;
  tone?: 'up' | 'down' | 'neutral';
}

export interface ReportBullet {
  title: string;
  detail?: string;
}

export interface ReportCard {
  index: number;
  total: number;
  tag: string;
  title: string;
  subtitle: string;
  metrics?: ReportMetric[];
  highlights?: ReportHighlight[];
  bullets?: ReportBullet[];
  footer?: string;
}

export interface TimelineEvent {
  time: string;
  timeMinutes: number;
  sector: string;
  title: string;
  description: string;
  sentiment: string;
}

export interface DailyReport {
  date: string;
  session: string;
  summary: string;
  outlook: string;
  report?: string;
  netTotal?: number;
  inflowCount?: number;
  outflowCount?: number;
  superNetTotal?: number;
  bigNetTotal?: number;
  structureDesc?: string;
  generated?: boolean;
  // parsed from report JSON string
  _parsed?: {
    date: string;
    createdAt: string;
    session: string;
    netTotal: number;
    inflowCount: number;
    outflowCount: number;
    topInflows: SectorSummary[];
    topOutflows: SectorSummary[];
    superNetTotal: number;
    bigNetTotal: number;
    structureDesc: string;
    summary: string;
    outlook: string;
    cards?: ReportCard[];
    timeline?: TimelineEvent[];
    newsBriefs?: NewsBrief[];
    copywriting?: string;
  };
}

export interface DebateProbeReport {
  hasAudio: boolean;
  audioCodec: string;
  audioDurationSec: number;
  expectedDurationSec: number;
  diffSec: number;
  warnings: string[];
  ok: boolean;
}

export interface TTSResult {
  file: string;
  durationSec: number;
  chars: number;
}
