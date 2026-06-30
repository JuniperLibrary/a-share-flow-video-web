import type { DateItem, Sector, ConfigData, NewsListResponse, NewsSearchResponse, NewsStatusResponse, NewsDateResponse, DebateScript, DebateAudioTurn, DebateProbeReport, DebateHistoryEntry, DailyReport, TTSResult, SectorCatalogItem, SectorWatchItem, SectorCategory } from './types';
import { apiUrl } from './utils';
import * as staticData from './lib/staticData';

let staticMode = import.meta.env.VITE_STATIC_MODE === 'true';

if (!staticMode) {
  checkBackend();
}

async function checkBackend() {
  try {
    const res = await fetch(apiUrl('/api/dates'), { signal: AbortSignal.timeout(3000) });
    if (res.ok) return;
  } catch { /* backend unreachable */ }
  staticMode = true;
  console.info('[api] Backend unreachable, switching to static data mode');
}

export function isStaticMode(): boolean {
  return staticMode;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  if (staticMode) throw new Error('static mode');
  const res = await fetch(apiUrl(url), options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Type matches the Go backend's dashboard response
interface DashboardResponse {
  dates: string[];
  marketOverview: {
    totalSectors: number;
    inflowCount: number;
    outflowCount: number;
    totalNet: number;
    topSector: { name: string; net: number } | null;
    worstSector: { name: string; net: number } | null;
  };
  ranking: { name: string; net: number; category?: string }[];
  events: { time: string; sector: string; title: string; description: string; sentiment: string }[];
  trend: Record<string, { date: string; net: number }[]>;
  trendDates: string[];
}

interface Note {
  id: number;
  type: 'completed' | 'planned';
  content: string;
  created_at: string;
  updated_at: string;
}

interface TickStatusResponse {
  running: boolean;
  date: string;
  tickCount: number;
  errCount: number;
  lastTick: string;
  intervalMinutes: number;
}

interface TickDataPoint {
  Time: string;
  Name: string;
  Net: number;
  Rate: number;
  ChangePct: number;
  SuperNet: number;
  SuperRate: number;
  BigNet: number;
  BigRate: number;
  MainRate: number;
  Volume: number;
  Turnover: number;
  BKCode: string;
  TurnoverRate: number;
  LeadStockName: string;
  LeadStockChangePct: number;
  TotalMarketCap: number;
  CirculatingMarketCap: number;
}

export const api = {
  isStaticMode: () => staticMode,

  getDates: async () => {
    if (staticMode) {
      const data = await staticData.getDashboardData();
      return { dates: data.dates.map(d => ({ date: d, videos: [], sector_count: 0, 文案_count: 0, ai_count: 0 })) };
    }
    return request<{ dates: DateItem[] }>('/api/dates');
  },

  getDashboard: async () => {
    if (staticMode) {
      return staticData.getDashboardData();
    }
    return request<DashboardResponse>('/api/dashboard');
  },

  getData: (date: string) =>
    request<{ sectors: Sector[]; videos: string[]; 文案: Record<string, Record<string, string>> }>(`/api/data/${date}`),

  getSectorsByDate: async (date: string) => {
    if (staticMode) {
      const all = await staticData.getSectors();
      const filtered = all.filter(s => s.datetime.startsWith(date));
      return {
        date,
        sectors: filtered.map(s => ({
          name: s.name,
          net: s.net,
          rate: s.rate,
          color: '',
          source: '',
          rank_group: '',
          is_auto_fill: false,
        }) as Sector),
      };
    }
    return request<{ date: string; sectors: Sector[] }>(`/api/export-hot-sectors/${date}`);
  },

  getNewsCount: async () => {
    if (staticMode) {
      const news = await staticData.getCLSNews();
      return { total: news.length };
    }
    return request<{ total: number }>('/api/news/count').catch(() => ({ total: 0 }));
  },

  getNews: async (limit?: number, offset?: number, classifyStatus?: string): Promise<NewsListResponse> => {
    if (staticMode) {
      const all = await staticData.getCLSNews();
      const filtered = classifyStatus && classifyStatus !== 'all'
        ? all.filter((n) => n.classify_status === classifyStatus)
        : all;
      const records = filtered.slice(offset || 0, (offset || 0) + (limit || 50));
      return { records, total: filtered.length, limit: limit || 50, offset: offset || 0 };
    }
    const statusQuery = classifyStatus && classifyStatus !== 'all' ? `&classify_status=${encodeURIComponent(classifyStatus)}` : '';
    return request<NewsListResponse>(`/api/news?limit=${limit ?? 50}&offset=${offset ?? 0}${statusQuery}`);
  },

  searchNews: async (q: string, limit?: number, offset?: number, classifyStatus?: string): Promise<NewsSearchResponse> => {
    if (staticMode) {
      const all = await staticData.getCLSNews();
      const filtered = all.filter(n => (n.title.includes(q) || n.brief.includes(q)) && (!classifyStatus || classifyStatus === 'all' || n.classify_status === classifyStatus));
      const records = filtered.slice(offset || 0, (offset || 0) + (limit || 50));
      return { records, total: filtered.length, limit: limit || 50, offset: offset || 0, q };
    }
    const statusQuery = classifyStatus && classifyStatus !== 'all' ? `&classify_status=${encodeURIComponent(classifyStatus)}` : '';
    return request<NewsSearchResponse>(`/api/news/search?q=${encodeURIComponent(q)}&limit=${limit ?? 50}&offset=${offset ?? 0}${statusQuery}`);
  },

  getNewsByDate: async (date: string, limit?: number, offset?: number, classifyStatus?: string): Promise<NewsDateResponse> => {
    if (staticMode) {
      const all = await staticData.getCLSNews();
      const filtered = all.filter(n => n.ctime.startsWith(date) && (!classifyStatus || classifyStatus === 'all' || n.classify_status === classifyStatus));
      const records = filtered.slice(offset || 0, (offset || 0) + (limit || 50));
      return { records, total: filtered.length, limit: limit || 50, offset: offset || 0, date };
    }
    const statusQuery = classifyStatus && classifyStatus !== 'all' ? `&classify_status=${encodeURIComponent(classifyStatus)}` : '';
    return request<NewsDateResponse>(`/api/news/date?date=${date}&limit=${limit ?? 50}&offset=${offset ?? 0}${statusQuery}`);
  },

  // ---- Below: endpoints that require a live backend, will fail in static mode ----

  generateMultiDay: (date: string, days: number, copy_mode: string) =>
    fetch(apiUrl('/api/generate-multiday'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, days, copy_mode }),
    }),

  getConfig: async () => {
    if (staticMode) {
      return { has_api_key: false, api_base: '', model: '', sessions: {} };
    }
    return request<ConfigData>('/api/config');
  },

  saveConfig: (api_key: string, api_base: string, model: string, models?: Record<string, string>) =>
    request<{ ok: boolean }>('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key, api_base, model, models }),
    }),

  optimizeCopy: (date: string, session: string) =>
    request<{ text: string } | { error: string }>('/api/optimize-copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, session }),
    }),

  generateScript: (topic: string) =>
    request<{ script: string }>('/api/tts/generate-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    }),

  synthesizeTTS: (text: string) =>
    request<TTSResult>('/api/tts/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }),

  ttsFileUrl: (file: string) => apiUrl(`/api/tts/file/${file}`),

  getFiles: (date: string) =>
    request<{ videos: Record<string, string>; 文案: { template: Record<string, string>; ai: Record<string, string> } }>(`/api/files/${date}`),

  exportAll: (date: string) =>
    request<{ task_id: string; status: string; progress?: string }>(`/api/export-all/${date}`),

  exportAllStatus: (taskId: string) =>
    request<{ task_id: string; status: string; progress: string; error?: string }>(`/api/export-all/status/${taskId}`),

  exportAllFile: (taskId: string) =>
    `/api/export-all/file/${taskId}`,

  exportHotSectors: (date: string) =>
    request<{ date: string; sectors: Sector[] }>(`/api/export-hot-sectors/${date}`),

  generateTick: (date: string, session: string, copy_mode: string, format: string) =>
    fetch(apiUrl('/api/generate-tick'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, session, copy_mode, format }),
    }),

  getTickInterval: () =>
    request<{ intervalMinutes: number }>('/api/tick/interval'),

  setTickInterval: (minutes: number) =>
    request<{ ok: boolean; intervalMinutes: number }>('/api/tick/interval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intervalMinutes: minutes }),
    }),

  getTickData: (date: string, session: string) =>
    request<{ date: string; session: string; points: TickDataPoint[] }>(`/api/tick-data/${date}?session=${session}`),

  getTickStatus: () =>
    request<TickStatusResponse>('/api/tick/status'),

  startTick: async () => {
    const res = await fetch(apiUrl('/api/tick/start'), { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body as { ok: boolean; message: string };
  },

  stopTick: async () => {
    const res = await fetch(apiUrl('/api/tick/stop'), { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body as { ok: boolean; message: string };
  },

  tickStreamUrl: () =>
    apiUrl('/api/tick/stream'),

  saveAllSectors: (date: string) =>
    request<{ task_id: string; message: string }>(`/api/sectors-all/save/${date}`, {
      method: 'POST',
    }),

  getSaveAllStatus: (taskId: string) =>
    request<{ task_id: string; date: string; status: string; progress: string; count: number; error?: string }>(`/api/sectors-all/save/status/${taskId}`),

  getAllSectors: (date: string) =>
    request<{ date: string; sectors: { date: string; code: string; name: string; net: number; rate: number }[] }>(`/api/sectors-all/${date}`),

  getSectorsAllNames: () =>
    request<{ names: string[] }>('/api/sectors-all/names'),

  getSectorsAllDates: async () => {
    if (staticMode) {
      const dates = await staticData.getSectorsAllDates();
      return { dates };
    }
    return request<{ dates: string[] }>('/api/sectors-all/dates');
  },

  getSectorsAllRange: (startDate: string, endDate: string) =>
    request<{ sectors: { date: string; code: string; name: string; net: number; rate: number }[] }>(`/api/sectors-all/range?start_date=${startDate}&end_date=${endDate}`),

  getSectorCatalog: async (category: SectorCategory) => {
    if (staticMode) return { items: [] as SectorCatalogItem[] };
    return request<{ items: SectorCatalogItem[] }>(`/api/sectors/catalog?category=${encodeURIComponent(category)}`);
  },

  getSectorWatchlist: async () => {
    if (staticMode) return { items: [] as SectorWatchItem[] };
    return request<{ items: SectorWatchItem[] }>('/api/sectors/watchlist');
  },

  setSectorWatchlistItem: async (item: { bk_code: string; name?: string; category?: SectorCategory; enabled?: boolean }) => {
    if (staticMode) throw new Error('static mode');
    const res = await fetch(apiUrl('/api/sectors/watchlist/set'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || body.message || `HTTP ${res.status}`);
    return body as { ok: boolean; items: SectorWatchItem[] };
  },

  removeSectorWatchlistItem: async (bk_code: string) => {
    if (staticMode) throw new Error('static mode');
    const res = await fetch(apiUrl('/api/sectors/watchlist/remove'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bk_code }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || body.message || `HTTP ${res.status}`);
    return body as { ok: boolean; items: SectorWatchItem[] };
  },

  debateGenerate: (report: string, structuredReport?: Record<string, unknown>, stockCode?: string, stockName?: string) => {
    const body: Record<string, unknown> = { report };
    if (structuredReport) body.structuredReport = structuredReport;
    if (stockCode) body.stockCode = stockCode;
    if (stockName) body.stockName = stockName;
    return request<{ taskId: string; script: DebateScript }>('/api/debate/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  debateCouncilStart: (params: {
    report: string;
    structuredReport?: Record<string, unknown>;
    stockCode?: string;
    stockName?: string;
    reportPeriod?: string;
    useMemory?: boolean;
  }) => {
    const body: Record<string, unknown> = { report: params.report };
    if (params.structuredReport) body.structuredReport = params.structuredReport;
    if (params.stockCode) body.stockCode = params.stockCode;
    if (params.stockName) body.stockName = params.stockName;
    if (params.reportPeriod) body.reportPeriod = params.reportPeriod;
    if (params.useMemory !== undefined) body.useMemory = params.useMemory;
    return request<{ taskId: string; script: DebateScript; phase: string; turnCount: number }>('/api/debate/council/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  debateAudio: (taskId: string, script: DebateScript) =>
    request<{ taskId: string; audioTurns: DebateAudioTurn[] }>('/api/debate/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, script }),
    }),

  debateRender: (taskId: string, script: DebateScript, audioTurns: DebateAudioTurn[], format: string = 'mobile') =>
    request<{ taskId: string; status: string }>('/api/debate/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, script, audioTurns, format }),
    }),

  debateRenderStatus: (taskId: string) =>
    request<{ taskId: string; status: string; progress: string; videoUrl?: string; probe?: DebateProbeReport; error?: string; path?: string }>(`/api/debate/render-status/${taskId}`),

  debateRenderCancel: (taskId: string) =>
    request<{ status: string }>(`/api/debate/render-cancel/${taskId}`, {
      method: 'POST',
    }),

  debateFileUrl: (taskId: string) => apiUrl(`/api/debate/file/${taskId}`),

  debateAudioUrl: (taskId: string, turnIndex: number) => apiUrl(`/api/debate/audio/${taskId}/${turnIndex}`),

  debateFetchReport: (code: string) =>
    request<{ report: Record<string, unknown>; text: string }>('/api/debate/fetch-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }),

  debateSearchStock: (keyword: string) =>
    request<{ stocks: { code: string; name: string; market: string }[] }>('/api/debate/search-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword }),
    }),

  debateHistoryList: () =>
    request<{ history: DebateHistoryEntry[] }>('/api/debate/history'),

  debateHistoryDetail: (taskId: string) =>
    request<{ entry: DebateHistoryEntry }>(`/api/debate/history/${taskId}`),

  debateHistoryDelete: (taskId: string) =>
    request<{ status: string }>(`/api/debate/history/${taskId}`, {
      method: 'DELETE',
    }),

  getNotes: async () => {
    return request<{ notes: Note[] }>('/api/notes');
  },

  createNote: (type: string, content: string) =>
    request<{ ok: boolean; id: number }>('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content }),
    }),

  updateNote: (id: number, type: string, content: string) =>
    request<{ ok: boolean }>(`/api/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content }),
    }),

  deleteNote: (id: number) =>
    request<{ ok: boolean }>(`/api/notes/${id}`, { method: 'DELETE' }),

  getNewsStatus: () =>
    request<NewsStatusResponse>('/api/news/status'),

  startNews: () =>
    request<{ ok: boolean; message: string }>('/api/news/start', { method: 'POST' }),

  stopNews: () =>
    request<{ ok: boolean; message: string }>('/api/news/stop', { method: 'POST' }),

  retryNews: (id: number) =>
    request<{ ok: boolean; message: string }>(`/api/news/retry/${id}`, { method: 'POST' }),

  retryNewsBatch: (ids: number[]) =>
    request<{ ok: boolean; queued_count: number; failed: Record<string, string> }>('/api/news/retry-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }),

  getDailyReportDates: () =>
    request<{ dates: string[] }>('/api/daily-report/dates'),

  getDailyReport: (date: string) =>
    request<DailyReport>(`/api/daily-report/${date}`),

  generateDailyReport: (date: string) =>
    request<DailyReport>('/api/daily-report/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    }),
};
