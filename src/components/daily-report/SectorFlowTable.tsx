import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { cn, formatNet, getSectorColor } from '@/lib/utils';
import type { SectorSummary } from '@/types';

interface SectorFlowTableProps {
  topInflows: SectorSummary[];
  topOutflows: SectorSummary[];
}

type SortKey = 'net' | 'changePct' | 'superNet' | 'bigNet' | 'turnoverRate' | 'leadStockChangePct';
type SortDir = 'asc' | 'desc';

export function SectorFlowTable({ topInflows, topOutflows }: SectorFlowTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('net');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filter, setFilter] = useState('');

  const allSectors = useMemo(() => {
    const combined = [
      ...topInflows.map((s) => ({ ...s, _group: 'inflow' as const })),
      ...topOutflows.map((s) => ({ ...s, _group: 'outflow' as const })),
    ];
    return combined.sort((a, b) => b.net - a.net);
  }, [topInflows, topOutflows]);

  const sorted = useMemo(() => {
    const list = filter
      ? allSectors.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()))
      : allSectors;
    return [...list].sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [allSectors, sortKey, sortDir, filter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'net' || key === 'superNet' || key === 'bigNet' ? 'desc' : 'desc');
    }
  };

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortKey !== colKey) return <ArrowUpDown className="ml-0.5 h-3 w-3 opacity-30" />;
    return sortDir === 'desc' ? (
      <ArrowDown className="ml-0.5 h-3 w-3 text-primary" />
    ) : (
      <ArrowUp className="ml-0.5 h-3 w-3 text-primary" />
    );
  };

  const Th = ({ colKey, label, className }: { colKey: SortKey; label: string; className?: string }) => (
    <th
      className={cn(
        'cursor-pointer select-none px-3 py-2 text-[11px] font-semibold text-ink-3 transition-colors hover:text-white',
        className,
      )}
      onClick={() => toggleSort(colKey)}
    >
      <div className="inline-flex items-center">
        {label}
        <SortIcon colKey={colKey} />
      </div>
    </th>
  );

  const cellClass = 'px-3 py-2 text-xs tabular-nums whitespace-nowrap';

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/30 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">板块资金流向排行</span>
          <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-ink-3">
            {allSectors.length} 板块
          </span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="搜索板块…"
            className="w-32 rounded-lg border border-white/[0.06] bg-black/40 py-1 pl-7 pr-2 text-xs text-white placeholder-ink-3 outline-none transition-colors focus:border-primary/30"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-ink-3">#</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-ink-3">板块</th>
              <Th colKey="net" label="净流入(亿)" />
              <Th colKey="changePct" label="涨跌幅" className="text-right" />
              <Th colKey="superNet" label="超大单(亿)" className="text-right" />
              <Th colKey="bigNet" label="大单(亿)" className="text-right" />
              <Th colKey="turnoverRate" label="换手率" className="text-right" />
              <th className="px-3 py-2 text-right text-[11px] font-semibold text-ink-3">领涨股</th>
              <Th colKey="leadStockChangePct" label="领涨%" className="text-right" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr
                key={s.name}
                className={cn(
                  'transition-colors hover:bg-white/[0.03]',
                  i < sorted.length - 1 && 'border-b border-white/[0.02]',
                )}
              >
                <td className={cn(cellClass, 'text-ink-3')}>{i + 1}</td>
                <td className={cn(cellClass, 'font-medium')}>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: getSectorColor(s.name, i) }}
                    />
                    <span className="text-white">{s.name}</span>
                    <span
                      className={cn(
                        'ml-1 rounded px-1 py-0.5 text-[10px] font-medium',
                        s.net > 0
                          ? 'bg-inflow-muted text-inflow'
                          : 'bg-outflow-muted text-outflow',
                      )}
                    >
                      {s.net > 0 ? '流入' : '流出'}
                    </span>
                  </div>
                </td>
                <td className={cn(cellClass, s.net > 0 ? 'text-inflow' : 'text-outflow', 'font-medium')}>
                  {formatNet(s.net)}
                </td>
                <td className={cn(cellClass, 'text-right', s.changePct > 0 ? 'text-inflow' : s.changePct < 0 ? 'text-outflow' : 'text-ink-2')}>
                  {s.changePct > 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                </td>
                <td className={cn(cellClass, 'text-right', s.superNet > 0 ? 'text-inflow' : s.superNet < 0 ? 'text-outflow' : 'text-ink-2')}>
                  {s.superNet > 0 ? '+' : ''}{s.superNet.toFixed(1)}
                </td>
                <td className={cn(cellClass, 'text-right', s.bigNet > 0 ? 'text-inflow' : s.bigNet < 0 ? 'text-outflow' : 'text-ink-2')}>
                  {s.bigNet > 0 ? '+' : ''}{s.bigNet.toFixed(1)}
                </td>
                <td className={cn(cellClass, 'text-right text-ink-2')}>
                  {s.turnoverRate.toFixed(1)}%
                </td>
                <td className={cn(cellClass, 'text-right text-ink-2')}>
                  {s.leadStockName || '—'}
                </td>
                <td className={cn(cellClass, 'text-right', s.leadStockChangePct > 0 ? 'text-inflow' : s.leadStockChangePct < 0 ? 'text-outflow' : 'text-ink-2')}>
                  {s.leadStockName ? `${s.leadStockChangePct > 0 ? '+' : ''}${s.leadStockChangePct.toFixed(2)}%` : '—'}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-xs text-ink-3">
                  {filter ? '无匹配板块' : '暂无板块数据'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
