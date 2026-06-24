import { TrendingUp, TrendingDown, Building2, Banknote, PieChart, BarChart3, AlertTriangle } from 'lucide-react';
import { cn, formatNetCompact } from '@/lib/utils';

interface MarketOverviewProps {
  netTotal: number;
  inflowCount: number;
  outflowCount: number;
  superNetTotal: number;
  bigNetTotal: number;
  structureDesc: string;
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: 'inflow' | 'outflow' | 'neutral' | 'primary';
}

function KpiCard({ icon, label, value, sub, tone = 'neutral' }: KpiCardProps) {
  const toneBorder = {
    inflow: 'border-inflow/15',
    outflow: 'border-outflow/15',
    neutral: 'border-white/[0.06]',
    primary: 'border-primary/15',
  };
  const toneIcon = {
    inflow: 'text-inflow',
    outflow: 'text-outflow',
    neutral: 'text-ink-3',
    primary: 'text-primary',
  };

  return (
    <div className={cn('rounded-xl border bg-black/30 px-4 py-3 backdrop-blur-sm', toneBorder[tone])}>
      <div className="mb-1 flex items-center gap-1.5">
        <span className={cn('h-3.5 w-3.5', toneIcon[tone])}>{icon}</span>
        <span className="text-[11px] font-medium text-ink-3">{label}</span>
      </div>
      <div className={cn('text-lg font-bold tabular-nums', tone === 'inflow' ? 'text-inflow' : tone === 'outflow' ? 'text-outflow' : 'text-white')}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-ink-3">{sub}</div>}
    </div>
  );
}

export function MarketOverview({
  netTotal,
  inflowCount,
  outflowCount,
  superNetTotal,
  bigNetTotal,
  structureDesc,
}: MarketOverviewProps) {
  const tone = netTotal > 0 ? 'inflow' : netTotal < 0 ? 'outflow' : 'neutral';
  const totalSectors = inflowCount + outflowCount;
  const inflowRatio = totalSectors > 0 ? ((inflowCount / totalSectors) * 100).toFixed(0) : '—';

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      <KpiCard
        icon={netTotal > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        label="主力净流向"
        value={formatNetCompact(netTotal)}
        sub={structureDesc}
        tone={tone}
      />
      <KpiCard
        icon={<BarChart3 className="h-3.5 w-3.5" />}
        label="板块情绪"
        value={`${inflowCount}/${outflowCount}`}
        sub={`流入 ${inflowRatio}% · 共 ${totalSectors} 板块`}
        tone={netTotal > 0 ? 'inflow' : 'outflow'}
      />
      <KpiCard
        icon={<Building2 className="h-3.5 w-3.5" />}
        label="超大单净额"
        value={formatNetCompact(superNetTotal)}
        sub={superNetTotal > 0 ? '机构偏多' : '机构偏空'}
        tone={superNetTotal > 0 ? 'inflow' : 'outflow'}
      />
      <KpiCard
        icon={<Banknote className="h-3.5 w-3.5" />}
        label="大单净额"
        value={formatNetCompact(bigNetTotal)}
        sub={bigNetTotal > 0 ? '大户偏多' : '大户偏空'}
        tone={bigNetTotal > 0 ? 'inflow' : 'outflow'}
      />
      <KpiCard
        icon={<PieChart className="h-3.5 w-3.5" />}
        label="资金结构"
        value={structureDesc || '—'}
        sub={netTotal > 0 ? '整体流入' : '整体流出'}
        tone="primary"
      />
      <KpiCard
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        label="净流入板块"
        value={`${inflowCount} 个`}
        sub={`净流出 ${outflowCount} 个`}
        tone={inflowCount >= outflowCount ? 'inflow' : 'outflow'}
      />
    </div>
  );
}
