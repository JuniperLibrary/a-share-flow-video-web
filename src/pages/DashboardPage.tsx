import { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp, TrendingDown, BarChart3, Activity, Clock,
  RefreshCw, Dot, ChevronRight, AlertTriangle,
  ArrowUpRight, ArrowDownRight, LineChart,
  Download, X,
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatNet, netColor, getSectorColor } from '@/lib/utils';
import type { TickEvent, TrendPoint } from '@/lib/api-dashboard';
import { api, isStaticMode } from '@/api';
import { DatePicker } from '@/components/ui/date-picker';

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-8 animate-pulse">
      <div className="h-8 w-64 bg-white/5 rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white/5 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 h-80 bg-white/5 rounded-xl" />
        <div className="h-80 bg-white/5 rounded-xl" />
      </div>
      <div className="h-72 bg-white/5 rounded-xl" />
    </div>
  );
}

function GradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent',
        className,
      )}
    >
      {children}
    </span>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
    </span>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  accentColor?: string;
  onIconClick?: () => void;
}

function KPICard({ title, value, subtitle, trend, icon, accentColor, onIconClick }: KPICardProps) {
  const iconEl = (
    <div
      className={cn(
        'rounded-lg bg-white/5 p-2.5 text-muted-foreground',
        onIconClick && 'cursor-pointer transition-colors hover:bg-white/10 hover:text-white',
      )}
      onClick={onIconClick}
    >
      {icon}
    </div>
  );

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-black/40 backdrop-blur-md p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-black/50"
      style={accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 2 } : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
          {subtitle && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-400" />}
              {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-rose-400" />}
              {subtitle}
            </p>
          )}
        </div>
        {iconEl}
      </div>
    </div>
  );
}

interface RankingItemProps {
  rank: number;
  name: string;
  net: number;
  maxAbs: number;
}

function RankingItem({ rank, name, net, maxAbs }: RankingItemProps) {
  const barWidth = maxAbs > 0 ? (Math.abs(net) / maxAbs) * 100 : 0;
  const isInflow = net >= 0;
  const barColor = isInflow
    ? 'bg-gradient-to-r from-rose-500/60 to-rose-400/30'
    : 'bg-gradient-to-r from-emerald-500/60 to-emerald-400/30';

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/[0.03]">
      <span className={cn(
        'w-6 text-center text-sm font-medium',
        rank <= 3 ? 'text-white' : 'text-muted-foreground',
      )}>
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-white truncate">{name}</span>
          <span className={cn(
            'text-sm font-mono font-semibold tabular-nums',
            isInflow ? 'text-rose-400' : 'text-emerald-400',
          )}>
            {formatNet(net)}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700', barColor)}
            style={{ width: `${Math.max(barWidth, 2)}%` }}
          />
        </div>
      </div>
      <Badge variant={isInflow ? 'inflow' : 'outflow'} className="shrink-0">
        {isInflow ? '流入' : '流出'}
      </Badge>
    </div>
  );
}

interface HeatBlockProps {
  name: string;
  net: number;
  maxAbs: number;
}

function HeatBlock({ name, net, maxAbs }: HeatBlockProps) {
  const intensity = maxAbs > 0 ? Math.abs(net) / maxAbs : 0;
  const isInflow = net >= 0;

  const bgIntensity = Math.max(0.05, Math.min(0.4, intensity * 0.4));
  const bgColor = isInflow
    ? `rgba(245, 63, 63, ${bgIntensity})`
    : `rgba(0, 180, 42, ${bgIntensity})`;

  return (
    <div
      className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/[0.04] transition-all duration-200 hover:scale-[1.02] hover:border-white/[0.12] cursor-default"
      style={{ backgroundColor: bgColor }}
    >
      <span className="text-sm text-white truncate">{name}</span>
      <span className={cn(
        'text-xs font-mono font-medium tabular-nums ml-2 shrink-0',
        isInflow ? 'text-rose-400' : 'text-emerald-400',
      )}>
        {formatNet(net)}
      </span>
    </div>
  );
}

