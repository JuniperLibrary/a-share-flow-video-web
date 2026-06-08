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

export interface DebateProbeReport {
  hasAudio: boolean;
  audioCodec: string;
  audioDurationSec: number;
  expectedDurationSec: number;
  diffSec: number;
  warnings: string[];
  ok: boolean;
}
