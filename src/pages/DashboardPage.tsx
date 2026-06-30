import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  ChevronRight,
  Compass,
  FileText,
  Layers,
  Loader2,
  Mic,
  Play,
  RefreshCw,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { GlassPanel } from '@/components/ui/glass-panel';
import { StatChip } from '@/components/ui/stat-chip';
import { api, isStaticMode } from '@/api';
import { cn, formatNet, formatNetCompact } from '@/lib/utils';

type AppPage =
  | 'dashboard'
  | 'tick'
  | 'generate'
  | 'preview'
  | 'config'
  | 'news'
  | 'fund'
  | 'notes'
  | 'tts'
  | 'debate'
  | 'dailyreport';

interface DashboardPageProps {
  onNavigate?: (page: AppPage) => void;
}

const QUICK_TOOLS: { key: AppPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'tts', label: 'TTS 配音', icon: Mic },
  { key: 'news', label: '新闻资讯', icon: FileText },
  { key: 'fund', label: '基金宝', icon: Star },
  { key: 'dailyreport', label: '每日日报', icon: Compass },
];

function LiveDot({ active = true }: { active?: boolean }) {
  if (!active) {
    return <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400/60" />;
  }
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
    </span>
  );
}

function formatRelativeTime(updatedAt: Date | null, nowMs: number): string {
  if (!updatedAt) return '';
  const sec = Math.max(0, Math.floor((nowMs - updatedAt.getTime()) / 1000));
  if (sec < 5) return '刚刚';
  if (sec < 60) return `${sec} 秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  return updatedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function FlowBar({
  inflowCount,
  outflowCount,
}: {
  inflowCount: number;
  outflowCount: number;
}) {
  const total = inflowCount + outflowCount;
  const inflowPct = total > 0 ? (inflowCount / total) * 100 : 50;

  return (
    <div className="space-y-2">
      <div className="h-2 w-full rounded-full bg-glass-subtle overflow-hidden flex">
        <div
          className="h-full bg-inflow transition-all duration-700"
          style={{ width: `${inflowPct}%` }}
        />
        <div
          className="h-full bg-outflow transition-all duration-700"
          style={{ width: `${100 - inflowPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-ink-3 tabular-nums">
        <span>
          流入 <span className="text-inflow font-semibold">{inflowPct.toFixed(1)}%</span>
        </span>
        <span>
          <span className="text-outflow font-semibold">{(100 - inflowPct).toFixed(1)}%</span> 流出
        </span>
      </div>
    </div>
  );
}

