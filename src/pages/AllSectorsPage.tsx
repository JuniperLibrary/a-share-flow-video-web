import { useState, useEffect } from 'react';
import { Button, Tag, Spin } from '@arco-design/web-react';
import { IconRefresh, IconDownload, IconScan, IconCalendar } from '@arco-design/web-react/icon';
import { api } from '../api';
import { DatePicker } from '../components/ui/date-picker';

interface SectorData {
  name: string;
  net: number;
}

interface TrendPoint {
  date: string;
  net: number;
}

export function AllSectorsPage() {
  const [activeTab, setActiveTab] = useState<'snapshot' | 'trend'>('snapshot');

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
        <div className="flex items-baseline gap-3 mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
            全量板块
          </h1>
          <span className="text-sm text-gray-500">全市场板块资金数据快照与趋势</span>
        </div>

        <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-black/20 backdrop-blur-xl p-1 mb-6 w-fit">
          {(['snapshot', 'trend'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab === 'snapshot' ? '单日快照' : '趋势分析'}
            </button>
          ))}
        </div>

        {activeTab === 'snapshot' && <SnapshotTab />}
        {activeTab === 'trend' && <TrendTab />}
      </div>
    </div>
  );
}

function formatNet(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`;
}

function SnapshotTab() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SectorData[]>([]);
  const [saved, setSaved] = useState(false);
  const [saveProgress, setSaveProgress] = useState('');
  const [saveTaskId, setSaveTaskId] = useState<string | null>(null);

  const inflowCount = data.filter(s => s.net > 0).length;
  const outflowCount = data.length - inflowCount;
  const totalNet = data.reduce((sum, s) => sum + s.net, 0);

  useEffect(() => {
    if (!date) return;
    api.getAllSectors(date).then(res => {
      if (res.sectors?.length) {
        setData(res.sectors.map(s => ({ name: s.name, net: s.net })));
        setSaved(true);
      }
    }).catch(() => void 0);
  }, [date]);

  async function handleFetch() {
    if (!date) return;
    setLoading(true);
    setSaveProgress('正在启动获取任务...');
    try {
      const res = await api.saveAllSectors(date);
      const taskId = res.task_id;
      setSaveTaskId(taskId);

      const pollInterval = setInterval(async () => {
        try {
          const status = await api.getSaveAllStatus(taskId);
          setSaveProgress(status.progress);

          if (status.status === 'done') {
            clearInterval(pollInterval);
            setSaveTaskId(null);
            setSaveProgress('');
            setLoading(false);
            const dataRes = await api.getAllSectors(date);
            if (dataRes.sectors) {
              setData(dataRes.sectors.map(s => ({ name: s.name, net: s.net })));
              setSaved(true);
            }
          } else if (status.status === 'error') {
            clearInterval(pollInterval);
            setSaveTaskId(null);
            setSaveProgress('');
            setLoading(false);
          }
        } catch {
          clearInterval(pollInterval);
          setSaveTaskId(null);
          setSaveProgress('');
          setLoading(false);
        }
      }, 1000);
    } catch {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    if (!date) return;
    try {
      const dataRes = await api.getAllSectors(date);
      if (dataRes.sectors) {
        setData(dataRes.sectors.map(s => ({ name: s.name, net: s.net })));
        setSaved(true);
      }
    } catch { void 0; }
  }

  const sortedData = [...data].sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl shadow-2xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
            <IconCalendar style={{ color: '#22d3ee', fontSize: 13 }} />
          </div>
          <span className="text-sm font-medium text-white">全量板块数据</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DatePicker
            value={date}
            onChange={val => setDate(val)}
            style={{ width: 140 }}
          />
          <button
            onClick={handleFetch}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all"
            style={{
              background: loading ? 'rgba(6,182,212,0.08)' : 'linear-gradient(135deg, #0891b2, #0d9488)',
              color: loading ? '#22d3ee' : '#fff',
              border: 'none',
              boxShadow: loading ? 'none' : '0 0 16px rgba(6,182,212,0.12)',
            }}
          >
            <IconDownload style={{ fontSize: 13 }} />
            {loading ? '获取中...' : '获取并保存'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={!saved}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg transition-all"
            style={{
              background: saved ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: saved ? '#9ca3af' : '#4b5563',
            }}
          >
            <IconRefresh style={{ fontSize: 13 }} />
            刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-px bg-white/[0.03] mb-0">
        {[
          { label: '总板块数', value: `${data.length}`, suffix: '个', color: '#fff' },
          { label: '净流入', value: `${inflowCount}`, suffix: '个', color: '#f87171' },
          { label: '净流出', value: `${outflowCount}`, suffix: '个', color: '#34d399' },
          { label: '合计净流入', value: `${totalNet.toFixed(2)}`, suffix: '亿', color: totalNet >= 0 ? '#f87171' : '#34d399' },
        ].map(stat => (
          <div key={stat.label} className="px-5 py-3">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="text-xl font-bold" style={{ color: stat.color }}>
              {stat.value}
              <span className="text-xs font-normal text-gray-500 ml-1">{stat.suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {saveProgress && (
        <div className="mx-6 mt-4 px-4 py-2.5 rounded-lg text-xs" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', color: '#22d3ee' }}>
          {saveProgress}
        </div>
        )}

      <div className="p-5">
        {data.length === 0 && !loading ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
              <IconDownload style={{ color: '#4b5563', fontSize: 20 }} />
            </div>
            <p className="text-sm text-gray-600">请先选择日期并获取板块数据</p>
          </div>
        ) : (
          <Spin loading={loading} style={{ display: 'block' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-16">排名</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">板块名称</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">主力资金净流入 (亿)</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 w-24">趋势</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((s, i) => (
                    <tr key={s.name} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500">{i + 1}</td>
                      <td className="px-4 py-3">
                        <span className="text-white text-xs font-medium">{s.name}</span>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono text-sm font-semibold ${s.net >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatNet(s.net)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Tag
                          color={s.net >= 0 ? 'red' : 'green'}
                          style={{ borderRadius: 4, fontSize: 11 }}
                        >
                          {s.net >= 0 ? '↑ 净流入' : '↓ 净流出'}
                        </Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Spin>
        )}
      </div>
    </div>
  );
}

const COLORS = ['#f87171', '#34d399', '#22d3ee', '#fb923c', '#a78bfa', '#2dd4bf', '#f97316', '#a3e635'];

function TrendTab() {
  const [names, setNames] = useState<string[]>([]);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState<Record<string, TrendPoint[]>>({});
  const [dates, setDates] = useState<string[]>([]);
  const [quickRange, setQuickRange] = useState<number | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    api.getSectorsAllNames().then(res => setNames(res.names || [])).catch(() => void 0);
    api.getSectorsAllDates().then(res => {
      const sorted = (res.dates || []).sort();
      setDates(sorted);
      if (sorted.length > 0) {
        setStartDate(sorted[0]);
        setEndDate(sorted[sorted.length - 1]);
      }
    }).catch(() => void 0);
  }, []);

  function handleQuickRange(days: number) {
    setQuickRange(days);
    const tradingDates = dates.filter(d => {
      const dt = new Date(d);
      const w = dt.getDay();
      return w !== 0 && w !== 6;
    });
    if (tradingDates.length >= days) {
      setStartDate(tradingDates[tradingDates.length - days]);
      setEndDate(tradingDates[tradingDates.length - 1]);
    }
  }

  async function handleQuery() {
    if (selectedNames.length === 0 || !startDate || !endDate) return;
    setLoading(true);
    const result: Record<string, TrendPoint[]> = {};
    try {
      await Promise.all(
        selectedNames.map(async name => {
          const res = await api.getSectorsTrend(name, startDate, endDate);
          result[name] = (res.sectors || []).map(s => ({ date: s.date, net: s.net }));
        })
      );
      setTrendData(result);
    } catch { void 0; } finally { setLoading(false); }
  }

  const allDates = [...new Set(Object.values(trendData).flatMap(d => d.map(p => p.date)))].sort();
  const chartW = 900, chartH = 400;
  const chartLeft = 70, chartRight = chartW - 20;
  const chartTop = 20, chartBottom = chartH - 50;

  const allNets = Object.values(trendData).flatMap(d => d.map(p => p.net));
  const yMin = allNets.length > 0 ? Math.min(...allNets) : 0;
  const yMax = allNets.length > 0 ? Math.max(...allNets) : 0;
  const yPad = (yMax - yMin) * 0.1 || 10;
  const yBounds = { min: yMin - yPad, max: yMax + yPad };

  const xScale = (i: number) => chartLeft + (allDates.length <= 1 ? 0.5 : i / (allDates.length - 1)) * (chartRight - chartLeft);
  const yScale = (v: number) => chartBottom - ((v - yBounds.min) / (yBounds.max - yBounds.min)) * (chartBottom - chartTop);

  const yTicks: number[] = [];
  const yStep = Math.max(1, (yBounds.max - yBounds.min) / 6);
  for (let v = Math.ceil(yBounds.min / yStep) * yStep; v <= yBounds.max; v += yStep) {
    yTicks.push(Math.round(v * 100) / 100);
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/30 backdrop-blur-xl shadow-2xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-rose-500/20 to-amber-500/20 flex items-center justify-center">
            <IconScan style={{ color: '#fb923c', fontSize: 13 }} />
          </div>
          <span className="text-sm font-medium text-white">板块趋势分析</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowSelector(!showSelector)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}
            >
              {selectedNames.length > 0 ? `${selectedNames.length} 个板块` : '选择板块'}
            </button>
            {showSelector && (
              <div className="absolute top-full mt-1 left-0 z-50 w-52 rounded-lg border border-white/[0.08] bg-black/90 backdrop-blur-xl shadow-2xl p-2 max-h-60 overflow-y-auto">
                {names.map(n => (
                  <label
                    key={n}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-white/[0.04] rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedNames.includes(n)}
                      onChange={() => {
                        setSelectedNames(prev =>
                          prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
                        );
                      }}
                      className="accent-cyan-500"
                    />
                    {n}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-1">
            {[3, 5, 10].map(d => (
              <button
                key={d}
                onClick={() => handleQuickRange(d)}
                className={`px-2.5 py-1.5 text-xs rounded-lg transition-all ${
                  quickRange === d ? 'bg-cyan-500/15 text-cyan-400' : 'text-gray-500 hover:text-gray-300'
                }`}
                style={{ border: `1px solid ${quickRange === d ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.06)'}` }}
              >
                近{d}日
              </button>
            ))}
          </div>

          <DatePicker value={startDate} onChange={val => setStartDate(val)} style={{ width: 120 }} />
          <span className="text-xs text-gray-600">至</span>
          <DatePicker value={endDate} onChange={val => setEndDate(val)} style={{ width: 120 }} />

          <button
            onClick={handleQuery}
            disabled={loading || selectedNames.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all"
            style={{
              background: loading || selectedNames.length === 0 ? 'rgba(6,182,212,0.08)' : 'linear-gradient(135deg, #0891b2, #0d9488)',
              color: loading || selectedNames.length === 0 ? '#22d3ee' : '#fff',
              border: 'none',
              boxShadow: loading ? 'none' : '0 0 16px rgba(6,182,212,0.12)',
            }}
          >
            <IconScan style={{ fontSize: 13 }} />
            {loading ? '查询中...' : '查询'}
          </button>
        </div>
      </div>

      <div className="p-5">
        {Object.keys(trendData).length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
              <IconScan style={{ color: '#4b5563', fontSize: 20 }} />
            </div>
            <p className="text-sm text-gray-600">选择板块和日期范围后点击查询</p>
          </div>
        ) : (
          <>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto rounded-lg" style={{ background: 'transparent' }}>
              {yTicks.map(v => (
                <line key={`y${v}`} x1={chartLeft} y1={yScale(v)} x2={chartRight} y2={yScale(v)} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              ))}
              <line x1={chartLeft} y1={yScale(0)} x2={chartRight} y2={yScale(0)} stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} strokeDasharray="6 4" />
              {allDates.map((t, i) => {
                if (i % Math.max(1, Math.floor(allDates.length / 8)) !== 0 && i !== allDates.length - 1) return null;
                return (
                  <text key={`x${i}`} x={xScale(i)} y={chartBottom + 16} fill="#6b7280" fontSize={11} textAnchor="middle">
                    {t.slice(5)}
                  </text>
                );
              })}
              {yTicks.map(v => (
                <text key={`yl${v}`} x={chartLeft - 8} y={yScale(v) + 4} fill="#6b7280" fontSize={10} textAnchor="end">
                  {v >= 0 ? `+${v}` : v}
                </text>
              ))}
              {Object.entries(trendData).map(([name, points], idx) => {
                if (points.length < 2) return null;
                const color = COLORS[idx % COLORS.length];
                const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(allDates.indexOf(p.date))} ${yScale(p.net)}`).join(' ');
                return (
                  <g key={name}>
                    <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (
                      <circle key={i} cx={xScale(allDates.indexOf(p.date))} cy={yScale(p.net)} r={3.5} fill="rgba(0,0,0,0.6)" stroke={color} strokeWidth={2} />
                    ))}
                  </g>
                );
              })}
            </svg>

            <div className="flex flex-wrap gap-4 mt-4 mb-6">
              {Object.entries(trendData).map(([name, points], idx) => {
                const color = COLORS[idx % COLORS.length];
                const total = points.reduce((sum, p) => sum + p.net, 0);
                return (
                  <div key={name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-xs text-gray-300 font-medium">{name}</span>
                    <span className={`text-xs ${total >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      累计 {formatNet(total)}亿
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/[0.04]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">板块</th>
                    {allDates.map(d => (
                      <th key={d} className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">{d.slice(5)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(trendData).map(([name, points]) => {
                    const row: Record<string, number> = {};
                    points.forEach(p => { row[p.date] = p.net; });
                    return (
                      <tr key={name} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-2.5 text-xs text-white font-medium">{name}</td>
                        {allDates.map(d => (
                          <td key={d} className={`px-4 py-2.5 text-right font-mono text-xs ${row[d] !== undefined ? (row[d] >= 0 ? 'text-rose-400' : 'text-emerald-400') : 'text-gray-600'}`}>
                            {row[d] !== undefined ? formatNet(row[d]) : '—'}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
