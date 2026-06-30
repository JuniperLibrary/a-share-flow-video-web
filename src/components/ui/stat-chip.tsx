import * as React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type Trend = 'up' | 'down' | 'flat';
type Tone = 'inflow' | 'outflow' | 'neutral' | 'primary';

interface StatChipProps {
  trend?: Trend;
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

const trendToTone: Record<Trend, Tone> = {
  up: 'inflow',
  down: 'outflow',
  flat: 'neutral',
};

export function StatChip({ trend, tone, children, className }: StatChipProps) {
  const resolvedTone: Tone = tone ?? (trend ? trendToTone[trend] : 'neutral');

  const toneClasses: Record<Tone, string> = {
    inflow: 'text-inflow bg-inflow-softer border-inflow/20',
    outflow: 'text-outflow bg-outflow-softer border-outflow/20',
    neutral: 'text-ink-2 bg-glass-subtle border-hairline',
    primary: 'text-primary bg-primary-softer border-primary/20',
  };

  const Icon =
    trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5',
        'text-[11px] font-medium tabular-nums',
        toneClasses[resolvedTone],
        className,
      )}
    >
      {trend && <Icon className="h-3 w-3 shrink-0" />}
      {children}
    </span>
  );
}
