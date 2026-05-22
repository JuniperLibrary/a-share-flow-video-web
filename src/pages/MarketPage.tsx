import { useState, useEffect, useCallback, useRef } from 'react';
import { Tag, Button } from '@arco-design/web-react';
import { IconPlayArrow, IconRefresh, IconInfoCircle } from '@arco-design/web-react/icon';
import { apiUrl } from '../utils';
import { DatePicker } from '../components/ui/date-picker';
import { Select } from '../components/ui/select';

interface TickPoint {
  Time: string;
  Name: string;
  Net: number;
}

interface TickSnapshot {
  points: TickPoint[];
  date: string;
  running: boolean;
  count: number;
  lastTime: string;
}

interface MarketEvent {
  type: string;
  sector: string;
  time: string;
  description: string;
  title: string;
}

interface BackendTimelineEvent {
  time: string;
  timeMinutes: number;
  sector: string;
  title: string;
  description: string;
  sentiment: string;
}

interface TickEventsPayload {
  timeline: BackendTimelineEvent[];
  events: unknown[];
  ticker: unknown[];
}

interface SSEMessage {
  type: string;
  text: string;
}

const SECTOR_COLORS: Record<string, string> = {
  '半导体': '#22d3ee', 'AI应用': '#34d399', 'CPO概念': '#6ee7b7',
  '有色金属': '#fbbf24', '锂矿概念': '#4ade80', '商业航天': '#f87171',
  '电池': '#4ade80', '机器人': '#2dd4bf', '创新药': '#c084fc',
  '白酒': '#fb923c', '消费电子': '#60a5fa', '银行': '#fcd34d',
  '人工智能': '#38bdf8', '云计算': '#a78bfa', '低空经济': '#fb7185',
  '电网设备': '#60a5fa', '通信设备': '#22d3ee', '传媒': '#c084fc',
  '国产芯片': '#f87171', '元件': '#34d399', '通信服务': '#a78bfa',
};

function getSectorColor(name: string, index: number): string {
  for (const key in SECTOR_COLORS) {
    if (name.includes(key)) return SECTOR_COLORS[key];
  }
  const palette = ['#22d3ee', '#fbbf24', '#60a5fa', '#34d399', '#f87171', '#4ade80', '#c084fc', '#fb923c', '#a78bfa', '#60a5fa', '#22d3ee', '#c084fc', '#f87171', '#a78bfa', '#34d399', '#fb7185', '#fcd34d', '#38bdf8', '#2dd4bf', '#4ade80'];
  return palette[index % palette.length];
}

function formatNet(net: number): string {
  return `${net >= 0 ? '+' : ''}${net.toFixed(1)}亿`;
}

