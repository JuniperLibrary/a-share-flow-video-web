import { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp, TrendingDown, BarChart3, Activity, Clock,
  RefreshCw, AlertTriangle,
  ArrowUpRight, ArrowDownRight, LineChart as LineChartIcon,
  Download, X, Gauge, Flame, Layers,
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/ui/glass-panel';
import { PageHeader } from '@/components/ui/page-header';
import { StatChip } from '@/components/ui/stat-chip';
import { EmptyState } from '@/components/ui/empty-state';
import { cn, formatNet, formatNetCompact } from '@/lib/utils';
import { tokens } from '@/lib/tokens';
import type { TickEvent, TrendPoint } from '@/lib/api-dashboard';
import { api, isStaticMode } from '@/api';
import { DatePicker } from '@/components/ui/date-picker';

function LoadingSkeleton() {
  return (
    <div className="relative min-h-screen p-6 lg:p-8">
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-white/5 rounded-lg" />
        <div className="h-4 w-40 bg-white/5 rounded" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="lg:col-span-3 h-28 bg-white/5 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-5 h-64 bg-white/5 rounded-xl" />
          <div className="lg:col-span-7 h-64 bg-white/5 rounded-xl" />
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-6 h-80 bg-white/5 rounded-xl" />
          <div className="lg:col-span-6 h-80 bg-white/5 rounded-xl" />
        </div>
        <div className="h-80 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

function LiveDot({ active = true }: { active?: boolean }) {
  if (!active) {
    return <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400/60" />;
  }
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
    </span>
  );
}

function PanelHeader({
  icon,
  title,
  right,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {title}
      </div>
      {right}
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  glow?: 'primary' | 'danger' | 'success' | 'none';
  onIconClick?: () => void;
}

function KPICard({ title, value, subtitle, trend, icon, glow = 'none', onIconClick }: KPICardProps) {
  const glowClass = {
    primary: 'shadow-glow-primary',
    danger: 'shadow-glow-danger',
    success: 'shadow-glow-success',
    none: '',
  }[glow];

  return (
    <GlassPanel
      variant="default"
      density="medium"
      className={cn(
        'group p-5 transition-all duration-300 hover:border-white/[0.14]',
        glowClass,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-white font-display tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
              {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-inflow shrink-0" />}
              {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-outflow shrink-0" />}
              <span className="truncate">{subtitle}</span>
            </p>
          )}
        </div>
        <div
          onClick={onIconClick}
          className={cn(
            'rounded-lg bg-white/5 p-2.5 text-muted-foreground shrink-0',
            onIconClick && 'cursor-pointer transition-colors hover:bg-white/10 hover:text-white',
          )}
        >
          {icon}
        </div>
      </div>
    </GlassPanel>
  );
}

function RankingItem({
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
  const barWidth = maxAbs > 0 ? (Math.abs(net) / maxAbs) * 100 : 0;
  const isInflow = net >= 0;
  const barColor = isInflow
    ? 'bg-gradient-to-r from-inflow/70 to-inflow/30'
    : 'bg-gradient-to-r from-outflow/70 to-outflow/30';

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/[0.03]">
      <span
        className={cn(
          'w-6 text-center text-sm font-medium tabular-nums',
          rank <= 3 ? 'text-white' : 'text-muted-foreground',
        )}
      >
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1 gap-2">
          <span className="text-sm font-medium text-white truncate">{name}</span>
          <span
            className={cn(
              'text-sm font-mono font-semibold tabular-nums shrink-0',
              isInflow ? 'text-inflow' : 'text-outflow',
            )}
          >
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
      <Badge variant={isInflow ? 'inflow' : 'outflow'} className="shrink-0 text-[10px]">
        {isInflow ? '流入' : '流出'}
      </Badge>
    </div>
  );
}

function HeatBlock({ name, net, maxAbs }: { name: string; net: number; maxAbs: number }) {
  const intensity = maxAbs > 0 ? Math.abs(net) / maxAbs : 0;
  const isInflow = net >= 0;
  const bgIntensity = Math.max(0.05, Math.min(0.4, intensity * 0.4));
  const bgRgb = isInflow ? INFLOW_RGB : OUTFLOW_RGB;

  return (
    <div
      className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/[0.04] transition-all duration-200 hover:scale-[1.02] hover:border-white/[0.12] cursor-default"
      style={{ backgroundColor: `rgba(${bgRgb}, ${bgIntensity})` }}
    >
      <span className="text-sm text-white truncate">{name}</span>
      <span
        className={cn(
          'text-xs font-mono font-medium tabular-nums ml-2 shrink-0',
          isInflow ? 'text-inflow' : 'text-outflow',
        )}
      >
        {formatNet(net)}
      </span>
    </div>
  );
}

function TimelineEventCard({ event, index }: { event: TickEvent; index: number }) {
  const dotColor =
    event.sentiment === 'positive'
      ? 'bg-inflow'
      : event.sentiment === 'negative'
        ? 'bg-outflow'
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
              event.sentiment === 'positive'
                ? 'inflow'
                : event.sentiment === 'negative'
                  ? 'outflow'
                  : 'outline'
            }
            className="text-[10px] px-1.5 py-0"
          >
            {event.sentiment === 'positive'
              ? '涌入'
              : event.sentiment === 'negative'
                ? '流出'
                : '异动'}
          </Badge>
        </div>
        <p className="text-sm font-medium text-white">{event.title || event.sector}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
      </div>
    </div>
  );
}

function MarketSentimentGauge({
  activeRatio,
  inflowCount,
  outflowCount,
  totalNet,
  topSector,
  worstSector,
}: {
  activeRatio: number;
  inflowCount: number;
  outflowCount: number;
  totalNet: number;
  topSector: { name: string; net: number } | null;
  worstSector: { name: string; net: number } | null;
}) {
  const ratio = Math.max(0, Math.min(100, activeRatio));
  const radius = 70;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const inflowArc = (ratio / 100) * circumference;
  const outflowArc = ((100 - ratio) / 100) * circumference;

  const sentiment = totalNet > 0 ? '偏多' : totalNet < 0 ? '偏空' : '中性';
  const sentimentColor = totalNet > 0 ? 'text-inflow' : totalNet < 0 ? 'text-outflow' : 'text-muted-foreground';

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="relative">
        <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
          <defs>
            <linearGradient id="inflowArcGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={tokens.inflow.DEFAULT} stopOpacity={0.95} />
              <stop offset="100%" stopColor={tokens.inflow.light} stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="outflowArcGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={tokens.outflow.DEFAULT} stopOpacity={0.5} />
              <stop offset="100%" stopColor={tokens.outflow.light} stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke={tokens.hairline.DEFAULT}
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke="url(#outflowArcGrad)"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${outflowArc} ${circumference}`}
            strokeDashoffset={-inflowArc}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke="url(#inflowArcGrad)"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${inflowArc} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-700"
            style={{ filter: `drop-shadow(0 0 6px ${tokens.inflow.muted})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            活跃度
          </span>
          <span className="text-3xl font-bold text-white font-display tabular-nums">
            {activeRatio}%
          </span>
          <span className={cn('text-xs font-semibold mt-0.5', sentimentColor)}>
            市场 {sentiment}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-5 text-xs w-full max-w-[280px]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-inflow shadow-glow-danger" />
          <span className="text-muted-foreground">流入</span>
          <span className="ml-auto font-mono font-semibold text-inflow tabular-nums">
            {inflowCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-outflow shadow-glow-success" />
          <span className="text-muted-foreground">流出</span>
          <span className="ml-auto font-mono font-semibold text-outflow tabular-nums">
            {outflowCount}
          </span>
        </div>
        {topSector && (
          <div className="col-span-2 flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <span className="text-muted-foreground">龙头</span>
            <span className="text-white font-medium truncate">{topSector.name}</span>
            <span className="ml-auto font-mono font-semibold text-inflow tabular-nums shrink-0">
              {formatNetCompact(topSector.net)}
            </span>
          </div>
        )}
        {worstSector && (
          <div className="col-span-2 flex items-center gap-2">
            <span className="text-muted-foreground">最弱</span>
            <span className="text-white font-medium truncate">{worstSector.name}</span>
            <span className="ml-auto font-mono font-semibold text-outflow tabular-nums shrink-0">
              {formatNetCompact(worstSector.net)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function InflowOutflowBar({
  inflowCount,
  outflowCount,
  totalNet,
}: {
  inflowCount: number;
  outflowCount: number;
  totalNet: number;
}) {
  const total = inflowCount + outflowCount;
  const inflowPct = total > 0 ? (inflowCount / total) * 100 : 50;
  const outflowPct = 100 - inflowPct;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">板块资金分布</span>
        <span
          className={cn(
            'text-sm font-mono font-semibold tabular-nums',
            totalNet >= 0 ? 'text-inflow' : 'text-outflow',
          )}
        >
          {formatNet(totalNet)}
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden flex">
        <div
          className="h-full bg-gradient-to-r from-inflow to-inflow/60 transition-all duration-700 shadow-glow-danger"
          style={{ width: `${inflowPct}%` }}
        />
        <div
          className="h-full bg-gradient-to-r from-outflow/60 to-outflow transition-all duration-700 shadow-glow-success"
          style={{ width: `${outflowPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
        <span>
          流入 <span className="text-inflow font-semibold">{inflowPct.toFixed(1)}%</span>
        </span>
        <span>
          <span className="text-outflow font-semibold">{outflowPct.toFixed(1)}%</span> 流出
        </span>
      </div>
    </div>
  );
}

function MiniRankingList({
  items,
  accent,
  empty,
}: {
  items: { name: string; net: number }[];
  accent: 'inflow' | 'outflow';
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">{empty}</p>;
  }
  return (
    <div className="space-y-1.5">
      {items.map((s, i) => (
        <div
          key={s.name}
          className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0',
                accent === 'inflow'
                  ? 'bg-inflow/15 text-inflow'
                  : 'bg-outflow/15 text-outflow',
              )}
            >
              {i + 1}
            </span>
            <span className="text-white truncate">{s.name}</span>
          </div>
          <span
            className={cn(
              'font-mono font-semibold tabular-nums shrink-0 ml-2',
              accent === 'inflow' ? 'text-inflow' : 'text-outflow',
            )}
          >
            {formatNet(s.net)}
          </span>
        </div>
      ))}
    </div>
  );
}

const AUTO_REFRESH_MS = 30_000;
const TREND_COLORS = [
  tokens.chart[1],
  tokens.chart[2],
  tokens.chart[3],
  tokens.chart[4],
  tokens.chart[5],
  tokens.chart[6],
];
const DEFAULT_TREND_PICK = 6;
const INFLOW_RGB = tokens.inflow.rgb;
const OUTFLOW_RGB = tokens.outflow.rgb;

function formatRelativeTime(updatedAt: Date | null, nowMs: number): string {
  if (!updatedAt) return '';
  const sec = Math.max(0, Math.floor((nowMs - updatedAt.getTime()) / 1000));
  if (sec < 5) return '刚刚';
  if (sec < 60) return `${sec} 秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  return updatedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<
    Awaited<ReturnType<typeof api.getDashboard>> | null
  >(null);
  const [events, setEvents] = useState<TickEvent[]>([]);
  const [trendData, setTrendData] = useState<Record<string, TrendPoint[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  const [showAllSectors, setShowAllSectors] = useState(false);
  const [sectorCategoryTab, setSectorCategoryTab] = useState<'all' | 'industry' | 'concept'>('all');
  const [sectorDate, setSectorDate] = useState('');
  const [sectorLoading, setSectorLoading] = useState(false);
  const [saveProgress, setSaveProgress] = useState('');
  const [selectedTrendSectors, setSelectedTrendSectors] = useState<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const trendInitRef = useRef<string>('');

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function loadData(isInitial = false) {
    if (isInitial) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const data = await api.getDashboard();
      setDashboardData(data);

      if (data.dates.length > 0) {
        setEvents(data.events || []);
        setTrendData(data.trend || {});
      }
      setLastUpdatedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载数据失败');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadData(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden) return;
      loadData(false);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api
      .getSectorsAllDates()
      .then((res) => {
        const dates: string[] = (res.dates || []).sort();
        const initialDate =
          dates.length > 0 ? dates[dates.length - 1] : new Date().toISOString().slice(0, 10);
        setSectorDate(initialDate);
      })
      .catch(() => {
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
    marketOverview: {
      totalSectors: 0,
      inflowCount: 0,
      outflowCount: 0,
      totalNet: 0,
      topSector: null,
      worstSector: null,
    },
    ranking: [],
  };

  const industrySectors = useMemo(
    () => ranking.filter((s) => !s.category || s.category === 'industry'),
    [ranking],
  );
  const conceptSectors = useMemo(
    () => ranking.filter((s) => s.category === 'concept'),
    [ranking],
  );

  const filteredSectors = useMemo(() => {
    if (sectorCategoryTab === 'industry') return industrySectors;
    if (sectorCategoryTab === 'concept') return conceptSectors;
    return ranking;
  }, [ranking, industrySectors, conceptSectors, sectorCategoryTab]);

  const maxAbsFlow = useMemo(
    () => Math.max(...ranking.map((s) => Math.abs(s.net)), 1),
    [ranking],
  );

  const heatSectors = useMemo(() => ranking.slice(0, 24), [ranking]);
  const maxHeatAbs = useMemo(
    () => Math.max(...heatSectors.map((s) => Math.abs(s.net)), 1),
    [heatSectors],
  );

  const trendDates = useMemo(() => {
    const allDates = new Set<string>();
    Object.values(trendData).forEach((points) => points.forEach((p) => allDates.add(p.date)));
    return Array.from(allDates).sort();
  }, [trendData]);

  const trendChartData = useMemo(() => {
    return trendDates.map((date) => {
      const point: Record<string, string | number | null> = { date: date.slice(5) };
      Object.entries(trendData).forEach(([name, points]) => {
        const match = points.find((p) => p.date === date);
        point[name] = match ? match.net : null;
      });
      return point;
    });
  }, [trendDates, trendData]);

  const trendSectorList = useMemo(() => Object.keys(trendData), [trendData]);

  useEffect(() => {
    const signature = trendSectorList.slice().sort().join(',');
    if (!signature || signature === trendInitRef.current) return;
    trendInitRef.current = signature;

    const ranked = trendSectorList
      .map((name) => {
        const points = trendData[name];
        const last = points[points.length - 1];
        return { name, abs: Math.abs(last?.net ?? 0) };
      })
      .sort((a, b) => b.abs - a.abs)
      .slice(0, DEFAULT_TREND_PICK)
      .map((s) => s.name);

    setSelectedTrendSectors(new Set(ranked));
  }, [trendData, trendSectorList]);

  const toggleTrendSector = (name: string) => {
    setSelectedTrendSectors((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const topInflowMini = useMemo(
    () => ranking.filter((s) => s.net > 0).sort((a, b) => b.net - a.net).slice(0, 3),
    [ranking],
  );
  const topOutflowMini = useMemo(
    () => ranking.filter((s) => s.net < 0).sort((a, b) => a.net - b.net).slice(0, 3),
    [ranking],
  );

  const latestDate = dashboardData?.dates?.[0] || '—';
  const activeRatio =
    marketOverview.totalSectors > 0
      ? ((marketOverview.inflowCount / marketOverview.totalSectors) * 100).toFixed(1)
      : '0';

  if (loading && !dashboardData) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="relative min-h-screen p-6 lg:p-8">
      {/* faint background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative space-y-6">
        <PageHeader
          title="AI 金融分析仪表盘"
          badge={
            <span className="rounded-md border border-primary/20 bg-primary-soft text-primary text-[10px] font-medium tracking-[0.12em] uppercase px-2 py-0.5">
              BETA
            </span>
          }
          meta={
            <>
              <span className="font-mono tabular-nums">{latestDate}</span>
              <span className="flex items-center gap-1.5">
                {isStaticMode() ? (
                  <span className="text-xs">静态数据</span>
                ) : isRefreshing || loading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span className="text-xs">刷新中...</span>
                  </>
                ) : (
                  <>
                    <LiveDot active={!!lastUpdatedAt && nowMs - lastUpdatedAt.getTime() < 60_000} />
                    <span className="text-xs">
                      {lastUpdatedAt
                        ? `实时 · ${formatRelativeTime(lastUpdatedAt, nowMs)}`
                        : '实时'}
                    </span>
                  </>
                )}
              </span>
            </>
          }
          actions={
            <>
              <DatePicker
                value={sectorDate}
                onChange={setSectorDate}
                style={{ width: 140 }}
              />
              <button
                onClick={handleSectorFetch}
                disabled={sectorLoading}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all',
                  sectorLoading
                    ? 'bg-primary-softer text-primary cursor-wait'
                    : 'bg-gradient-to-r from-primary to-financial-teal text-primary-ink shadow-glow-primary hover:brightness-110',
                )}
              >
                <Download className="h-3.5 w-3.5" />
                {sectorLoading ? '获取中...' : '获取并保存'}
              </button>
              <button
                onClick={() => loadData(true)}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-hairline-strong bg-black/30 px-4 py-2 text-sm text-ink-2 backdrop-blur-sm transition-all hover:border-hairline-active hover:text-ink disabled:opacity-50"
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                刷新
              </button>
            </>
          }
        />

        {saveProgress && (
          <div className="flex items-center justify-end">
            <div
              className="px-4 py-2 rounded-lg text-xs border border-primary/20 bg-primary/10 text-primary"
            >
              {saveProgress}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-inflow/20 bg-inflow/5 px-4 py-3 text-sm text-inflow">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
            <button
              onClick={() => loadData(true)}
              className="ml-auto underline underline-offset-2 hover:text-inflow/80"
            >
              重试
            </button>
          </div>
        )}

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <KPICard
              title="总板块数"
              value={marketOverview.totalSectors}
              subtitle={`行业 ${industrySectors.length} · 概念 ${conceptSectors.length}`}
              icon={<Layers className="h-5 w-5" />}
              onIconClick={() => setShowAllSectors(true)}
            />
          </div>
          <div className="lg:col-span-3">
            <KPICard
              title="资金净流入"
              value={marketOverview.inflowCount}
              subtitle={`${activeRatio}% 板块活跃`}
              trend="up"
              icon={<TrendingUp className="h-5 w-5" />}
              glow="danger"
            />
          </div>
          <div className="lg:col-span-3">
            <KPICard
              title="资金净流出"
              value={marketOverview.outflowCount}
              subtitle={`${marketOverview.totalSectors - marketOverview.inflowCount} 个板块`}
              trend="down"
              icon={<TrendingDown className="h-5 w-5" />}
              glow="success"
            />
          </div>
          <div className="lg:col-span-3">
            <KPICard
              title="合计净流入"
              value={formatNetCompact(marketOverview.totalNet)}
              subtitle={marketOverview.topSector ? `龙头 ${marketOverview.topSector.name}` : '暂无数据'}
              icon={<Activity className="h-5 w-5" />}
              glow={marketOverview.totalNet >= 0 ? 'danger' : 'success'}
            />
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">
          <GlassPanel variant="glow-primary" density="medium" className="lg:col-span-5 overflow-hidden">
            <PanelHeader
              icon={<Gauge className="h-4 w-4 text-primary" />}
              title="市场情绪仪表"
            />
            <div className="px-5 pb-5">
              <MarketSentimentGauge
                activeRatio={Number(activeRatio)}
                inflowCount={marketOverview.inflowCount}
                outflowCount={marketOverview.outflowCount}
                totalNet={marketOverview.totalNet}
                topSector={marketOverview.topSector}
                worstSector={marketOverview.worstSector}
              />
            </div>
          </GlassPanel>

          <GlassPanel variant="default" density="medium" className="lg:col-span-7 overflow-hidden">
            <PanelHeader
              icon={<Flame className="h-4 w-4 text-primary" />}
              title="板块活跃热力"
              right={
                <Badge variant="outline" className="text-[10px]">
                  Top 6
                </Badge>
              }
            />
            <div className="px-5 pb-5 space-y-5">
              <InflowOutflowBar
                inflowCount={marketOverview.inflowCount}
                outflowCount={marketOverview.outflowCount}
                totalNet={marketOverview.totalNet}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-inflow shadow-glow-danger" />
                    <span className="text-xs font-medium text-muted-foreground">领涨板块</span>
                  </div>
                  <MiniRankingList items={topInflowMini} accent="inflow" empty="暂无数据" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-outflow shadow-glow-success" />
                    <span className="text-xs font-medium text-muted-foreground">领跌板块</span>
                  </div>
                  <MiniRankingList items={topOutflowMini} accent="outflow" empty="暂无数据" />
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">
          <GlassPanel variant="default" density="medium" className="lg:col-span-6 overflow-hidden">
            <PanelHeader
              icon={<TrendingUp className="h-4 w-4 text-inflow" />}
              title={<span className="text-white">资金流入榜</span>}
              right={
                <span className="text-xs text-muted-foreground font-mono tabular-nums">
                  {marketOverview.inflowCount} 个板块
                </span>
              }
            />
            <div className="px-2 pb-4">
              {marketOverview.inflowCount === 0 ? (
                <EmptyState
                  compact
                  title="暂无流入板块"
                  description="市场整体资金面平淡,等待板块异动"
                />
              ) : (
                <div className="max-h-[520px] overflow-y-auto custom-scrollbar pr-1 grid gap-0.5">
                  {ranking
                    .filter((s) => s.net > 0)
                    .sort((a, b) => b.net - a.net)
                    .map((s, i) => (
                      <RankingItem
                        key={s.name}
                        rank={i + 1}
                        name={s.name}
                        net={s.net}
                        maxAbs={maxAbsFlow}
                      />
                    ))}
                </div>
              )}
            </div>
          </GlassPanel>

          <GlassPanel variant="default" density="medium" className="lg:col-span-6 overflow-hidden">
            <PanelHeader
              icon={<TrendingDown className="h-4 w-4 text-outflow" />}
              title={<span className="text-white">资金流出榜</span>}
              right={
                <span className="text-xs text-muted-foreground font-mono tabular-nums">
                  {marketOverview.outflowCount} 个板块
                </span>
              }
            />
            <div className="px-2 pb-4">
              {marketOverview.outflowCount === 0 ? (
                <EmptyState
                  compact
                  title="暂无流出板块"
                  description="市场整体资金面平淡,等待板块异动"
                />
              ) : (
                <div className="max-h-[520px] overflow-y-auto custom-scrollbar pr-1 grid gap-0.5">
                  {ranking
                    .filter((s) => s.net < 0)
                    .sort((a, b) => a.net - b.net)
                    .map((s, i) => (
                      <RankingItem
                        key={s.name}
                        rank={i + 1}
                        name={s.name}
                        net={s.net}
                        maxAbs={maxAbsFlow}
                      />
                    ))}
                </div>
              )}
            </div>
          </GlassPanel>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">
          <GlassPanel variant="default" density="medium" className="lg:col-span-6 overflow-hidden">
            <PanelHeader
              icon={<Clock className="h-4 w-4 text-primary" />}
              title="时间轴事件分析"
              right={
                <Badge variant="outline" className="text-[10px]">
                  {events.length} 条
                </Badge>
              }
            />
            <div className="px-5 pb-5 max-h-[420px] overflow-y-auto custom-scrollbar">
              {events.length === 0 ? (
                <EmptyState
                  compact
                  title="等待事件数据"
                  description="资金异动事件将在检测到时实时出现"
                />
              ) : (
                events.slice(0, 12).map((ev, i) => (
                  <TimelineEventCard key={`${ev.time}-${i}`} event={ev} index={i} />
                ))
              )}
            </div>
          </GlassPanel>

          <GlassPanel variant="default" density="medium" className="lg:col-span-6 overflow-hidden">
            <PanelHeader
              icon={<Activity className="h-4 w-4 text-primary" />}
              title="板块热度变化"
              right={
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-inflow/40" />
                    流入
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-outflow/40" />
                    流出
                  </span>
                </div>
              }
            />
            <div className="px-5 pb-5">
              {heatSectors.length === 0 ? (
                <EmptyState compact title="暂无数据" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {heatSectors.map((s) => (
                    <HeatBlock key={s.name} name={s.name} net={s.net} maxAbs={maxHeatAbs} />
                  ))}
                </div>
              )}
            </div>
          </GlassPanel>
        </div>

        <GlassPanel variant="default" density="medium" className="overflow-hidden">
          <PanelHeader
            icon={<LineChartIcon className="h-4 w-4 text-primary" />}
            title="板块资金趋势"
            right={
              <span className="text-[10px] text-muted-foreground">
                点击 chip 切换显示 · 默认 Top {DEFAULT_TREND_PICK}
              </span>
            }
          />
          <div className="px-5 pb-5 space-y-4">
            {trendSectorList.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {trendSectorList.map((name, i) => {
                  const active = selectedTrendSectors.has(name);
                  const color = TREND_COLORS[i % TREND_COLORS.length];
                  return (
                    <button
                      key={name}
                      onClick={() => toggleTrendSector(name)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all',
                        active
                          ? 'border-white/[0.18] bg-white/[0.08] text-white shadow-sm'
                          : 'border-white/[0.04] bg-white/[0.02] text-muted-foreground hover:border-white/[0.10] hover:text-white/80',
                      )}
                      style={active ? { boxShadow: `0 0 12px ${color}33` } : undefined}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: color,
                          opacity: active ? 1 : 0.35,
                        }}
                      />
                      {name}
                    </button>
                  );
                })}
              </div>
            )}

            {trendSectorList.length === 0 ? (
              <EmptyState
                icon={<LineChartIcon className="h-6 w-6" />}
                title="选择板块后查看趋势数据"
                description="点击上方 chip 切换显示的板块,默认展示净流入 Top 6"
              />
            ) : (
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={trendChartData}
                    margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                  >
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
                        border: `1px solid ${tokens.hairline.strong}`,
                        borderRadius: '8px',
                        backdropFilter: 'blur(8px)',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: tokens.ink.DEFAULT }}
                    />
                    {trendSectorList
                      .filter((name) => selectedTrendSectors.has(name))
                      .map((name) => {
                        const color = TREND_COLORS[trendSectorList.indexOf(name) % TREND_COLORS.length];
                        return (
                          <Line
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, fill: tokens.surface[1] }}
                            connectNulls
                          />
                        );
                      })}
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </GlassPanel>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>A 股情绪流 · 板块资金流向分析系统</span>
          <span className="font-mono">数据来源: 东方财富</span>
        </div>
      </div>

      {showAllSectors && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAllSectors(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <GlassPanel
            variant="glow-primary"
            density="high"
            className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-glass"
            onClick={(e) => e.stopPropagation()}
          >
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

            <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.04]">
              {(
                [
                  { key: 'all' as const, label: '全部', count: ranking.length },
                  { key: 'industry' as const, label: '行业板块', count: industrySectors.length },
                  { key: 'concept' as const, label: '概念板块', count: conceptSectors.length },
                ]
              ).map((tab) => (
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
                  <span className="font-mono tabular-nums">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-112px)] custom-scrollbar">
              {filteredSectors.length === 0 ? (
                <EmptyState title="暂无数据" />
              ) : (
                <div className="p-2">
                  {filteredSectors.map((s, i) => (
                    <div key={s.name} className="group flex items-center gap-2 px-1">
                      <RankingItem rank={i + 1} name={s.name} net={s.net} maxAbs={maxAbsFlow} />
                      {s.category && (
                        <span
                          className={cn(
                            'shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium',
                            s.category === 'industry'
                              ? 'text-primary bg-primary/10'
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
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
