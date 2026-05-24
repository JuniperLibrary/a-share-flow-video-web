import { useState, useEffect } from 'react';
import { Tag, Spin } from '@arco-design/web-react';
import { IconRefresh, IconDownload, IconCalendar } from '@arco-design/web-react/icon';
import { api } from '../api';
import { DatePicker } from '../components/ui/date-picker';

interface SectorData {
  name: string;
  net: number;
  rate: number;
}

export function AllSectorsPage() {
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
          <span className="text-sm text-gray-500">全市场板块资金数据快照</span>
        </div>

        <SnapshotTab />
      </div>
    </div>
  );
}

function formatNet(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`;
}

function SnapshotTab() {
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SectorData[]>([]);
  const [saved, setSaved] = useState(false);
  const [saveProgress, setSaveProgress] = useState('');
  const [saveTaskId, setSaveTaskId] = useState<string | null>(null);

  const inflowCount = data.filter(s => s.net > 0).length;
  const outflowCount = data.length - inflowCount;
  const totalNet = data.reduce((sum, s) => sum + s.net, 0);

  // 初始化时加载最近一个交易日的数据
  useEffect(() => {
    api.getSectorsAllDates().then(res => {
      const dates: string[] = (res.dates || []).sort();
      const initialDate = dates.length > 0 ? dates[dates.length - 1] : new Date().toISOString().slice(0, 10);
      setDate(initialDate);
    }).catch(() => {
      setDate(new Date().toISOString().slice(0, 10));
    });
  }, []);

  useEffect(() => {
    if (!date) return;
    api.getAllSectors(date).then(res => {
      if (res.sectors?.length) {
        setData(res.sectors.map(s => ({ name: s.name, net: s.net, rate: s.rate ?? 0 })));
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
              setData(dataRes.sectors.map(s => ({ name: s.name, net: s.net, rate: s.rate ?? 0 })));
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
        setData(dataRes.sectors.map(s => ({ name: s.name, net: s.net, rate: s.rate ?? 0 })));
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
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">主力净流入 (亿)</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 w-24">净占比 (%)</th>
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
                      <td className={`px-4 py-3 text-right font-mono text-xs ${s.rate >= 0 ? 'text-rose-400/70' : 'text-emerald-400/70'}`}>
                        {s.rate !== 0 ? `${s.rate > 0 ? '+' : ''}${s.rate.toFixed(2)}` : '-'}
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


