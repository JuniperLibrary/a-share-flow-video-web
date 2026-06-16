import { useState, useEffect, useRef, useMemo } from 'react';
import { Button, DatePicker, Message } from '@arco-design/web-react';
import { IconRefresh, IconDownload } from '@arco-design/web-react/icon';
import html2canvas from 'html2canvas';
import { api } from '../api';
import { PageHeader } from '../components/ui/page-header';
import { EmptyState } from '../components/ui/empty-state';
import { GlassPanel } from '../components/ui/glass-panel';
import { cn, netTextColor } from '../lib/utils';
import type { DailyReport, TimelineEvent } from '../types';

function formatNet(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}亿`;
}

function formatChangePct(r: number): string {
  if (!Number.isFinite(r)) return '—';
  return `${r >= 0 ? '+' : ''}${r.toFixed(2)}%`;
}

function formatDateLabel(dateStr: string): string {
  return `${dateStr.replace(/-/g, '/')} 收盘`;
}

function SectionDivider() {
  return <div className="border-t border-hairline my-5" />;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-1 h-4 rounded-full bg-primary" />
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
    </div>
  );
}

function SectorBar({ rank, name, value, pct, maxAbs, isInflow, turnoverRate, leadStockName, leadStockChangePct }: {
  rank: number;
  name: string;
  value: number;
  pct: number;
  maxAbs: number;
  isInflow: boolean;
  turnoverRate?: number;
  leadStockName?: string;
  leadStockChangePct?: number;
}) {
  const barPct = maxAbs > 0 ? (Math.abs(value) / maxAbs) * 100 : 0;
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[10px] text-ink-3 font-mono w-4 text-right shrink-0">{rank}</span>
      <span className="text-xs text-ink w-20 truncate shrink-0" title={name}>{name}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-surface-2">
        <div
          className={cn('h-full rounded-full', isInflow ? 'bg-inflow' : 'bg-outflow')}
          style={{ width: `${Math.min(barPct, 100)}%` }}
        />
      </div>
      <span className={cn('text-xs font-mono tabular-nums w-20 text-right shrink-0', netTextColor(value))}>
        {formatNet(value)}
      </span>
      <span className={cn('text-[10px] font-mono tabular-nums w-12 text-right shrink-0', netTextColor(pct))}>
        {formatChangePct(pct)}
      </span>
      <span className="text-[10px] font-mono tabular-nums w-10 text-right shrink-0 text-ink-3">
        {turnoverRate != null ? `${turnoverRate.toFixed(1)}%` : '-'}
      </span>
      {leadStockName ? (
        <span className="text-[10px] w-24 text-right shrink-0 text-ink-3 truncate" title={`${leadStockName} ${formatChangePct(leadStockChangePct ?? 0)}`}>
          <span className="text-ink-3">{leadStockName}</span>
          {leadStockChangePct != null && (
            <span className={cn('ml-1 font-mono', netTextColor(leadStockChangePct))}>
              {formatChangePct(leadStockChangePct)}
            </span>
          )}
        </span>
      ) : (
        <span className="text-[10px] w-24 text-right shrink-0 text-ink-3">-</span>
      )}
    </div>
  );
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  const sentimentColor = event.sentiment === 'positive' ? 'text-inflow' : event.sentiment === 'negative' ? 'text-outflow' : 'text-ink-2';
  return (
    <div className="flex gap-3 py-2 border-b border-hairline last:border-0">
      <span className="text-[11px] text-ink-3 font-mono shrink-0 w-10">{event.time}</span>
      <div className="flex-1 min-w-0">
        <div className={cn('text-xs font-medium', sentimentColor)}>{event.title}</div>
        {event.description && <div className="text-[11px] text-ink-3 mt-0.5 line-clamp-2">{event.description}</div>}
      </div>
      {event.sector && <span className="text-[10px] text-ink-3 shrink-0 px-1.5 py-0.5 rounded bg-surface-2 h-fit">{event.sector}</span>}
    </div>
  );
}

export function DailyReportPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const parsed = useMemo(() => {
    if (!report?.report) return null;
    try {
      const obj = JSON.parse(report.report);
      report._parsed = obj;
      return obj as NonNullable<DailyReport['_parsed']>;
    } catch { return null; }
  }, [report]);

  useEffect(() => { loadDates(); }, []);

  useEffect(() => {
    if (selectedDate) {
      loadReport(selectedDate);
    } else {
      setReport(null);
    }
  }, [selectedDate]);

  async function loadDates() {
    try {
      const data = await api.getDailyReportDates();
      setDates(data.dates || []);
      if (data.dates?.length > 0) {
        setSelectedDate(data.dates[0]);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function loadReport(date: string) {
    try {
      const data = await api.getDailyReport(date);
      setReport(data);
    } catch {
      setReport(null);
    }
  }

  async function handleGenerate() {
    const date = selectedDate || new Date().toISOString().slice(0, 10);
    if (!selectedDate) setSelectedDate(date);
    setGenerating(true);
    try {
      const data = await api.generateDailyReport(date);
      if (data.report) {
        try { data._parsed = JSON.parse(data.report); } catch { /* ignore */ }
      }
      setReport(data);
      if (!dates.includes(date)) {
        setDates(prev => [date, ...prev]);
      }
    } catch { /* ignore */ }
    setGenerating(false);
  }

  async function handleDownloadImage() {
    if (!reportRef.current || !report) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0f0f14',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `日报_${report.date || selectedDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      Message.error('截图生成失败');
      console.error('html2canvas error:', err);
    } finally {
      setDownloading(false);
    }
  }

  const p = parsed;
  const hasSectors = p && (p.topInflows?.length > 0 || p.topOutflows?.length > 0);
  const maxAbs = p ? Math.max(
    ...(p.topInflows || []).map(s => Math.abs(s.net)),
    ...(p.topOutflows || []).map(s => Math.abs(s.net)),
    1,
  ) : 1;

  return (
    <div className="relative min-h-screen px-5 py-5">
      <div className="relative">
        <PageHeader
          title="每日日报"
          meta={<span>收盘后自动生成的大盘资金流向总结与明日展望</span>}
        />

        <div className="flex items-center gap-3 mb-6">
          <DatePicker
            style={{ width: 160 }}
            value={selectedDate}
            onChange={(v) => setSelectedDate(v || '')}
            placeholder="选择日期"
          />
          <Button
            type="primary"
            loading={generating}
            onClick={handleGenerate}
            icon={<IconRefresh />}
            className="!bg-primary !border-primary !text-primary-ink !font-semibold shadow-glow-primary hover:!brightness-110"
          >
            {generating ? '生成中…' : '生成日报'}
          </Button>
          {report && (
            <Button
              onClick={handleDownloadImage}
              loading={downloading}
              icon={<IconDownload />}
              className="!bg-surface-2 !border-hairline !text-ink hover:!bg-hairline-active !font-semibold"
            >
              下载图片
            </Button>
          )}
        </div>

        {loading ? (
          <EmptyState compact title="加载中..." />
        ) : !report ? (
          <EmptyState
            title="暂无日报"
            description={selectedDate ? `该日期还没有日报，点击"生成日报"按钮创建` : '选择一个日期或点击生成按钮'}
          />
        ) : (
          <div ref={reportRef} className="py-2">

            <GlassPanel className="p-6 space-y-0">

              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-glow-primary" />
                  <h1 className="text-lg font-semibold text-ink">每日资金流向报告</h1>
                </div>
                <span className="text-xs text-ink-3 font-mono">{formatDateLabel(report.date || selectedDate)}</span>
              </div>
              <p className="text-[11px] text-ink-3 ml-4">大盘资金流向 · 板块排行 · 明日展望</p>

              <SectionDivider />

              {p && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pb-2">
                  <div className="md:col-span-3">
                    <div className="text-[11px] text-ink-3 font-medium tracking-wide">净流向</div>
                    <div className={cn(
                      'text-[40px] font-bold tracking-tight leading-none font-mono tabular-nums mt-2',
                      netTextColor(p.netTotal),
                    )}>
                      {p.netTotal >= 0 ? '+' : ''}{p.netTotal.toFixed(2)}
                      <span className="text-base font-sans font-semibold text-ink-3 ml-1.5 align-baseline">亿</span>
                    </div>
                    <div className="flex gap-6 mt-3">
                      <div>
                        <span className="text-[10px] text-ink-3 uppercase tracking-wide">净流入</span>
                        <div className="text-base font-semibold text-inflow font-mono tabular-nums">{p.inflowCount}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-3 uppercase tracking-wide">净流出</span>
                        <div className="text-base font-semibold text-outflow font-mono tabular-nums">{p.outflowCount}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-3 uppercase tracking-wide">板块总数</span>
                        <div className="text-base font-semibold text-ink-2 font-mono tabular-nums">{(p.inflowCount || 0) + (p.outflowCount || 0)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex flex-col justify-center gap-2.5 border-t md:border-t-0 md:border-l border-hairline pt-4 md:pt-0 md:pl-6">
                    {[
                      { label: '超大单', value: p.superNetTotal },
                      { label: '大单', value: p.bigNetTotal },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-xs text-ink-3">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <div className={cn('w-16 h-1 rounded-full', item.value > 0 ? 'bg-inflow/40' : item.value < 0 ? 'bg-outflow/40' : 'bg-surface-3')}>
                            <div
                              className={cn('h-full rounded-full', item.value > 0 ? 'bg-inflow' : 'bg-outflow')}
                              style={{ width: `${Math.min(Math.abs(item.value) / Math.max(Math.abs(p.netTotal), 1) * 100, 100)}%` }}
                            />
                          </div>
                          <span className={cn('text-xs font-mono font-semibold tabular-nums w-20 text-right', netTextColor(item.value))}>
                            {formatNet(item.value)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-3">结构</span>
                      <span className="text-xs text-ink-2 text-right max-w-[180px]">{p.structureDesc}</span>
                    </div>
                  </div>
                </div>
              )}

              {hasSectors && (
                <>
                  <SectionDivider />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {p!.topInflows?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-1 h-3 rounded-full bg-inflow" />
                          <h3 className="text-sm font-semibold text-ink">流入排行</h3>
                        </div>
                        <div className="flex items-center gap-2 pb-1.5 mb-1 border-b border-hairline text-[10px] text-ink-3 font-medium tracking-wide uppercase">
                          <span className="w-4 text-right shrink-0">#</span>
                          <span className="w-20 truncate shrink-0">板块</span>
                          <span className="flex-1" />
                          <span className="w-20 text-right shrink-0">净流向</span>
                          <span className="w-12 text-right shrink-0">涨跌</span>
                          <span className="w-10 text-right shrink-0">换手</span>
                          <span className="w-24 text-right shrink-0">领涨股</span>
                        </div>
                        {p!.topInflows.map((s, i) => (
                          <SectorBar key={s.name} rank={i + 1} name={s.name} value={s.net} pct={s.changePct} maxAbs={maxAbs} isInflow turnoverRate={s.turnoverRate} leadStockName={s.leadStockName} leadStockChangePct={s.leadStockChangePct} />
                        ))}
                      </div>
                    )}
                    {p!.topOutflows?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-1 h-3 rounded-full bg-outflow" />
                          <h3 className="text-sm font-semibold text-ink">流出排行</h3>
                        </div>
                        <div className="flex items-center gap-2 pb-1.5 mb-1 border-b border-hairline text-[10px] text-ink-3 font-medium tracking-wide uppercase">
                          <span className="w-4 text-right shrink-0">#</span>
                          <span className="w-20 truncate shrink-0">板块</span>
                          <span className="flex-1" />
                          <span className="w-20 text-right shrink-0">净流向</span>
                          <span className="w-12 text-right shrink-0">涨跌</span>
                          <span className="w-10 text-right shrink-0">换手</span>
                          <span className="w-24 text-right shrink-0">领涨股</span>
                        </div>
                        {p!.topOutflows.map((s, i) => (
                          <SectorBar key={s.name} rank={i + 1} name={s.name} value={s.net} pct={s.changePct} maxAbs={maxAbs} isInflow={false} turnoverRate={s.turnoverRate} leadStockName={s.leadStockName} leadStockChangePct={s.leadStockChangePct} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {(report.summary || report.outlook) && (
                <>
                  <SectionDivider />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {report.summary && (
                      <div className="pl-4 border-l-2 border-l-inflow">
                        <div className="text-xs font-semibold text-inflow mb-2">今日总结</div>
                        <div className="text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">{report.summary}</div>
                      </div>
                    )}
                    {report.outlook && (
                      <div className="pl-4 border-l-2 border-l-outflow">
                        <div className="text-xs font-semibold text-outflow mb-2">明日展望</div>
                        <div className="text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">{report.outlook}</div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {p?.timeline && p.timeline.length > 0 && (
                <>
                  <SectionDivider />
                  <div>
                    <SectionHeader title="时间线" />
                    <div className="max-h-64 overflow-y-auto">
                      {p.timeline.map((ev, i) => (
                        <TimelineRow key={i} event={ev} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {p?.newsBriefs && p.newsBriefs.length > 0 && (
                <>
                  <SectionDivider />
                  <div>
                    <SectionHeader title="要闻" />
                    <div className="space-y-1.5">
                      {p.newsBriefs.map((nb, i) => {
                        const levelColor = nb.level === 'A' ? 'text-inflow' : nb.level === 'B' ? 'text-primary' : 'text-ink-3';
                        return (
                          <div key={i} className="flex items-baseline gap-2 py-1 border-b border-hairline last:border-0">
                            <span className={cn('text-[10px] font-semibold shrink-0', levelColor)}>[{nb.level}]</span>
                            <span className="text-xs text-ink-2 flex-1">{nb.title}</span>
                            <span className="text-[10px] text-ink-3 font-mono shrink-0">{nb.time}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {p?.copywriting && (
                <>
                  <SectionDivider />
                  <div>
                    <SectionHeader title="口播文案" />
                    <div className="text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">{p.copywriting}</div>
                  </div>
                </>
              )}

              {report.report && (
                <>
                  <SectionDivider />
                  <details>
                    <summary className="text-xs text-ink-3 cursor-pointer hover:text-ink-2 select-none">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-ink-3 mr-2" />
                      完整数据 JSON
                    </summary>
                    <pre className="text-[11px] text-ink-3 leading-relaxed overflow-auto max-h-80 whitespace-pre-wrap font-mono mt-3">
                      {JSON.stringify(parsed, null, 2)}
                    </pre>
                  </details>
                </>
              )}

            </GlassPanel>
          </div>
        )}
      </div>
    </div>
  );
}
