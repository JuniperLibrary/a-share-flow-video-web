import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { SectorSummary } from '@/types';

interface TickerTapeProps {
  sectors: SectorSummary[];
}

function formatNet(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 100) return `${(v / 100).toFixed(1)}万亿`;
  if (abs >= 1) return `${v.toFixed(1)}亿`;
  return `${(v * 100).toFixed(0)}百万`;
}

function TickerItem({ s, i }: { s: SectorSummary; i: number }) {
  const isUp = s.net >= 0;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-2 px-4 text-xs font-medium tabular-nums',
        i % 2 === 0 ? 'border-r border-glass' : '',
      )}
    >
      <span className="text-glass-muted">{s.name}</span>
      <span className={isUp ? 'text-inflow' : 'text-outflow'}>
        {isUp ? '+' : ''}{formatNet(s.net)}
      </span>
      <span className={s.changePct >= 0 ? 'text-inflow/70' : 'text-outflow/70'}>
        {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
      </span>
    </span>
  );
}

export function TickerTape({ sectors }: TickerTapeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const sectors_ = Array.isArray(sectors) ? sectors : [];

  if (sectors_.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden border-t border-glass bg-glass-md border-glass"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={cn(
          'flex whitespace-nowrap will-change-transform animate-ticker-scroll',
        )}
        style={{ animationPlayState: paused ? 'paused' : 'running' }}
      >
        {/* Double the items for seamless loop */}
        {[...sectors_, ...sectors_].map((s, i) => (
          <TickerItem key={`${s.name}-${i}`} s={s} i={i} />
        ))}
      </div>
    </div>
  );
}
