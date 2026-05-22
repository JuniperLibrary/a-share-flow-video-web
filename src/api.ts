import type { DateItem, Sector, ConfigData, SSEMessage } from './types';
import { apiUrl } from './utils';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(url), options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  getDates: () =>
    request<{ dates: DateItem[] }>('/api/dates'),

  getData: (date: string) =>
    request<{ sectors: Sector[]; videos: string[]; 文案: Record<string, Record<string, string>> }>(`/api/data/${date}`),

  generateMultiDay: (date: string, days: number, copy_mode: string) =>
    fetch(apiUrl('/api/generate-multiday'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, days, copy_mode }),
    }),

  getConfig: () =>
    request<ConfigData>('/api/config'),

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

  generateTick: (date: string, session: string, copy_mode: string) =>
    fetch(apiUrl('/api/generate-tick'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, session, copy_mode }),
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

  getSectorsAllDates: () =>
    request<{ dates: string[] }>('/api/sectors-all/dates'),

  getSectorsTrend: (name: string, startDate: string, endDate: string) =>
    request<{ name: string; sectors: { date: string; code: string; name: string; net: number; rate: number }[] }>(`/api/sectors-all/trend?name=${encodeURIComponent(name)}&start_date=${startDate}&end_date=${endDate}`),

  getSectorsAllRange: (startDate: string, endDate: string) =>
    request<{ sectors: { date: string; code: string; name: string; net: number; rate: number }[] }>(`/api/sectors-all/range?start_date=${startDate}&end_date=${endDate}`),
};
