/** 日报图片渲染用的完整 props */
export interface ReportImageProps {
  date: string;
  report: DailyReport;
  thematicCards: ThematicCard[];
}

/** 日报基础数据（匹配 Go 端 DailyReport） */
export interface DailyReport {
  date: string;
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
  newsBriefs: NewsBrief[];
}

export interface SectorSummary {
  name: string;
  net: number;
  changePct: number;
  superNet: number;
  bigNet: number;
  leadStockName: string;
  leadStockChangePct: number;
}

export interface NewsBrief {
  title: string;
  level: string;
  time: string;
  brief: string;
  sectors: string[];
}

/** 专题卡片 */
export interface ThematicCard {
  theme: string;
  conviction: number;
  timeHorizon: string;
  summary: string;
  reasoning: string;
  cards: ReportCard[];
}

/** 单张知识卡片 */
export interface ReportCard {
  index: number;
  total: number;
  tag: string;
  title: string;
  subtitle: string;
  metrics: Metric[];
  highlights: Highlight[];
  bullets: Bullet[];
  footer: string;
}

export interface Metric {
  label: string;
  value: string;
  note: string;
  tone: 'up' | 'down' | 'neutral';
}

export interface Highlight {
  title: string;
  detail: string;
  tone: 'up' | 'down' | 'neutral';
}

export interface Bullet {
  title: string;
  detail: string;
}

/** 从 theme 字段推断情绪基调 */
export function getThemeTone(theme: string): 'up' | 'down' | 'neutral' {
  const t = theme.toLowerCase();
  if (t.includes('确立') || t.includes('修复') || t.includes('异动')) return 'up';
  if (t.includes('预警') || t.includes('风险')) return 'down';
  return 'neutral';
}

export function toneColor(tone: 'up' | 'down' | 'neutral'): string {
  switch (tone) {
    case 'up': return '#4ade80';
    case 'down': return '#f87171';
    default: return '#fbbf24';
  }
}

export function valueColor(value: string): string {
  if (value.startsWith('+')) return '#4ade80';
  if (value.startsWith('-')) return '#f87171';
  return '#e0e0e0';
}

export function formatNet(net: number): string {
  const abs = Math.abs(net);
  if (abs >= 10000) return `${(net / 10000).toFixed(1)}万亿`;
  return `${net >= 0 ? '+' : ''}${abs.toFixed(0)}亿`;
}

export function formatPct(pct: number): string {
  if (!isFinite(pct)) return '—';
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}
