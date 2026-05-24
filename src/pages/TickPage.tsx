import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Tag, Input, Modal } from '@arco-design/web-react';
import { IconPlayArrow, IconDelete, IconCopy, IconHistory } from '@arco-design/web-react/icon';
import { apiUrl } from '../utils';

interface TickPoint {
  Time: string;
  Name: string;
  Net: number;
  Rate: number;
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

function formatRate(r: number): string {
  return `${r >= 0 ? '+' : ''}${r.toFixed(1)}%`;
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
            <stop offset="0%" stopColor="rgba(56,189,248,0.3)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0.02)" />
          </linearGradient>
        </defs>

        {yLabels.map((v, i) => (
          <g key={i}>
            <line
              x1={CHART_PAD.left} y1={yScale(v)} x2={CHART_W - CHART_PAD.right} y2={yScale(v)}
              stroke="rgba(255,255,255,0.06)" strokeWidth={1}
            />
            <text x={CHART_PAD.left - 8} y={yScale(v) + 4} textAnchor="end" fill="#6b7280" fontSize={11}>
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {points.map((p, i) => (
          i % Math.max(1, Math.floor(points.length / 8)) === 0 || i === points.length - 1 ? (
            <text key={i} x={xScale(i)} y={CHART_H - 8} textAnchor="middle" fill="#6b7280" fontSize={10}>
              {p.Time}
            </text>
          ) : null
        ))}

        <path d={areaD} fill="url(#trendFill)" />
        <path d={lineD} fill="none" stroke="#38bdf8" strokeWidth={2} strokeLinejoin="round" />

        {points.map((p, i) => (
          <circle key={i} cx={xScale(i)} cy={yScale(p.Net)} r={3} fill="#38bdf8" />
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
              stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="3 2"
            />
            <circle
              cx={xScale(hoverIndex!)} cy={yScale(hovered.Net)}
              r={5} fill="#38bdf8" stroke="#0f172a" strokeWidth={2}
            />
          </g>
        )}
      </svg>

      {hovered && (
        <div
          className="absolute pointer-events-none z-10 -translate-x-1/2"
          style={{ left: tooltipX, top: 4 }}
        >
          <div className="bg-gray-900/95 backdrop-blur-md border border-white/[0.08] rounded-lg px-3 py-2 text-xs shadow-xl whitespace-nowrap">
            <div className="text-gray-400 mb-1">{hovered.Time}</div>
            <div className="flex items-center gap-3">
              <span className={hovered.Net >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
                净流入 {formatNet(hovered.Net)}
              </span>
              <span className="text-gray-300">
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
  const abortRef = useRef<AbortController | null>(null);
  const autoStartSuppressed = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const initPage = async () => {
      try {
        const res = await fetch(apiUrl('/api/tick/status'));
        const data = await res.json();
        if (data.running) {
          autoStartSuppressed.current = false;
          await connectSSE();
          return;
        }

        // 未在采集 — 尝试加载最近一个交易日的历史 tick 数据
        const datesRes = await fetch(apiUrl('/api/tick/dates'));
        const datesData = await datesRes.json();
        const dates: string[] = datesData.dates || [];
        if (dates.length === 0) return;

        dates.sort();
        const latestDate = dates[dates.length - 1];

        const dataRes = await fetch(apiUrl(`/api/tick-data/${latestDate}`));
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
        }
      } catch { void 0; }
    };
    initPage();
  }, []);

  const autoStartTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (isWeekend()) return;
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
        // 启动失败时清理残留的 SSE 连接和重连定时器
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

  return (
    <div className="relative min-h-screen px-5 py-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-300 to-lime-400 bg-clip-text text-transparent">
              Tick 采集
            </h1>
            <span className="text-sm text-gray-500">实时板块资金流采集</span>
          </div>
          <div className="flex items-center gap-3">
            <Tag
              style={{
                borderRadius: 999,
                padding: '2px 14px',
                fontSize: 11,
                background: connected ? 'rgba(52,211,153,0.12)' : 'rgba(107,114,128,0.12)',
                border: `1px solid ${connected ? 'rgba(52,211,153,0.3)' : 'rgba(107,114,128,0.2)'}`,
                color: connected ? '#34d399' : '#6b7280',
              }}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
              {connected ? '采集中' : '已停止'}
            </Tag>
            {showAutoCountdown && (
              <span className="text-xs text-gray-600">
                {nextAutoStart.label} {autoStartMin > 0 ? `${autoStartMin}m ` : ''}{autoStartSec}s 后自动采集
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="rounded-xl border border-white/[0.06] bg-black/40 backdrop-blur-md p-4 transition-all duration-300 hover:border-white/[0.12]">
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className={`inline-flex h-2 w-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
              </span>
              <span className="text-xs text-gray-500">采集状态</span>
            </div>
            <div className={`text-lg font-semibold ${connected ? 'text-emerald-400' : 'text-gray-500'}`}>
              {connected ? '运行中' : '未启动'}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 min-h-[16px]">
              <span className="font-mono tabular-nums w-16 text-right">{snapshot?.count ?? 0} 轮</span>
              {snapshot?.lastTime && <span>最新 {snapshot.date} {snapshot.lastTime}</span>}
              {!connected && <span>{error ?? '等待自动采集'}</span>}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/40 backdrop-blur-md p-4 transition-all duration-300 hover:border-white/[0.12]" style={{ borderLeftColor: 'rgb(244 63 94)', borderLeftWidth: 2 }}>
            <div className="text-xs text-gray-500 mb-2">资金流入</div>
            <div className="text-lg font-semibold text-rose-400">{upCount}</div>
            <div className="text-xs text-gray-600 mt-0.5">
              {sectorRows.length > 0 ? `${(upCount / sectorRows.length * 100).toFixed(1)}%` : '-'}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/40 backdrop-blur-md p-4 transition-all duration-300 hover:border-white/[0.12]" style={{ borderLeftColor: 'rgb(52 211 153)', borderLeftWidth: 2 }}>
            <div className="text-xs text-gray-500 mb-2">资金流出</div>
            <div className="text-lg font-semibold text-emerald-400">{downCount}</div>
            <div className="text-xs text-gray-600 mt-0.5">
              {sectorRows.length > 0 ? `${(downCount / sectorRows.length * 100).toFixed(1)}%` : '-'}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/40 backdrop-blur-md p-4 transition-all duration-300 hover:border-white/[0.12]" style={{ borderLeftColor: 'rgb(56 189 248)', borderLeftWidth: 2 }}>
            <div className="text-xs text-gray-500 mb-2">最强流入</div>
            <div className="text-lg font-semibold text-white truncate">
              {topSector ? topSector.name : '-'}
            </div>
            <div className="text-xs mt-0.5 text-rose-400">
              {topSector ? formatNet(topSector.latest.Net) : '-'}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-4 shadow-2xl mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {!connected ? (
              <Button
                type="primary"
                onClick={handleStart}
                icon={<IconPlayArrow />}
                style={{
                  background: 'linear-gradient(135deg, #059669, #0d9488)',
                  border: 'none',
                  height: 32,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                开始采集
              </Button>
            ) : (
              <Button
                status="warning"
                onClick={handleStop}
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                  height: 32,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                停止采集
              </Button>
            )}
            <Button
              onClick={() => setSnapshot(null)}
              icon={<IconDelete />}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#9ca3af',
                height: 32,
                fontSize: 12,
              }}
            >
              清空
            </Button>
            <Button
              onClick={copyData}
              icon={<IconCopy />}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#9ca3af',
                height: 32,
                fontSize: 12,
              }}
            >
              复制数据
            </Button>
            <div className="flex items-center gap-3 ml-auto">
              <div className="w-44">
                <Input
                  value={filterSector}
                  onChange={setFilterSector}
                  placeholder="筛选板块..."
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                    height: 32,
                    fontSize: 12,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/30 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <IconHistory style={{ color: '#6b7280', fontSize: 14 }} />
              <span className="text-sm text-gray-400">板块资金流</span>
            </div>
            <span className="text-xs text-gray-600">{filteredRows.length} 个板块 ({snapshot?.count ?? 0} 轮)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">板块</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-500">最新净流入</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-500">主力净占比</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-500">时段方向</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-500 w-48">资金流向</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center mb-3">
                          <IconPlayArrow style={{ color: '#4b5563', fontSize: 18 }} />
                        </div>
                        <p className="text-sm text-gray-600">暂无采集数据</p>
                        <p className="text-xs text-gray-700 mt-1">系统将在交易日 9:25 / 12:55 自动开始采集</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const isUp = row.latest.Net >= 0;
                    const maxAbs = Math.max(...filteredRows.map(r => Math.abs(r.latest.Net)));
                    const barWidth = maxAbs > 0 ? (Math.abs(row.latest.Net) / maxAbs) * 100 : 0;
                    return (
                      <tr
                        key={row.name}
                        className="border-b border-white/[0.02] transition-colors hover:bg-white/[0.04]"
                        style={{ background: isUp ? 'rgba(244,63,94,0.03)' : 'rgba(52,211,153,0.03)' }}
                      >
                        <td className="px-5 py-2.5">
                          <button
                            onClick={() => setTrendSector(row)}
                            className="text-white text-xs hover:text-cyan-400 transition-colors cursor-pointer bg-transparent border-none p-0"
                          >
                            {row.name}
                          </button>
                          <span className="text-xs text-gray-600 ml-2">
                            {row.latest.Time}
                          </span>
                        </td>
                        <td className={`px-5 py-2.5 text-right font-mono text-xs ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {formatNet(row.latest.Net)}
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono text-xs text-gray-400">
                          {formatRate(row.latest.Rate)}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <span className={`text-xs font-medium ${
                            row.direction === 'up' ? 'text-rose-400' :
                            row.direction === 'down' ? 'text-emerald-400' : 'text-gray-500'
                          }`}>
                            {row.direction === 'up' ? '↑' : row.direction === 'down' ? '↓' : '→'}
                            {' '}{formatNet(row.latest.Net - row.first.Net)}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="flex-1 max-w-[120px] h-2 rounded-full overflow-hidden bg-white/[0.04]">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${isUp ? 'bg-rose-400' : 'bg-emerald-400'}`}
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

        {filteredRows.length > 0 && (
          <div className="mt-3 rounded-xl border border-white/[0.04] bg-black/20 backdrop-blur-sm px-5 py-2.5">
            <div className="flex items-center gap-5 text-xs">
              <span className="text-gray-500">
                流入: <span className="text-rose-400 font-medium">{upCount}</span>
              </span>
              <span className="text-gray-500">
                流出: <span className="text-emerald-400 font-medium">{downCount}</span>
              </span>
              <span className="text-gray-500">
                持平: <span className="text-gray-400 font-medium">{flatCount}</span>
              </span>
              <span className="text-gray-600">总计: {filteredRows.length}</span>
              {filterSector && (
                <span className="text-gray-600">筛选: {filteredRows.length}/{sectorRows.length}</span>
              )}
              {topSector && worstSector && (
                <span className="ml-auto text-gray-500">
                  最强流入: <span className="text-rose-400">{topSector.name} {formatNet(topSector.latest.Net)}</span>
                  <span className="mx-2">|</span>
                  最强流出: <span className="text-emerald-400">{worstSector.name} {formatNet(worstSector.latest.Net)}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        visible={trendSector !== null}
        onCancel={() => setTrendSector(null)}
        footer={null}
        closable={true}
        maskClosable={true}
        style={{
          width: 640,
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          backdropFilter: 'blur(24px)',
        }}
        title={
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold text-base">{trendSector?.name}</span>
            <span className="text-xs text-gray-500">{snapshot?.date}</span>
            {trendSector && (
              <span className={`text-xs font-medium ml-auto ${
                trendSector.direction === 'up' ? 'text-rose-400' :
                trendSector.direction === 'down' ? 'text-emerald-400' : 'text-gray-500'
              }`}>
                {trendSector.direction === 'up' ? '↑' : trendSector.direction === 'down' ? '↓' : '→'}
                {' '}{formatNet(trendSector.latest.Net - trendSector.first.Net)}
              </span>
            )}
          </div>
        }
      >
        {trendSector && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/[0.03] p-3">
                <div className="text-xs text-gray-500 mb-1">开盘</div>
                <div className={`text-sm font-mono font-medium ${trendSector.first.Net >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatNet(trendSector.first.Net)}
                </div>
                <div className="text-xs text-gray-600">{trendSector.first.Time}</div>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3">
                <div className="text-xs text-gray-500 mb-1">最新</div>
                <div className={`text-sm font-mono font-medium ${trendSector.latest.Net >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatNet(trendSector.latest.Net)}
                </div>
                <div className="text-xs text-gray-600">{trendSector.latest.Time}</div>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-3">
                <div className="text-xs text-gray-500 mb-1">极值振幅</div>
                <div className="text-sm font-mono font-medium text-cyan-400">
                  {formatNet(trendSector.peak.Net - trendSector.valley.Net)}
                </div>
                <div className="text-xs text-gray-600">
                  {trendSector.valley.Time} ~ {trendSector.peak.Time}
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white/[0.03] p-4">
              <div className="text-xs text-gray-500 mb-3">资金流变化趋势</div>
              <SectorTrendChart points={trendSector.points} />
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1">
              {trendSector.points.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded hover:bg-white/[0.03]">
                  <span className="text-xs text-gray-500 font-mono">{p.Time}</span>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-mono ${p.Net >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatNet(p.Net)}
                    </span>
                    <span className="text-xs font-mono text-gray-400 w-14 text-right">
                      {formatRate(p.Rate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
