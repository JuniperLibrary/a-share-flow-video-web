import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button, Tag, Input, Modal } from '@arco-design/web-react';
import { IconPlayArrow, IconDelete, IconCopy, IconHistory } from '@arco-design/web-react/icon';
import { apiUrl } from '../utils';
import { api } from '../api';
import type { CLSNewsRecord } from '../types';
import { DatePicker } from '../components/ui/date-picker';
import { PageHeader } from '../components/ui/page-header';
import { EmptyState } from '../components/ui/empty-state';
import { tokens } from '../lib/tokens';
import { cn, netTextColor } from '../lib/utils';

interface TickPoint {
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

interface TickSnapshot {
  points: TickPoint[];
  date: string;
  running: boolean;
  count: number;
  lastTime: string;
}

interface SSEMessage {
  type: string;
  text: string;
}

interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

interface SectorData {
  name: string;
  points: TickPoint[];
  latest: TickPoint;
  first: TickPoint;
  peak: TickPoint;
  valley: TickPoint;
  maxChange: number;
  direction: 'up' | 'down' | 'flat';
}

function formatNet(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}亿`;
}

function formatRate(r: number | undefined | null): string {
  if (r == null) return '-';
  return `${r >= 0 ? '+' : ''}${r.toFixed(1)}%`;
}

function formatChangePct(r: number): string {
  if (!Number.isFinite(r)) return '—';
  return `${r >= 0 ? '+' : ''}${r.toFixed(2)}%`;
}

function buildSectorMap(points: TickPoint[]): Map<string, TickPoint[]> {
  const map = new Map<string, TickPoint[]>();
  for (const p of points) {
    const existing = map.get(p.Name);
    if (existing) {
      existing.push(p);
    } else {
      map.set(p.Name, [p]);
    }
  }
  for (const [, pts] of map) {
    pts.sort((a, b) => a.Time.localeCompare(b.Time));
  }
  return map;
}

function buildSectorRows(points: TickPoint[]): SectorData[] {
  const map = buildSectorMap(points);
  const rows: SectorData[] = [];
  for (const [name, pts] of map) {
    const latest = pts[pts.length - 1];
    const first = pts[0];
    let peak = pts[0];
    let valley = pts[0];
    for (const p of pts) {
      if (p.Net > peak.Net) peak = p;
      if (p.Net < valley.Net) valley = p;
    }
    const maxChange = Math.abs(latest.Net - first.Net);
    const direction = latest.Net > first.Net + 0.01 ? 'up' : latest.Net < first.Net - 0.01 ? 'down' : 'flat';
    rows.push({ name, points: pts, latest, first, peak, valley, maxChange, direction });
  }
  rows.sort((a, b) => b.latest.Net - a.latest.Net);
  return rows;
}

const CHART_W = 560;
const CHART_H = 240;
const CHART_PAD = { top: 20, right: 20, bottom: 36, left: 60 };

function SectorTrendChart({ points }: { points: TickPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipX, setTooltipX] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);

  const netValues = points.map(p => p.Net);
  const min = Math.min(...netValues);
  const max = Math.max(...netValues);
  const range = max - min || 1;
  const plotW = CHART_W - CHART_PAD.left - CHART_PAD.right;
  const plotH = CHART_H - CHART_PAD.top - CHART_PAD.bottom;

  const xScale = (i: number) => CHART_PAD.left + (i / (points.length - 1 || 1)) * plotW;
  const yScale = (v: number) => CHART_PAD.top + (1 - (v - min) / range) * plotH;

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGRectElement>) => {
    const svg = (e.currentTarget as Element).closest('svg');
    if (!svg) return;
    const svgRect = svg.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const index = Math.round(((mouseX - CHART_PAD.left) / plotW) * (points.length - 1));
    setHoverIndex(Math.max(0, Math.min(points.length - 1, index)));

    const container = chartRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      setTooltipX(e.clientX - containerRect.left);
    }
  }, [points.length, plotW]);

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null);
  }, []);

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(p.Net).toFixed(1)}`).join(' ');
  const areaD = `${lineD} L${xScale(points.length - 1)},${CHART_H - CHART_PAD.bottom} L${CHART_PAD.left},${CHART_H - CHART_PAD.bottom} Z`;

  const yTicks = 5;
  const yStep = range / yTicks;
  const yLabels: number[] = [];
  for (let i = 0; i <= yTicks; i++) {
    yLabels.push(min + yStep * i);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div ref={chartRef} className="relative select-none">
      <svg width={CHART_W} height={CHART_H} className="w-full">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: tokens.chart[1], stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: tokens.chart[1], stopOpacity: 0.02 }} />
          </linearGradient>
        </defs>

        {yLabels.map((v, i) => (
          <g key={i}>
            <line
              x1={CHART_PAD.left} y1={yScale(v)} x2={CHART_W - CHART_PAD.right} y2={yScale(v)}
              stroke={tokens.hairline.DEFAULT} strokeWidth={1}
            />
            <text x={CHART_PAD.left - 8} y={yScale(v) + 4} textAnchor="end" fill={tokens.ink[3]} fontSize={11}>
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {points.map((p, i) => (
          i % Math.max(1, Math.floor(points.length / 8)) === 0 || i === points.length - 1 ? (
            <text key={i} x={xScale(i)} y={CHART_H - 8} textAnchor="middle" fill={tokens.ink[3]} fontSize={10}>
              {p.Time}
            </text>
          ) : null
        ))}

        <path d={areaD} fill="url(#trendFill)" />
        <path d={lineD} fill="none" stroke={tokens.chart[1]} strokeWidth={2} strokeLinejoin="round" />

        {points.map((p, i) => (
          <circle key={i} cx={xScale(i)} cy={yScale(p.Net)} r={3} fill={tokens.chart[1]} />
        ))}

        <rect
          x={CHART_PAD.left} y={CHART_PAD.top}
          width={plotW} height={plotH}
          fill="transparent"
          className="cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {hovered && (
          <g>
            <line
              x1={xScale(hoverIndex!)} y1={CHART_PAD.top}
              x2={xScale(hoverIndex!)} y2={CHART_PAD.top + plotH}
              stroke={tokens.hairline.strong} strokeWidth={1} strokeDasharray="3 2"
            />
            <circle
              cx={xScale(hoverIndex!)} cy={yScale(hovered.Net)}
              r={5} fill={tokens.chart[1]} stroke={tokens.surface[1]} strokeWidth={2}
            />
          </g>
        )}
      </svg>

      {hovered && (
        <div
          className="absolute pointer-events-none z-10 -translate-x-1/2"
          style={{ left: tooltipX, top: 4 }}
        >
          <div className="bg-surface-1 backdrop-blur-md border border-hairline rounded-lg px-3 py-2 text-xs shadow-xl whitespace-nowrap">
            <div className="text-ink-3 mb-1">{hovered.Time}</div>
            <div className="flex items-center gap-3">
              <span className={netTextColor(hovered.Net)}>
                净流入 {formatNet(hovered.Net)}
              </span>
              <span className="text-ink-2">
                主力占比 {formatRate(hovered.Rate)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const AUTO_START_BEFORE = 5;

function todayAtHHMM(hours: number, minutes: number): number {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}

function getNextAutoStart(now: number): { time: number; label: string } | null {
  const windows = [
    { open: todayAtHHMM(9, 30), after: todayAtHHMM(9, 35), label: '早盘' },
    { open: todayAtHHMM(13, 0), after: todayAtHHMM(13, 5), label: '午盘' },
  ];
  for (const w of windows) {
    const start = w.open - AUTO_START_BEFORE * 60 * 1000;
    if (now < start) return { time: start, label: w.label };
  }
  return null;
}

function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function isInAutoWindow(now: number): boolean {
  const windows = [
    { start: todayAtHHMM(9, 30) - AUTO_START_BEFORE * 60 * 1000, end: todayAtHHMM(9, 35) },
    { start: todayAtHHMM(13, 0) - AUTO_START_BEFORE * 60 * 1000, end: todayAtHHMM(13, 5) },
  ];
  return windows.some(w => now >= w.start && now <= w.end);
}

export function TickPage() {
  const [snapshot, setSnapshot] = useState<TickSnapshot | null>(null);
  const [filterSector, setFilterSector] = useState('');
  const [now, setNow] = useState(Date.now());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trendSector, setTrendSector] = useState<SectorData | null>(null);
  const [sectorNews, setSectorNews] = useState<CLSNewsRecord[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [mode, setMode] = useState<'live' | 'history'>('live');
  const [historyDate, setHistoryDate] = useState('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [tickDataLoading, setTickDataLoading] = useState(false);
  const [sortState, setSortState] = useState<SortState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoStartSuppressed = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDateData = useCallback(async (date: string) => {
    setTickDataLoading(true);
    try {
      const dataRes = await fetch(apiUrl(`/api/tick-data/${date}`));
      if (!dataRes.ok) return;
      const tickData = await dataRes.json();
      if (tickData.points?.length) {
        const times = new Set(tickData.points.map((p: TickPoint) => p.Time));
        setSnapshot({
          points: tickData.points,
          date: tickData.date,
          running: false,
          count: times.size,
          lastTime: tickData.points[tickData.points.length - 1].Time,
        });
      } else {
        setSnapshot(null);
      }
    } catch { void 0; }
    setTickDataLoading(false);
  }, []);

  useEffect(() => {
    const initPage = async () => {
      try {
        const datesRes = await fetch(apiUrl('/api/dates'));
        const datesData = await datesRes.json();
        const dates: string[] = (datesData.dates || []).map((d: any) => d.date);
        dates.sort();
        setAvailableDates(dates);
        if (dates.length === 0) return;

        const latest = dates[dates.length - 1];
        setHistoryDate(latest);

        const res = await fetch(apiUrl('/api/tick/status'));
        const data = await res.json();
        if (data.running) {
          autoStartSuppressed.current = false;
          await connectSSE();
          return;
        }

        await loadDateData(latest);
      } catch { void 0; }
    };
    initPage();
  }, [loadDateData]);

  const autoStartTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (isWeekend() || mode !== 'live') return;
    if (autoStartSuppressed.current || connected) return;
    if (isInAutoWindow(Date.now())) {
      handleStart();
    }
    if (autoStartTimerRef.current) clearInterval(autoStartTimerRef.current);
    autoStartTimerRef.current = setInterval(() => {
      if (autoStartSuppressed.current) return;
      if (!connected && isInAutoWindow(Date.now())) {
        handleStart();
      }
    }, 30000);
    return () => {
      if (autoStartTimerRef.current) clearInterval(autoStartTimerRef.current);
    };
  }, [connected]);

  useEffect(() => {
    if (!trendSector) {
      setSectorNews([]);
      return;
    }
    setNewsLoading(true);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const cutoff = fiveDaysAgo.toISOString().slice(0, 10);
    api.searchNews(trendSector.name, 200, 0).then(res => {
      const filtered = (res.records || []).filter(n => n.ctime >= cutoff);
      filtered.sort((a, b) => b.ctime.localeCompare(a.ctime));
      setSectorNews(filtered);
    }).catch(() => {
      setSectorNews([]);
    }).finally(() => {
      setNewsLoading(false);
    });
  }, [trendSector]);

  useEffect(() => {
    if (mode === 'history' && historyDate) {
      loadDateData(historyDate);
    }
  }, [mode, historyDate, loadDateData]);

  async function connectSSE() {
    if (abortRef.current) abortRef.current.abort();
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(apiUrl('/api/tick/stream'), { signal: controller.signal });
      if (!res.body) throw new Error('no body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      setConnected(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg: SSEMessage = JSON.parse(line);
            if (msg.type === 'tick') {
              const data: TickSnapshot = JSON.parse(msg.text);
              setSnapshot(data);
              setConnected(true);
            }
          } catch { void 0; }
        }
      }
    } catch {
      setConnected(false);
      setError('连接断开，尝试重连...');
      reconnectTimer.current = setTimeout(() => {
        if (!autoStartSuppressed.current) {
          connectSSE();
        }
      }, 5000);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }

  function disconnectSSE() {
    autoStartSuppressed.current = true;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setConnected(false);
  }

  async function handleStart() {
    autoStartSuppressed.current = false;
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/tick/start'), { method: 'POST' });
      if (!res.ok) {
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
        if (abortRef.current) {
          abortRef.current.abort();
          abortRef.current = null;
        }
        setConnected(false);
        const body = await res.json().catch(() => ({}));
        const errMsg = body.error || '';
        if (!errMsg.includes('采集中')) {
          setError(errMsg || '启动失败');
        }
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '启动失败');
      return;
    }
    await connectSSE();
  }

  async function handleStop() {
    autoStartSuppressed.current = true;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    try {
      await fetch(apiUrl('/api/tick/stop'), { method: 'POST' });
    } catch { void 0; }
    disconnectSSE();
  }

  async function copyData() {
    if (!snapshot?.points?.length) return;
    const rows = buildSectorRows(snapshot.points);
    const text = rows.map(r =>
      `${r.name} | ${r.latest.Time} | ${formatNet(r.latest.Net)} | 趋势: ${r.direction === 'up' ? '↑' : r.direction === 'down' ? '↓' : '→'}`
    ).join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch { void 0; }
  }

  const sectorRows = snapshot?.points?.length ? buildSectorRows(snapshot.points) : [];
  const filteredRows = filterSector
    ? sectorRows.filter(r => r.name.includes(filterSector))
    : sectorRows;

  const rows = filteredRows;
  const sortFn = useCallback((a: SectorData, b: SectorData) => {
    if (!sortState) return 0;
    const getVal = (row: SectorData): number => {
      switch (sortState!.field) {
        case 'ChangePct': return row.latest.ChangePct;
        case 'Net': return row.latest.Net;
        case 'MainRate': return row.latest.MainRate;
        case 'SuperNet': return row.latest.SuperNet;
        case 'SuperRate': return row.latest.SuperRate;
        case 'BigNet': return row.latest.BigNet;
        case 'BigRate': return row.latest.BigRate;
        case 'TurnoverRate': return row.latest.TurnoverRate;
        case 'TotalMarketCap': return row.latest.TotalMarketCap;
        case 'cumDelta': return row.latest.Net - row.first.Net;
        default: return 0;
      }
    };
    const av = getVal(a), bv = getVal(b);
    return sortState!.direction === 'asc' ? av - bv : bv - av;
  }, [sortState]);
  const sortedRows = useMemo(
    () => sortState ? [...rows].sort(sortFn) : rows,
    [rows, sortState, sortFn],
  );

  const upCount = filteredRows.filter(r => r.direction === 'up').length;
  const downCount = filteredRows.filter(r => r.direction === 'down').length;
  const flatCount = filteredRows.filter(r => r.direction === 'flat').length;

  const topSector = filteredRows.length > 0 ? filteredRows[0] : null;
  const worstSector = filteredRows.length > 0 ? filteredRows[filteredRows.length - 1] : null;

  const nextAutoStart = getNextAutoStart(now);
  const showAutoCountdown = !connected && !autoStartSuppressed.current && nextAutoStart !== null;
  const autoStartMs = nextAutoStart ? nextAutoStart.time - now : 0;
  const autoStartMin = Math.floor(autoStartMs / 60000);
  const autoStartSec = Math.floor((autoStartMs % 60000) / 1000);

  const handleSort = useCallback((field: string) => {
    setSortState(prev => {
      if (!prev || prev.field !== field) return { field, direction: 'asc' };
      if (prev.direction === 'asc') return { field, direction: 'desc' };
      return null;
    });
  }, []);

  const filterInputClass = '!bg-surface-2 !border-hairline !text-ink !h-8 !text-xs';

  return (
    <div className="relative min-h-screen px-5 py-5">
      <div className="pointer-events-none absolute inset-0 opacity-[0.015] bg-dashboard-grid bg-grid-lg" />

      <div className="relative space-y-5">
        <PageHeader
          title="Tick 采集"
          actions={
            <div className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-1 p-0.5">
              <button
                onClick={() => setMode('live')}
                className={cn(
                  'px-4 py-1.5 text-xs font-semibold rounded-lg transition-all border',
                  mode === 'live'
                    ? 'bg-primary-soft text-primary border-primary/30 shadow-glow-primary'
                    : 'bg-transparent text-ink-3 border-transparent hover:text-ink-2',
                )}
              >
                实时
              </button>
              <button
                onClick={() => setMode('history')}
                className={cn(
                  'px-4 py-1.5 text-xs font-semibold rounded-lg transition-all border',
                  mode === 'history'
                    ? 'bg-primary-soft text-primary border-primary/30 shadow-glow-primary'
                    : 'bg-transparent text-ink-3 border-transparent hover:text-ink-2',
                )}
              >
                历史
              </button>
            </div>
          }
        />

        {mode === 'live' && (
          <div className="flex items-center gap-3 flex-wrap text-xs text-ink-3">
            {showAutoCountdown && (
              <span>
                {nextAutoStart!.label} {autoStartMin > 0 ? `${autoStartMin}m ` : ''}{autoStartSec}s 后自动采集
              </span>
            )}
            {mode === 'live' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-hairline bg-surface-1 text-[11px]">
                <span className={cn(
                  'inline-block w-1.5 h-1.5 rounded-full',
                  connected ? 'bg-primary animate-pulse' : 'bg-ink-3',
                )} />
                {connected ? '采集中' : '已停止'}
              </span>
            )}
          </div>
        )}

        {mode === 'history' && (
          <div className="flex items-center gap-2">
            <DatePicker
              value={historyDate}
              onChange={d => d && setHistoryDate(d)}
              disabledDate={date => {
                const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                return !availableDates.includes(ds);
              }}
            />
          </div>
        )}

        {mode === 'live' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-hairline bg-surface-1 backdrop-blur-md p-4 transition-all duration-300 hover:border-hairline-active">
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className={cn(
                    'inline-flex h-2 w-2 rounded-full',
                    connected ? 'bg-primary animate-pulse' : 'bg-ink-3',
                  )} />
                </span>
                <span className="text-xs text-ink-3">采集状态</span>
              </div>
              <div className={cn('text-lg font-semibold', connected ? 'text-primary' : 'text-ink-3')}>
                {connected ? '运行中' : '未启动'}
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-3 mt-0.5 min-h-[16px]">
                <span className="font-mono tabular-nums w-16 text-right">{snapshot?.count ?? 0} 轮</span>
                {snapshot?.lastTime && <span>最新 {snapshot.date} {snapshot.lastTime}</span>}
                {!connected && <span>{error ?? '等待自动采集'}</span>}
              </div>
            </div>
            <div className="rounded-xl border border-hairline border-l-2 border-l-inflow bg-surface-1 backdrop-blur-md p-4 transition-all duration-300 hover:border-hairline-active">
              <div className="text-xs text-ink-3 mb-2">资金流入</div>
              <div className="text-lg font-semibold text-inflow">{upCount}</div>
              <div className="text-xs text-ink-3 mt-0.5">
                {sectorRows.length > 0 ? `${(upCount / sectorRows.length * 100).toFixed(1)}%` : '-'}
              </div>
            </div>
            <div className="rounded-xl border border-hairline border-l-2 border-l-outflow bg-surface-1 backdrop-blur-md p-4 transition-all duration-300 hover:border-hairline-active">
              <div className="text-xs text-ink-3 mb-2">资金流出</div>
              <div className="text-lg font-semibold text-outflow">{downCount}</div>
              <div className="text-xs text-ink-3 mt-0.5">
                {sectorRows.length > 0 ? `${(downCount / sectorRows.length * 100).toFixed(1)}%` : '-'}
              </div>
            </div>
            <div className="rounded-xl border border-hairline border-l-2 border-l-primary bg-surface-1 backdrop-blur-md p-4 transition-all duration-300 hover:border-hairline-active">
              <div className="text-xs text-ink-3 mb-2">最强流入</div>
              <div className="text-lg font-semibold text-ink truncate">
                {topSector ? topSector.name : '-'}
              </div>
              <div className="text-xs mt-0.5 text-inflow">
                {topSector ? formatNet(topSector.latest.Net) : '-'}
              </div>
            </div>
          </div>
        )}

        {mode === 'live' && (
          <div className="rounded-xl border border-hairline bg-surface-1 backdrop-blur-xl p-4 shadow-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {!connected ? (
                <Button
                  type="primary"
                  onClick={handleStart}
                  icon={<IconPlayArrow />}
                  className="!bg-primary !border-primary !text-primary-ink !h-8 !text-xs !font-semibold shadow-glow-primary hover:!brightness-110"
                >
                  开始采集
                </Button>
              ) : (
                <Button
                  status="warning"
                  onClick={handleStop}
                  className="!bg-outflow-softer !border-outflow/30 !text-outflow !h-8 !text-xs !font-semibold hover:!bg-outflow-muted"
                >
                  停止采集
                </Button>
              )}
              <Button
                onClick={() => setSnapshot(null)}
                icon={<IconDelete />}
                className="!bg-surface-2 !border-hairline !text-ink-3 !h-8 !text-xs hover:!bg-surface-3"
              >
                清空
              </Button>
              <Button
                onClick={copyData}
                icon={<IconCopy />}
                className="!bg-surface-2 !border-hairline !text-ink-3 !h-8 !text-xs hover:!bg-surface-3"
              >
                复制数据
              </Button>
              <div className="flex items-center gap-3 ml-auto">
                <div className="w-44">
                  <Input
                    value={filterSector}
                    onChange={setFilterSector}
                    placeholder="筛选板块..."
                    className={filterInputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'history' && (
          <div className="rounded-xl border border-hairline bg-surface-1 backdrop-blur-xl p-4 shadow-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-3">当前查看</span>
                <span className="text-xs font-mono text-primary">{historyDate || '-'}</span>
                <span className="text-xs text-ink-3">
                  {snapshot ? `${filteredRows.length} 个板块 / ${snapshot.count} 轮` : '加载中...'}
                </span>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <div className="w-44">
                  <Input
                    value={filterSector}
                    onChange={setFilterSector}
                    placeholder="筛选板块..."
                    className={filterInputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {filteredRows.length > 0 && (
          <div className="rounded-xl border border-hairline bg-surface-2 backdrop-blur-sm px-5 py-2.5">
            <div className="flex items-center gap-5 text-xs flex-wrap">
              <span className="text-ink-3">
                流入: <span className="text-inflow font-medium">{upCount}</span>
              </span>
              <span className="text-ink-3">
                流出: <span className="text-outflow font-medium">{downCount}</span>
              </span>
              <span className="text-ink-3">
                持平: <span className="text-ink-2 font-medium">{flatCount}</span>
              </span>
              <span className="text-ink-3">总计: {filteredRows.length}</span>
              {filterSector && (
                <span className="text-ink-3">筛选: {filteredRows.length}/{sectorRows.length}</span>
              )}
              {topSector && worstSector && (
                <span className="ml-auto text-ink-3">
                  最强流入: <span className="text-inflow">{topSector.name} {formatNet(topSector.latest.Net)}</span>
                  <span className="mx-2">|</span>
                  最强流出: <span className="text-outflow">{worstSector.name} {formatNet(worstSector.latest.Net)}</span>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-hairline bg-surface-1 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-hairline">
            <div className="flex items-center gap-2">
              <IconHistory className="text-ink-3" style={{ fontSize: 14 }} />
              <span className="text-sm text-ink-2">板块资金流</span>
              {tickDataLoading && (
                <span className="text-[10px] text-ink-3 animate-pulse">加载中...</span>
              )}
            </div>
            <span className="text-xs text-ink-3">{filteredRows.length} 个板块 ({snapshot?.count ?? 0} 轮)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-ink-3">板块</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-ink-3">
                    <button onClick={() => handleSort('ChangePct')} className="cursor-pointer hover:text-primary transition-colors bg-transparent border-none p-0 inline-flex items-center justify-end">
                      涨跌幅{sortState?.field === 'ChangePct' ? (sortState.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-ink-3">
                    <button onClick={() => handleSort('Net')} className="cursor-pointer hover:text-primary transition-colors bg-transparent border-none p-0 inline-flex items-center justify-end">
                      最新净流入{sortState?.field === 'Net' ? (sortState.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-ink-3">
                    <button onClick={() => handleSort('MainRate')} className="cursor-pointer hover:text-primary transition-colors bg-transparent border-none p-0 inline-flex items-center justify-end">
                      主力净占比{sortState?.field === 'MainRate' ? (sortState.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-ink-3">
                    <button onClick={() => handleSort('SuperNet')} className="cursor-pointer hover:text-primary transition-colors bg-transparent border-none p-0 inline-flex items-center justify-end">
                      超大单{sortState?.field === 'SuperNet' ? (sortState.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-ink-3">
                    <button onClick={() => handleSort('SuperRate')} className="cursor-pointer hover:text-primary transition-colors bg-transparent border-none p-0 inline-flex items-center justify-end">
                      超大单占比{sortState?.field === 'SuperRate' ? (sortState.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-ink-3">
                    <button onClick={() => handleSort('BigNet')} className="cursor-pointer hover:text-primary transition-colors bg-transparent border-none p-0 inline-flex items-center justify-end">
                      大单{sortState?.field === 'BigNet' ? (sortState.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-ink-3">
                    <button onClick={() => handleSort('BigRate')} className="cursor-pointer hover:text-primary transition-colors bg-transparent border-none p-0 inline-flex items-center justify-end">
                      大单占比{sortState?.field === 'BigRate' ? (sortState.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-ink-3">
                    <button onClick={() => handleSort('TurnoverRate')} className="cursor-pointer hover:text-primary transition-colors bg-transparent border-none p-0 inline-flex items-center justify-end">
                      换手率{sortState?.field === 'TurnoverRate' ? (sortState.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-ink-3">
                    <button onClick={() => handleSort('TotalMarketCap')} className="cursor-pointer hover:text-primary transition-colors bg-transparent border-none p-0 inline-flex items-center justify-end">
                      总市值{sortState?.field === 'TotalMarketCap' ? (sortState.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-ink-3">
                    <button onClick={() => handleSort('cumDelta')} className="cursor-pointer hover:text-primary transition-colors bg-transparent border-none p-0 inline-flex items-center justify-end">
                      累计净变化{sortState?.field === 'cumDelta' ? (sortState.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-ink-3">时段方向</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-ink-3 w-48">资金流向</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={13}>
                      <EmptyState
                        title="暂无采集数据"
                        description="系统将在交易日 9:25 / 12:55 自动开始采集"
                        icon={<IconPlayArrow className="h-5 w-5" />}
                      />
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row) => {
                    const isUp = row.latest.Net >= 0;
                    const maxAbs = Math.max(...sortedRows.map(r => Math.abs(r.latest.Net)));
                    const barWidth = maxAbs > 0 ? (Math.abs(row.latest.Net) / maxAbs) * 100 : 0;
                    return (
                      <tr
                        key={row.name}
                        className={cn(
                          'border-b border-hairline-strong transition-colors hover:bg-surface-2',
                          isUp ? 'bg-inflow-softer' : 'bg-outflow-softer',
                        )}
                      >
                        <td className="px-5 py-2.5">
                          <button
                            onClick={() => setTrendSector(row)}
                            className="text-ink text-xs hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                          >
                            {row.name}
                          </button>
                          <span className="text-xs text-ink-3 ml-2">
                            {row.latest.Time}
                          </span>
                        </td>
                        <td className={cn('px-5 py-2.5 text-right font-mono text-xs', netTextColor(row.latest.ChangePct))}>
                          {formatChangePct(row.latest.ChangePct)}
                        </td>
                        <td className={cn('px-5 py-2.5 text-right font-mono text-xs', netTextColor(row.latest.Net))}>
                          {formatNet(row.latest.Net)}
                        </td>
                        <td className={cn('px-5 py-2.5 text-right font-mono text-xs', netTextColor(row.latest.MainRate))}>
                          {formatRate(row.latest.MainRate)}
                        </td>
                        <td className={cn('px-5 py-2.5 text-right font-mono text-xs', netTextColor(row.latest.SuperNet))}>
                          {formatNet(row.latest.SuperNet)}
                        </td>
                        <td className={cn('px-5 py-2.5 text-right font-mono text-xs', netTextColor(row.latest.SuperRate))}>
                          {formatRate(row.latest.SuperRate)}
                        </td>
                        <td className={cn('px-5 py-2.5 text-right font-mono text-xs', netTextColor(row.latest.BigNet))}>
                          {formatNet(row.latest.BigNet)}
                        </td>
                        <td className={cn('px-5 py-2.5 text-right font-mono text-xs', netTextColor(row.latest.BigRate))}>
                          {formatRate(row.latest.BigRate)}
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono text-xs text-ink-3">
                          {formatRate(row.latest.TurnoverRate)}
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono text-xs text-ink-3">
                          {row.latest.TotalMarketCap ? `${row.latest.TotalMarketCap.toFixed(0)}亿` : '-'}
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono text-xs">
                          {(() => {
                            const delta = row.latest.Net - row.first.Net
                            return <span className={netTextColor(delta)}>{formatNet(delta)}</span>
                          })()}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <span className={cn(
                            'text-xs font-medium',
                            row.direction === 'up' ? 'text-inflow' :
                            row.direction === 'down' ? 'text-outflow' : 'text-ink-3',
                          )}>
                            {row.direction === 'up' ? '↑' : row.direction === 'down' ? '↓' : '→'}
                            {' '}{formatNet(row.latest.Net - row.first.Net)}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="flex-1 max-w-[120px] h-2 rounded-full overflow-hidden bg-surface-2">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-300',
                                  isUp ? 'bg-inflow' : 'bg-outflow',
                                )}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        visible={trendSector !== null}
        onCancel={() => setTrendSector(null)}
        footer={null}
        closable={true}
        maskClosable={true}
        style={{ width: 640, borderRadius: 16 }}
        title={
          <div className="flex items-center gap-3">
            <span className="text-ink font-semibold text-base">{trendSector?.name}</span>
            <span className="text-xs text-ink-3">{snapshot?.date}</span>
            {trendSector && (
              <span className={cn(
                'text-xs font-medium ml-auto',
                trendSector.direction === 'up' ? 'text-inflow' :
                trendSector.direction === 'down' ? 'text-outflow' : 'text-ink-3',
              )}>
                {trendSector.direction === 'up' ? '↑' : trendSector.direction === 'down' ? '↓' : '→'}
                {' '}{formatNet(trendSector.latest.Net - trendSector.first.Net)}
              </span>
            )}
          </div>
        }
      >
        {trendSector && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-surface-2 p-3">
                <div className="text-xs text-ink-3 mb-1">开盘</div>
                <div className={cn('text-sm font-mono font-medium', netTextColor(trendSector.first.Net))}>
                  {formatNet(trendSector.first.Net)}
                </div>
                <div className="text-xs text-ink-3">{trendSector.first.Time}</div>
              </div>
              <div className="rounded-lg bg-surface-2 p-3">
                <div className="text-xs text-ink-3 mb-1">最新</div>
                <div className={cn('text-sm font-mono font-medium', netTextColor(trendSector.latest.Net))}>
                  {formatNet(trendSector.latest.Net)}
                </div>
                <div className="text-xs text-ink-3">{trendSector.latest.Time}</div>
              </div>
              <div className="rounded-lg bg-surface-2 p-3">
                <div className="text-xs text-ink-3 mb-1">极值振幅</div>
                <div className="text-sm font-mono font-medium text-primary">
                  {formatNet(trendSector.peak.Net - trendSector.valley.Net)}
                </div>
                <div className="text-xs text-ink-3">
                  {trendSector.valley.Time} ~ {trendSector.peak.Time}
                </div>
              </div>
              <div className="rounded-lg bg-surface-2 p-3">
                <div className="text-xs text-ink-3 mb-1">涨跌幅</div>
                <div className={cn('text-sm font-mono font-medium', netTextColor(trendSector.latest.ChangePct))}>
                  {formatChangePct(trendSector.latest.ChangePct)}
                </div>
                <div className="text-xs text-ink-3">{trendSector.latest.Time}</div>
              </div>
              <div className="rounded-lg bg-surface-2 p-3">
                <div className="text-xs text-ink-3 mb-1">主力净占比</div>
                <div className={cn('text-sm font-mono font-medium', netTextColor(trendSector.latest.MainRate))}>
                  {formatRate(trendSector.latest.MainRate)}
                </div>
                <div className="text-xs text-ink-3">超大+大单合计</div>
              </div>
              <div className="rounded-lg bg-surface-2 p-3">
                <div className="text-xs text-ink-3 mb-1">超大单</div>
                <div className={cn('text-sm font-mono font-medium', netTextColor(trendSector.latest.SuperNet))}>
                  {formatNet(trendSector.latest.SuperNet)}
                </div>
                <div className={cn('text-xs font-mono', netTextColor(trendSector.latest.SuperRate), 'opacity-70')}>
                  占比 {formatRate(trendSector.latest.SuperRate)}
                </div>
              </div>
              <div className="rounded-lg bg-surface-2 p-3">
                <div className="text-xs text-ink-3 mb-1">大单</div>
                <div className={cn('text-sm font-mono font-medium', netTextColor(trendSector.latest.BigNet))}>
                  {formatNet(trendSector.latest.BigNet)}
                </div>
                <div className={cn('text-xs font-mono', netTextColor(trendSector.latest.BigRate), 'opacity-70')}>
                  占比 {formatRate(trendSector.latest.BigRate)}
                </div>
              </div>
              <div className="rounded-lg bg-surface-2 p-3">
                <div className="text-xs text-ink-3 mb-1">累计净变化</div>
                {(() => {
                  const delta = trendSector.latest.Net - trendSector.first.Net
                  return (
                    <div className={cn('text-sm font-mono font-medium', netTextColor(delta))}>
                      {formatNet(delta)}
                    </div>
                  )
                })()}
                <div className="text-xs text-ink-3">
                  {trendSector.first.Time} → {trendSector.latest.Time}
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-surface-2 p-4">
              <div className="text-xs text-ink-3 mb-3">资金流变化趋势</div>
              <SectorTrendChart points={trendSector.points} />
            </div>

            <div className="rounded-lg bg-surface-2 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-ink-3">相关板块新闻</span>
                {newsLoading && (
                  <span className="text-[10px] text-ink-3 animate-pulse">搜索中...</span>
                )}
              </div>
              {sectorNews.length === 0 && !newsLoading ? (
                <p className="text-xs text-ink-3 py-3 text-center">暂无相关新闻</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {sectorNews.map((news) => (
                    <div key={news.id} className="px-2 py-1.5 rounded hover:bg-hairline-strong transition-colors">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] text-ink-3 font-mono shrink-0">{news.ctime.replace('T', ' ').slice(5, 16)}</span>
                        <span className="text-xs text-ink-2 leading-snug line-clamp-2">{news.title || news.brief}</span>
                      </div>
                      {news.sectors && (() => {
                        try {
                          const tags = JSON.parse(news.sectors);
                          return Array.isArray(tags) && tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1 ml-8">
                              {tags.map((s: string) => (
                                <span
                                  key={s}
                                  className="text-[9px] px-1 rounded bg-primary-softer border border-primary/20 text-primary"
                                >{s}</span>
                              ))}
                            </div>
                          ) : null;
                        } catch { return null; }
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