interface TimelineEventCardProps {
  event: TickEvent;
  index: number;
}

function TimelineEventCard({ event, index }: TimelineEventCardProps) {
  const dotColor = event.sentiment === 'positive'
    ? 'bg-cyan-400'
    : event.sentiment === 'negative'
      ? 'bg-rose-400'
      : 'bg-amber-400';

  return (
    <div className="relative pl-8 pb-6 animate-fade-in" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="absolute left-[11px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-background z-10">
        <div className={cn('w-full h-full rounded-full', dotColor)} />
      </div>
      <div className="absolute left-[15px] top-5 bottom-0 w-px bg-white/[0.06]" />
      <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3 backdrop-blur-sm transition-colors hover:border-white/[0.12]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-muted-foreground tabular-nums">{event.time}</span>
          <Badge
            variant={
              event.sentiment === 'positive' ? 'inflow'
              : event.sentiment === 'negative' ? 'outflow'
              : 'default'
            }
            className="text-[10px] px-1.5 py-0"
          >
            {event.sentiment === 'positive' ? '涌入' : event.sentiment === 'negative' ? '流出' : '异动'}
          </Badge>
        </div>
        <p className="text-sm font-medium text-white">{event.title || event.sector}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<Awaited<ReturnType<typeof api.getDashboard>> | null>(null);
  const [events, setEvents] = useState<TickEvent[]>([]);
  const [trendData, setTrendData] = useState<Record<string, TrendPoint[]>>({});
  const [error, setError] = useState<string | null>(null);

  const [showAllSectors, setShowAllSectors] = useState(false);
  const [sectorCategoryTab, setSectorCategoryTab] = useState<'all' | 'industry' | 'concept'>('all');
  const [sectorDate, setSectorDate] = useState('');
  const [sectorLoading, setSectorLoading] = useState(false);
  const [saveProgress, setSaveProgress] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboard();
      setDashboardData(data);

      if (data.dates.length > 0) {
        setEvents(data.events || []);
        setTrendData(data.trend || {});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    api.getSectorsAllDates().then(res => {
      const dates: string[] = (res.dates || []).sort();
      const initialDate = dates.length > 0 ? dates[dates.length - 1] : new Date().toISOString().slice(0, 10);
      setSectorDate(initialDate);
    }).catch(() => {
      setSectorDate(new Date().toISOString().slice(0, 10));
    });
  }, []);

  async function handleSectorFetch() {
    if (!sectorDate) return;
    setSectorLoading(true);
    setSaveProgress('正在启动获取任务...');
    try {
      const res = await api.saveAllSectors(sectorDate);
      const taskId = res.task_id;

      pollRef.current = setInterval(async () => {
        try {
          const status = await api.getSaveAllStatus(taskId);
          setSaveProgress(status.progress);

          if (status.status === 'done') {
            clearInterval(pollRef.current!);
            setSaveProgress('');
            setSectorLoading(false);
            loadData();
          } else if (status.status === 'error') {
            clearInterval(pollRef.current!);
            setSaveProgress('');
            setSectorLoading(false);
          }
        } catch {
          clearInterval(pollRef.current!);
          setSaveProgress('');
          setSectorLoading(false);
        }
      }, 1000);
    } catch {
      setSectorLoading(false);
    }
  }

  const { marketOverview, ranking } = dashboardData || {
    marketOverview: { totalSectors: 0, inflowCount: 0, outflowCount: 0, totalNet: 0, topSector: null, worstSector: null },
    ranking: [],
  };

  const industrySectors = useMemo(() => ranking.filter(s => !s.category || s.category === 'industry'), [ranking]);
  const conceptSectors = useMemo(() => ranking.filter(s => s.category === 'concept'), [ranking]);

  const filteredSectors = useMemo(() => {
    if (sectorCategoryTab === 'industry') return industrySectors;
    if (sectorCategoryTab === 'concept') return conceptSectors;
    return ranking;
  }, [ranking, industrySectors, conceptSectors, sectorCategoryTab]);

  const maxAbsFlow = useMemo(
    () => Math.max(...ranking.map(s => Math.abs(s.net)), 1),
    [ranking],
  );

  const heatSectors = useMemo(
    () => ranking.slice(0, 24),
    [ranking],
  );

  const maxHeatAbs = useMemo(
    () => Math.max(...heatSectors.map(s => Math.abs(s.net)), 1),
    [heatSectors],
  );

  const trendDates = useMemo(() => {
    const allDates = new Set<string>();
    Object.values(trendData).forEach(points => points.forEach(p => allDates.add(p.date)));
    return Array.from(allDates).sort();
  }, [trendData]);

  const trendChartData = useMemo(() => {
    return trendDates.map(date => {
      const point: Record<string, string | number | null> = { date: date.slice(5) };
      Object.entries(trendData).forEach(([name, points]) => {
        const match = points.find(p => p.date === date);
        point[name] = match ? match.net : null;
      });
      return point;
    });
  }, [trendDates, trendData]);

  const trendColors = ['#00d4ff', '#f53f3f', '#00b42a', '#ff7d00', '#7c3aed', '#14b8a6'];

  const latestDate = dashboardData?.dates?.[0] || '—';
  const activeRatio = marketOverview.totalSectors > 0
    ? ((marketOverview.inflowCount / marketOverview.totalSectors) * 100).toFixed(1)
    : '0';

  if (loading && !dashboardData) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="relative min-h-screen p-6 lg:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <GradientText className="text-2xl font-bold tracking-tight sm:text-3xl">
                AI 金融分析仪表盘
              </GradientText>
              <Badge variant="default" className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                BETA
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono">{latestDate}</span>
              <span className="flex items-center gap-1.5">
                {isStaticMode() ? (
                  <span className="text-xs text-muted-foreground">静态数据</span>
                ) : (
                  <>
                    <LiveDot />
                    <span>实时</span>
                  </>
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DatePicker value={sectorDate} onChange={setSectorDate} style={{ width: 140 }} />
            <button
              onClick={handleSectorFetch}
              disabled={sectorLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all"
              style={{
                background: sectorLoading ? 'rgba(6,182,212,0.08)' : 'linear-gradient(135deg, #0891b2, #0d9488)',
                color: sectorLoading ? '#22d3ee' : '#fff',
                border: 'none',
                boxShadow: sectorLoading ? 'none' : '0 0 16px rgba(6,182,212,0.12)',
              }}
            >
              <Download className="h-3.5 w-3.5" />
              {sectorLoading ? '获取中...' : '获取并保存'}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/30 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm transition-all hover:border-white/[0.15] hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              刷新
            </button>
          </div>
        </div>

        {saveProgress && (
          <div className="flex items-center justify-end">
            <div className="px-4 py-2 rounded-lg text-xs" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', color: '#22d3ee' }}>
              {saveProgress}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
            <button onClick={loadData} className="ml-auto underline underline-offset-2 hover:text-rose-300">
              重试
            </button>
          </div>
        )}

        {/* Row 1: KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="总板块数"
            value={marketOverview.totalSectors}
            subtitle={`行业 ${industrySectors.length} · 概念 ${conceptSectors.length}`}
            icon={<BarChart3 className="h-5 w-5" />}
            onIconClick={() => setShowAllSectors(true)}
          />
          <KPICard
            title="资金净流入"
            value={marketOverview.inflowCount}
            subtitle={`${activeRatio}% 板块活跃`}
            trend="up"
            icon={<TrendingUp className="h-5 w-5" />}
            accentColor="#f53f3f"
          />
          <KPICard
            title="资金净流出"
            value={marketOverview.outflowCount}
            subtitle={`${marketOverview.totalSectors - marketOverview.inflowCount} 个板块`}
            trend="down"
            icon={<TrendingDown className="h-5 w-5" />}
            accentColor="#00b42a"
          />
          <KPICard
            title="合计净流入"
            value={formatNet(marketOverview.totalNet)}
            subtitle={
              marketOverview.topSector
                ? `龙头: ${marketOverview.topSector.name}`
                : '暂无数据'
            }
            icon={<Activity className="h-5 w-5" />}
            accentColor={marketOverview.totalNet >= 0 ? '#f53f3f' : '#00b42a'}
          />
        </div>

        {/* Row 2: Bento Grid - Mixed sizes */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Spotlight Sector - col-span-1 */}
          <Card className="overflow-hidden border-white/[0.06] bg-black/40 backdrop-blur-md col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Activity className="h-4 w-4 text-primary" />
                热门板块
              </CardTitle>
            </CardHeader>
            <CardContent>
              {marketOverview.topSector ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-bold text-white">{marketOverview.topSector.name}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-rose-400">
                        +{marketOverview.topSector.net.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">亿</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="inflow">资金净流入</Badge>
                      <span className="text-xs text-muted-foreground">领跑全市场</span>
                    </div>
                  </div>
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{ v: 0 }, { v: 60 }, { v: 40 }, { v: 85 }, { v: 70 }, { v: 100 }]}>
                        <defs>
                          <linearGradient id="spotlightGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f53f3f" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#f53f3f" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke="#f53f3f" strokeWidth={2} fill="url(#spotlightGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">暂无数据</p>
              )}
            </CardContent>
          </Card>

          {/* Market Overview - col-span-2 */}
          <Card className="overflow-hidden border-white/[0.06] bg-black/40 backdrop-blur-md lg:col-span-2">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <LineChart className="h-4 w-4 text-primary" />
                市场情绪概览
              </CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  净流入 {marketOverview.inflowCount}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  净流出 {marketOverview.outflowCount}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
                  <p className="text-xs text-muted-foreground mb-1">最强板块</p>
                  {marketOverview.topSector ? (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{marketOverview.topSector.name}</span>
                      <span className="text-sm font-mono text-rose-400">
                        +{marketOverview.topSector.net.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
                <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
                  <p className="text-xs text-muted-foreground mb-1">最弱板块</p>
                  {marketOverview.worstSector ? (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{marketOverview.worstSector.name}</span>
                      <span className="text-sm font-mono text-emerald-400">
                        {marketOverview.worstSector.net.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
                <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
                  <p className="text-xs text-muted-foreground mb-1">市场情绪</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">
                      {marketOverview.totalNet >= 0 ? '偏多' : '偏空'}
                    </span>
                    <span className={cn(
                      'text-sm font-mono',
                      marketOverview.totalNet >= 0 ? 'text-rose-400' : 'text-emerald-400',
                    )}>
                      {formatNet(marketOverview.totalNet)}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
                  <p className="text-xs text-muted-foreground mb-1">板块活跃度</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{activeRatio}%</span>
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-primary transition-all duration-700"
                        style={{ width: `${activeRatio}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="overflow-hidden border-white/[0.06] bg-black/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-rose-400" />
                资金流入榜
              </CardTitle>
              <span className="text-xs text-muted-foreground font-mono">
                {marketOverview.inflowCount} 个板块
              </span>
            </CardHeader>
            <CardContent>
              {ranking.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">暂无数据</p>
              ) : (
                <div className="grid gap-1">
                  {ranking
                    .filter(s => s.net >= 0)
                    .sort((a, b) => b.net - a.net)
                    .slice(0, 10)
                    .map((s, i) => (
                      <RankingItem key={s.name} rank={i + 1} name={s.name} net={s.net} maxAbs={maxAbsFlow} />
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-white/[0.06] bg-black/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingDown className="h-4 w-4 text-emerald-400" />
                资金流出榜
              </CardTitle>
              <span className="text-xs text-muted-foreground font-mono">
                {marketOverview.outflowCount} 个板块
              </span>
            </CardHeader>
            <CardContent>
              {ranking.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">暂无数据</p>
              ) : (
                <div className="grid gap-1">
                  {ranking
                    .filter(s => s.net < 0)
                    .sort((a, b) => a.net - b.net)
                    .slice(0, 10)
                    .map((s, i) => (
                      <RankingItem key={s.name} rank={i + 1} name={s.name} net={s.net} maxAbs={maxAbsFlow} />
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 4: Timeline + Sector Heat Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Timeline Events */}
          <Card className="overflow-hidden border-white/[0.06] bg-black/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                时间轴事件分析
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                {events.length} 条
              </Badge>
            </CardHeader>
            <CardContent className="max-h-[420px] overflow-y-auto custom-scrollbar">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">等待事件数据...</p>
              ) : (
                events.slice(0, 12).map((ev, i) => (
                  <TimelineEventCard key={`${ev.time}-${i}`} event={ev} index={i} />
                ))
              )}
            </CardContent>
          </Card>

          {/* Sector Heat Grid */}
          <Card className="overflow-hidden border-white/[0.06] bg-black/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Activity className="h-4 w-4 text-primary" />
                板块热度变化
              </CardTitle>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-rose-500/40" />
                  流入
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-emerald-500/40" />
                  流出
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {heatSectors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">暂无数据</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {heatSectors.map(s => (
                    <HeatBlock key={s.name} name={s.name} net={s.net} maxAbs={maxHeatAbs} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 5: Dynamic Trend Chart - Full Width */}
        <Card className="overflow-hidden border-white/[0.06] bg-black/40 backdrop-blur-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <LineChart className="h-4 w-4 text-primary" />
              板块资金趋势
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {Object.keys(trendData).map((name, i) => (
                <span key={name} className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: trendColors[i % trendColors.length] }}
                  />
                  {name}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {Object.keys(trendData).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <LineChart className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">选择板块后查看趋势数据</p>
              </div>
            ) : (
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={trendChartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#86909c', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    />
                    <YAxis
                      tick={{ fill: '#86909c', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v.toFixed(0)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(13, 31, 60, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        backdropFilter: 'blur(8px)',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    {Object.keys(trendData).map((name, i) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={trendColors[i % trendColors.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, fill: '#0d1f3c' }}
                        connectNulls
                      />
                    ))}
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer credit */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>A 股情绪流 · 板块资金流向分析系统</span>
          <span className="font-mono">数据来源: 东方财富</span>
        </div>
      </div>

      {/* 全板块弹窗 */}
      {showAllSectors && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAllSectors(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1f3c] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-white">全板块数据</h2>
              </div>
              <button
                onClick={() => setShowAllSectors(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.04] bg-white/[0.01]">
              {[
                { key: 'all' as const, label: '全部', count: ranking.length },
                { key: 'industry' as const, label: '行业板块', count: industrySectors.length },
                { key: 'concept' as const, label: '概念板块', count: conceptSectors.length },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSectorCategoryTab(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    sectorCategoryTab === tab.key
                      ? 'bg-primary/15 text-primary border border-primary/25'
                      : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent',
                  )}
                >
                  {tab.label}
                  <span className="font-mono">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[calc(80vh-112px)] custom-scrollbar">
              {filteredSectors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">暂无数据</p>
              ) : (
                <div className="p-2">
                  {filteredSectors.map((s, i) => (
                    <div key={s.name} className="group flex items-center gap-2 px-1">
                      <RankingItem
                        rank={i + 1}
                        name={s.name}
                        net={s.net}
                        maxAbs={maxAbsFlow}
                      />
                      {s.category && (
                        <span
                          className={cn(
                            'shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium',
                            s.category === 'industry'
                              ? 'text-cyan-400 bg-cyan-400/10'
                              : 'text-amber-400 bg-amber-400/10',
                          )}
                        >
                          {s.category === 'industry' ? '行' : '概'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