function SectorRow({
  rank,
  name,
  net,
  maxAbs,
}: {
  rank: number;
  name: string;
  net: number;
  maxAbs: number;
}) {
  const isInflow = net >= 0;
  const barWidth = maxAbs > 0 ? (Math.abs(net) / maxAbs) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-2 border-b border-hairline last:border-0">
      <span className="w-5 text-center text-xs text-ink-3 tabular-nums">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm text-ink truncate">{name}</span>
          <span
            className={cn(
              'text-xs font-mono font-semibold tabular-nums shrink-0',
              isInflow ? 'text-inflow' : 'text-outflow',
            )}
          >
            {formatNet(net)}
          </span>
        </div>
        <div className="h-1 rounded-full bg-glass-subtle overflow-hidden">
          <div
            className={cn('h-full rounded-full', isInflow ? 'bg-inflow/70' : 'bg-outflow/70')}
            style={{ width: `${Math.max(barWidth, 4)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function EventRow({
  time,
  sector,
  title,
  sentiment,
}: {
  time: string;
  sector: string;
  title: string;
  sentiment: string;
}) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-hairline last:border-0">
      <span className="w-12 shrink-0 text-[11px] font-mono text-ink-3 tabular-nums pt-0.5">
        {time}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge
            variant={
              sentiment === 'positive'
                ? 'inflow'
                : sentiment === 'negative'
                  ? 'outflow'
                  : 'outline'
            }
            className="text-[10px] px-1.5 py-0 shrink-0"
          >
            {sector}
          </Badge>
        </div>
        <p className="text-sm text-ink-2 leading-snug line-clamp-2">{title}</p>
      </div>
    </div>
  );
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [dashboardData, setDashboardData] = useState<
    Awaited<ReturnType<typeof api.getDashboard>> | null
  >(null);
  const [videoLatestDate, setVideoLatestDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saveProgress, setSaveProgress] = useState('');
  const [nowMs, setNowMs] = useState(Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const staticMode = isStaticMode();

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function loadDashboard() {
    setError(null);
    try {
      const data = await api.getDashboard();
      setDashboardData(data);
      setLastUpdatedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载数据失败');
    }
  }

  async function loadVideoDates() {
    try {
      const res = await api.getDates();
      const latest = [...(res.dates ?? [])].map(d => d.date).sort().reverse()[0];
      setVideoLatestDate(latest ?? null);
    } catch {
      setVideoLatestDate(null);
    }
  }

  async function handleRefreshData() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setError(null);
    setSaveProgress('');

    try {
      if (staticMode) {
        await loadDashboard();
        return;
      }

      const sectorDate =
        dashboardData?.dates?.[0] ?? new Date().toISOString().slice(0, 10);
      setSaveProgress('正在启动获取任务...');

      const res = await api.saveAllSectors(sectorDate);
      const taskId = res.task_id;

      await new Promise<void>((resolve, reject) => {
        pollRef.current = setInterval(async () => {
          try {
            const status = await api.getSaveAllStatus(taskId);
            setSaveProgress(status.progress || '正在获取板块数据...');

            if (status.status === 'done') {
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = undefined;
              resolve();
            } else if (status.status === 'error') {
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = undefined;
              reject(new Error(status.error || '获取数据失败'));
            }
          } catch (e) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = undefined;
            reject(e);
          }
        }, 1000);
      });

      setSaveProgress('');
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取数据失败');
      setSaveProgress('');
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    loadVideoDates();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { marketOverview, ranking, events } = useMemo(() => {
    const emptyOverview = {
      totalSectors: 0,
      inflowCount: 0,
      outflowCount: 0,
      totalNet: 0,
      topSector: null as { name: string; net: number } | null,
      worstSector: null as { name: string; net: number } | null,
    };
    return {
      marketOverview: dashboardData?.marketOverview ?? emptyOverview,
      ranking: dashboardData?.ranking ?? [],
      events: dashboardData?.events ?? [],
    };
  }, [dashboardData]);

  const topInflow = useMemo(() => {
    return ranking.filter((s) => s.net > 0).sort((a, b) => b.net - a.net).slice(0, 5);
  }, [ranking]);

  const topOutflow = useMemo(() => {
    return ranking.filter((s) => s.net < 0).sort((a, b) => a.net - b.net).slice(0, 5);
  }, [ranking]);

  const maxAbsFlow = useMemo(
    () => Math.max(...ranking.map((s) => Math.abs(s.net)), 1),
    [ranking],
  );

  const latestDate = dashboardData?.dates?.[0] ?? '—';
  const activeRatio =
    marketOverview.totalSectors > 0
      ? ((marketOverview.inflowCount / marketOverview.totalSectors) * 100).toFixed(1)
      : '0';

  const sentimentLabel =
    marketOverview.totalNet > 0 ? '偏多' : marketOverview.totalNet < 0 ? '偏空' : '中性';
  const sentimentTrend =
    marketOverview.totalNet > 0 ? 'up' : marketOverview.totalNet < 0 ? 'down' : 'flat';
  const sentimentColor =
    marketOverview.totalNet > 0 ? 'text-inflow' : marketOverview.totalNet < 0 ? 'text-outflow' : 'text-ink-3';

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {QUICK_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.key}
                type="button"
                onClick={() => onNavigate?.(tool.key)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-glass-subtle px-3 py-1.5 text-xs text-ink-2 transition-all hover:border-hairline-active hover:text-ink hover:bg-glass-hover"
              >
                <Icon className="h-3.5 w-3.5" />
                {tool.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => handleRefreshData()}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-hairline-strong bg-glass border-glass px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-hairline-active hover:text-ink disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
          {isRefreshing ? '获取中...' : '刷新数据'}
        </button>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-hairline bg-surface-1">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative px-6 py-7 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3 text-sm text-ink-3">
                <span className="font-mono tabular-nums">{latestDate}</span>
                <span className="h-3 w-px bg-hairline-strong" />
                {staticMode ? (
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-400/70" />
                    静态演示数据
                  </span>
                ) : isRefreshing ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    刷新中
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <LiveDot active={!!lastUpdatedAt && nowMs - lastUpdatedAt.getTime() < 60_000} />
                    {lastUpdatedAt
                      ? `已更新 · ${formatRelativeTime(lastUpdatedAt, nowMs)}`
                      : '点击刷新数据获取最新板块'}
                  </span>
                )}
              </div>

              <div>
                <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-ink-3 mb-2">
                  今日板块资金脉搏
                </p>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink leading-tight">
                  市场{sentimentLabel}
                  {marketOverview.topSector && (
                    <span className="text-ink-3 font-normal">
                      {' · 龙头 '}
                      {marketOverview.topSector.name}
                    </span>
                  )}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatChip trend={sentimentTrend}>
                  合计 {formatNetCompact(marketOverview.totalNet)}
                </StatChip>
                <StatChip trend="up">{marketOverview.inflowCount} 板块流入</StatChip>
                <StatChip trend="down">{marketOverview.outflowCount} 板块流出</StatChip>
                <StatChip tone="primary">{activeRatio}% 活跃</StatChip>
              </div>

              {saveProgress && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {saveProgress}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 rounded-lg border border-inflow/20 bg-inflow-softer px-4 py-3 text-sm text-inflow">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => handleRefreshData()}
                    className="ml-auto underline underline-offset-2 hover:opacity-80"
                  >
                    重试
                  </button>
                </div>
              )}
            </div>

            <div className="shrink-0 lg:text-right space-y-3">
              <div>
                <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-ink-3 mb-1">
                  合计净流入
                </p>
                <p
                  className={cn(
                    'text-4xl sm:text-5xl font-bold font-mono tabular-nums tracking-tight',
                    sentimentColor,
                  )}
                >
                  {formatNetCompact(marketOverview.totalNet)}
                </p>
                <p className="mt-1 text-xs text-ink-3">
                  覆盖 {marketOverview.totalSectors} 个板块
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-hairline/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-ink flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary" />
                  视频生成
                </h3>
                <p className="text-xs text-ink-3 mt-0.5">
                  视频生成使用热点板块数据（sectors），与首页全板块数据（sectors_all）不同
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('generate')}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-ink transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
              >
                <Layers className="h-4 w-4" />
                生成 {videoLatestDate ?? ''} 视频
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <GlassPanel variant="default" density="medium" className="overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-hairline">
            <div className="flex items-center gap-2 text-sm font-medium text-ink-2">
              <TrendingUp className="h-4 w-4 text-inflow" />
              资金流入 Top 5
            </div>
            {topInflow.length > 0 && (
              <Badge variant="inflow" className="text-[10px]">
                +{topInflow.reduce((sum, s) => sum + s.net, 0).toFixed(0)}亿
              </Badge>
            )}
          </div>
          <div className="px-5 py-4">
            {topInflow.length === 0 ? (
              <EmptyState compact title="暂无流入板块" />
            ) : (
              topInflow.map((s, i) => (
                <SectorRow
                  key={`in-${s.name}`}
                  rank={i + 1}
                  name={s.name}
                  net={s.net}
                  maxAbs={maxAbsFlow}
                />
              ))
            )}
          </div>
        </GlassPanel>

        <GlassPanel variant="default" density="medium" className="overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-hairline">
            <div className="flex items-center gap-2 text-sm font-medium text-ink-2">
              <TrendingDown className="h-4 w-4 text-outflow" />
              资金流出 Top 5
            </div>
            {topOutflow.length > 0 && (
              <Badge variant="outflow" className="text-[10px]">
                {topOutflow.reduce((sum, s) => sum + s.net, 0).toFixed(0)}亿
              </Badge>
            )}
          </div>
          <div className="px-5 py-4">
            {topOutflow.length === 0 ? (
              <EmptyState compact title="暂无流出板块" />
            ) : (
              topOutflow.map((s, i) => (
                <SectorRow
                  key={`out-${s.name}`}
                  rank={i + 1}
                  name={s.name}
                  net={s.net}
                  maxAbs={maxAbsFlow}
                />
              ))
            )}
          </div>
        </GlassPanel>

        <GlassPanel variant="default" density="medium" className="overflow-hidden md:col-span-2 xl:col-span-1">
          <div className="px-5 pt-4 pb-3 border-b border-hairline space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-ink-2">
                <Activity className="h-4 w-4 text-primary" />
                市场概览
              </div>
              <Badge variant="outline" className="text-[10px]">
                {events.length} 条异动
              </Badge>
            </div>
            <FlowBar
              inflowCount={marketOverview.inflowCount}
              outflowCount={marketOverview.outflowCount}
            />
          </div>

          <div className="px-5 py-2">
            <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-ink-3 py-2">
              最新异动
            </p>
            {events.length === 0 ? (
              <EmptyState compact title="暂无异动事件" description="板块资金异动将在此实时展示" />
            ) : (
              events.slice(0, 6).map((ev, i) => (
                <EventRow
                  key={`${ev.time}-${ev.sector}-${i}`}
                  time={ev.time}
                  sector={ev.sector}
                  title={ev.title || ev.description}
                  sentiment={ev.sentiment}
                />
              ))
            )}
          </div>
        </GlassPanel>
      </section>

      {ranking.length > 0 && (
        <section>
          <GlassPanel variant="default" density="low" className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
              <div className="flex items-center gap-2 text-sm font-medium text-ink-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                板块资金龙虎榜
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('tick')}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                查看详情
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="px-5 py-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {ranking.slice(0, 12).map((s, i) => {
                  const isInflow = s.net >= 0;
                  return (
                    <div
                      key={s.name}
                      className="flex items-center justify-between rounded-lg border border-hairline bg-glass-subtle px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] text-ink-3 tabular-nums shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-xs text-ink truncate">{s.name}</span>
                      </div>
                      <span
                        className={cn(
                          'text-xs font-mono font-semibold tabular-nums shrink-0',
                          isInflow ? 'text-inflow' : 'text-outflow',
                        )}
                      >
                        {s.net >= 0 ? '+' : ''}{s.net.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassPanel>
        </section>
      )}

      <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-ink-3 pt-2">
        <span>A 股情绪流 · 板块资金流向可视化</span>
        <span className="font-mono">数据来源：东方财富</span>
      </footer>
    </div>
  );
}
