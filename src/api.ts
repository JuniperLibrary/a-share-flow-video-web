import type { DateItem, Sector, ConfigData, NewsListResponse, NewsSearchResponse, NewsStatusResponse, NewsDateResponse, DebateScript, DebateAudioTurn, DebateProbeReport, DebateHistoryEntry } from './types';
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

  getNews: async (limit?: number, offset?: number): Promise<NewsListResponse> => {
    if (staticMode) {
      const all = await staticData.getCLSNews();
      const records = all.slice(offset || 0, (offset || 0) + (limit || 50));
      return { records, total: all.length, limit: limit || 50, offset: offset || 0 };
    }
    return request<NewsListResponse>(`/api/news?limit=${limit ?? 50}&offset=${offset ?? 0}`);
  },

  searchNews: async (q: string, limit?: number, offset?: number): Promise<NewsSearchResponse> => {
    if (staticMode) {
      const all = await staticData.getCLSNews();
      const filtered = all.filter(n => n.title.includes(q) || n.brief.includes(q));
      const records = filtered.slice(offset || 0, (offset || 0) + (limit || 50));
      return { records, total: filtered.length, limit: limit || 50, offset: offset || 0, q };
    }
    return request<NewsSearchResponse>(`/api/news/search?q=${encodeURIComponent(q)}&limit=${limit ?? 50}&offset=${offset ?? 0}`);
  },

  getNewsByDate: async (date: string, limit?: number, offset?: number): Promise<NewsDateResponse> => {
    if (staticMode) {
      const all = await staticData.getCLSNews();
      const filtered = all.filter(n => n.ctime.startsWith(date));
      const records = filtered.slice(offset || 0, (offset || 0) + (limit || 50));
      return { records, total: filtered.length, limit: limit || 50, offset: offset || 0, date };
    }
    return request<NewsDateResponse>(`/api/news/date?date=${date}&limit=${limit ?? 50}&offset=${offset ?? 0}`);
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

  saveConfig: (api_key: string, api_base: string, model: string) =>
    request<{ ok: boolean }>('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key, api_base, model }),
    }),

  optimizeCopy: (date: string, session: string) =>
    request<{ text: string } | { error: string }>('/api/optimize-copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, session }),
    }),

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
    request<{ date: string; session: string; points: { Time: string; Name: string; Net: number }[] }>(`/api/tick-data/${date}?session=${session}`),

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
};