export function MarketPage() {
  const [snapshots, setSnapshots] = useState<TickSnapshot[]>([]);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [selectedSession, setSelectedSession] = useState<'full' | 'morning'>('full');
  const [replayDate, setReplayDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch(apiUrl('/api/tick/dates'))
      .then(r => r.json())
      .then(data => setAvailableDates(data.dates || []))
      .catch(() => void 0);
  }, []);

  const fetchTickEvents = useCallback((date: string, session: string) => {
    fetch(apiUrl(`/api/tick/events/${date}?session=${session}`))
      .then(r => r.json())
      .then((payload: TickEventsPayload) => {
        const mapped: MarketEvent[] = (payload.timeline || []).map(ev => ({
          type: ev.sentiment === 'positive' ? '资金涌入' : ev.sentiment === 'negative' ? '资金流出' : '资金异动',
          sector: ev.sector,
          time: ev.time,
          title: ev.title,
          description: ev.description,
        }));
        setEvents(mapped);
      })
      .catch(() => void 0);
  }, []);

  const readStream = useCallback(async (url: string, onTick: (snap: TickSnapshot) => void, onDone: () => void) => {
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.body) return;

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
              const snap: TickSnapshot = JSON.parse(msg.text);
              onTick(snap);
            } else if (msg.type === 'replay_done' || msg.type === 'done') {
              onDone();
            }
          } catch { void 0; }
        }
      }
    } catch {
      setConnected(false);
    } finally {
      abortRef.current = null;
    }
  }, []);

  const connectLive = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setIsReplaying(false);
    setSnapshots([]);

    readStream(
      apiUrl('/api/tick/stream'),
      (snap) => {
        setSnapshots(prev => {
          const filtered = prev.filter(s =>
            selectedSession === 'morning' ? s.points.every(p => p.Time <= '11:30') : true
          );
          return [...filtered, snap];
        });
      },
      () => void 0
    );
  }, [selectedSession, readStream]);

  const connectReplay = useCallback((date: string) => {
    if (abortRef.current) abortRef.current.abort();
    setIsReplaying(true);
    setSnapshots([]);

    fetchTickEvents(date, selectedSession);

    readStream(
      apiUrl(`/api/tick/replay-stream?date=${date}`),
      (snap) => setSnapshots(prev => [...prev, snap]),
      () => setIsReplaying(false)
    );
  }, [selectedSession, fetchTickEvents, readStream]);

  useEffect(() => {
    connectLive();
    return () => { abortRef.current?.abort(); };
  }, [connectLive]);

  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const latestPoints = latestSnapshot?.points || [];
  const latestNet = new Map<string, number>();
  for (const p of latestPoints) latestNet.set(p.Name, p.Net);

  const sectors = Array.from(latestNet.entries())
    .map(([name, net]) => ({ name, net }))
    .sort((a, b) => b.net - a.net);

  const positiveSectors = sectors.filter(s => s.net >= 0);
  const negativeSectors = sectors.filter(s => s.net < 0);

  const allTimes = Array.from(new Set(latestPoints.map(p => p.Time))).sort();
  const curves = sectors.map((s, i) => {
    const data: number[] = [];
    for (const t of allTimes) {
      const pt = latestPoints.find(p => p.Name === s.name && p.Time === t);
      data.push(pt ? pt.Net : (data[data.length - 1] ?? 0));
    }
    return { ...s, data, times: allTimes, color: getSectorColor(s.name, i) };
  });

  const chartW = 720, chartH = 480;
  const chartLeft = 70, chartRight = chartW - 120;
  const chartTop = 20, chartBottom = chartH - 40;
  const yMin = Math.min(0, ...curves.flatMap(c => c.data));
  const yMax = Math.max(0, ...curves.flatMap(c => c.data));
  const yPad = (yMax - yMin) * 0.15 || 20;
  const yBounds = { min: yMin - yPad, max: yMax + yPad };
  const xScale = (i: number) => chartLeft + (allTimes.length <= 1 ? 0.5 : i / (allTimes.length - 1)) * (chartRight - chartLeft);
  const yScale = (v: number) => chartBottom - ((v - yBounds.min) / (yBounds.max - yBounds.min)) * (chartBottom - chartTop);

  const yTicks: number[] = [];
  const yRange = yBounds.max - yBounds.min;
  const yStep = Math.max(10, Math.round(yRange / 8 / 10) * 10);
  for (let v = Math.ceil(yBounds.min / yStep) * yStep; v <= yBounds.max; v += yStep) yTicks.push(v);

  const xTimeLabels = ['09:30', '10:30', '11:30', '13:00', '14:00', '15:00'];
  const xLabelPositions = xTimeLabels.map(label => {
    const idx = allTimes.findIndex(t => t >= label);
    return idx >= 0 ? idx : allTimes.length - 1;
  });

  const isTrading = latestSnapshot?.running || false;
  const displayDate = replayDate || latestSnapshot?.date || new Date().toISOString().slice(5, 10).replace('-', '-');
  const displayTime = latestSnapshot?.lastTime || '--:--:--';

  return (
    <div className="relative min-h-screen px-5 py-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative flex flex-col min-h-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
              板块情绪流
            </h1>
            <span className="text-sm text-gray-500">主力资金净流入 (亿)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Tag color="green" style={{ fontSize: 12, borderRadius: 4 }}>行业</Tag>
              <span className="text-base font-medium text-white">{displayDate}</span>
              <span className="text-base font-mono font-semibold text-cyan-400">{displayTime}</span>
              <Tag
                style={{
                  borderRadius: 999,
                  fontSize: 11,
                  background: isReplaying ? 'rgba(59,130,246,0.12)' : isTrading ? 'rgba(52,211,153,0.12)' : 'rgba(107,114,128,0.12)',
                  border: `1px solid ${isReplaying ? 'rgba(59,130,246,0.3)' : isTrading ? 'rgba(52,211,153,0.3)' : 'rgba(107,114,128,0.2)'}`,
                  color: isReplaying ? '#60a5fa' : isTrading ? '#34d399' : '#6b7280',
                  padding: '2px 12px',
                }}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${isReplaying ? 'bg-blue-400' : isTrading ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                {isReplaying ? '回放' : isTrading ? '实时' : '未采集'}
              </Tag>
            </div>

            <Select
              value={selectedSession}
              onChange={val => setSelectedSession(val as 'full' | 'morning')}
              style={{ width: 80 }}
              options={[{ label: '全天', value: 'full' }, { label: '早盘', value: 'morning' }]}
            />

            <DatePicker
              value={replayDate}
              onChange={val => setReplayDate(val)}
              style={{ width: 120 }}
              placeholder="回放日期"
              disabledDate={(current) => {
                const y = current.getFullYear();
                const m = String(current.getMonth() + 1).padStart(2, '0');
                const d = String(current.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;
                return !availableDates.includes(dateStr);
              }}
            />

            <button
              onClick={() => connectReplay(replayDate)}
              disabled={!replayDate}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all"
              style={{
                background: isReplaying || !replayDate ? 'rgba(59,130,246,0.08)' : 'linear-gradient(135deg, #2563eb, #0891b2)',
                color: isReplaying || !replayDate ? '#60a5fa' : '#fff',
                border: 'none',
                boxShadow: isReplaying || !replayDate ? 'none' : '0 0 16px rgba(59,130,246,0.12)',
              }}
            >
              <IconPlayArrow style={{ fontSize: 13 }} />
              {isReplaying ? '回放中' : '回放'}
            </button>

            <button
              onClick={connectLive}
              disabled={isReplaying}
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: isReplaying ? '#4b5563' : '#9ca3af',
              }}
            >
              <IconRefresh style={{ fontSize: 13 }} />
              实时
            </button>
          </div>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-4 shadow-2xl min-h-0">
            {curves.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-3 mx-auto">
                    <IconRefresh style={{ color: '#4b5563', fontSize: 20 }} />
                  </div>
                  <p className="text-sm text-gray-600">等待交易数据...</p>
                  <p className="text-xs text-gray-700 mt-1">
                    {isReplaying ? '正在回放' : isTrading ? '采集中' : '非交易时段'}
                  </p>
                </div>
              </div>
            ) : (
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full">
                {yTicks.map(v => (
                  <line key={`y${v}`} x1={chartLeft} y1={yScale(v)} x2={chartRight} y2={yScale(v)} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
                ))}
                {xLabelPositions.map((pos, i) => (
                  <line key={`x${i}`} x1={xScale(pos)} y1={chartTop} x2={xScale(pos)} y2={chartBottom} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
                ))}

                {yBounds.min < 0 && yBounds.max > 0 && (
                  <line x1={chartLeft} y1={yScale(0)} x2={chartRight} y2={yScale(0)} stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="4 4" />
                )}

                {curves.map((c, idx) => {
                  if (c.data.length < 2) return null;
                  const pathD = c.data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`).join(' ');
                  const isTop = idx === 0;

                  return (
                    <g key={c.name}>
                      {isTop && (
                        <path d={pathD} fill="none" stroke={c.color} strokeWidth={6} opacity={0.3} filter="url(#glow)" />
                      )}
                      <path d={pathD} fill="none" stroke={c.color} strokeWidth={isTop ? 2.5 : 1.5} opacity={isTop ? 1 : 0.6} strokeLinecap="round" strokeLinejoin="round" />

                      {c.data.length > 0 && (
                        <circle cx={xScale(c.data.length - 1)} cy={yScale(c.data[c.data.length - 1])} r={isTop ? 5 : 3} fill={c.color} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                      )}
                      {c.data.length > 0 && (
                        <g transform={`translate(${xScale(c.data.length - 1) + 10}, ${yScale(c.data[c.data.length - 1])})`}>
                          <text fill={c.color} fontSize={12} fontWeight={isTop ? 600 : 400}>{c.name}</text>
                          <text x={60} fill={c.color} fontSize={12} fontWeight={isTop ? 600 : 400}>{formatNet(c.net)}</text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {xLabelPositions.map((pos, i) => (
                  <text key={`xl${i}`} x={xScale(pos)} y={chartBottom + 20} fill="#6b7280" fontSize={11} textAnchor="middle">{xTimeLabels[i]}</text>
                ))}

                {yTicks.map(v => (
                  <text key={`yl${v}`} x={chartLeft - 8} y={yScale(v) + 4} fill="#6b7280" fontSize={10} textAnchor="end">{v >= 0 ? `+${v}` : `${v}`}</text>
                ))}

                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              </svg>
            )}
          </div>

          <div className="w-64 rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-4 shadow-2xl flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center">
                <IconInfoCircle style={{ color: '#fb923c', fontSize: 13 }} />
              </div>
              <span className="text-sm font-semibold text-white">市场事件</span>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center mb-3">
                    <IconInfoCircle style={{ color: '#4b5563', fontSize: 16 }} />
                  </div>
                  <p className="text-sm text-gray-600">等待数据...</p>
                </div>
              ) : (
                <div className="relative pl-5">
                  <div className="absolute left-1.5 top-2 bottom-2 w-px bg-white/[0.06]" />
                  {events.map((ev, i) => {
                    const dotColor = ev.type === '资金涌入' ? '#22d3ee' : ev.type === '资金流出' ? '#f87171' : '#fbbf24';
                    return (
                      <div key={i} className="mb-4 relative">
                        <div
                          className="absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full border-2 z-10"
                          style={{ background: dotColor, borderColor: 'rgba(0,0,0,0.5)' }}
                        />
                        <div className={`rounded-lg p-3 transition-colors ${i === 0 ? 'bg-white/[0.04]' : 'bg-transparent'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500 font-mono">{ev.time}</span>
                            <span className="text-xs font-medium" style={{ color: dotColor }}>{ev.title || ev.sector}</span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">{ev.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="w-52 rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl p-4 shadow-2xl flex flex-col min-h-0">
            <span className="text-sm font-semibold text-white text-center mb-3">资金排行榜</span>

            <div className="flex-1 flex flex-col min-h-0 mb-4">
              <div className="text-xs text-gray-500 mb-2 px-2 py-1.5 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
                净流入 TOP
              </div>
              <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
                {positiveSectors.slice(0, 10).map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between px-2 py-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 w-4 text-center text-xs">{i + 1}</span>
                      <span className="text-gray-200 truncate max-w-[80px]">{s.name}</span>
                    </div>
                    <span className="text-rose-400 font-medium whitespace-nowrap">{formatNet(s.net)}</span>
                  </div>
                ))}
                {positiveSectors.length === 0 && (
                  <p className="text-xs text-gray-600 text-center py-4">暂无数据</p>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-2 px-2 py-1.5 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
                净流出 TOP
              </div>
              <div className="max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
                {negativeSectors.slice(0, 10).map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between px-2 py-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 w-4 text-center text-xs">{i + 1}</span>
                      <span className="text-gray-200 truncate max-w-[80px]">{s.name}</span>
                    </div>
                    <span className="text-emerald-400 font-medium whitespace-nowrap">{formatNet(s.net)}</span>
                  </div>
                ))}
                {negativeSectors.length === 0 && (
                  <p className="text-xs text-gray-600 text-center py-4">暂无数据</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {events.length > 0 && (
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 backdrop-blur-xl px-5 py-3 flex items-center gap-4 overflow-hidden">
            <span className="text-base font-mono font-semibold text-cyan-400 min-w-fit">{displayTime}</span>
            <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="inline-flex gap-6" style={{ animation: 'ticker 30s linear infinite' }}>
                {events.map((ev, i) => (
                  <span key={i} className="text-xs text-gray-400">
                    <span className="text-gray-600">●</span> {ev.time} {ev.title || ev.sector}，{ev.description}
                  </span>
                ))}
              </div>
            </div>
            <style>{`
              @keyframes ticker {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}
