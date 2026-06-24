import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, getSectorColor } from '@/lib/utils';
import type { TimelineEvent } from '@/types';

interface TimelinePanelProps {
  events: TimelineEvent[];
}

function sentimentIcon(sentiment?: string) {
  switch (sentiment) {
    case 'positive':
      return <TrendingUp className="h-3 w-3 text-inflow" />;
    case 'negative':
      return <TrendingDown className="h-3 w-3 text-outflow" />;
    default:
      return <Minus className="h-3 w-3 text-ink-3" />;
  }
}

export function TimelinePanel({ events }: TimelinePanelProps) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-5 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-ink-3" />
          <span className="text-sm font-semibold text-white">时间线事件</span>
        </div>
        <div className="py-6 text-center text-xs text-ink-3">暂无事件数据</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-5 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-ink-3" />
        <span className="text-sm font-semibold text-white">时间线事件</span>
        <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[11px] text-ink-3">
          {events.length} 件
        </span>
      </div>

      <div className="relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/[0.06]" />

        <div className="space-y-0">
          {events.map((ev, i) => (
            <div key={`${ev.time}-${i}`} className="relative flex gap-3 pb-3 last:pb-0">
              <div className="relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center">
                <div
                  className={cn(
                    'h-2.5 w-2.5 rounded-full border-2',
                    ev.sentiment === 'positive'
                      ? 'border-inflow bg-inflow/20'
                      : ev.sentiment === 'negative'
                        ? 'border-outflow bg-outflow/20'
                        : 'border-ink-3 bg-ink-3/20',
                  )}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-medium text-primary/80">{ev.time}</span>
                  {ev.sector && (
                    <span
                      className="inline-block rounded px-1 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: `${getSectorColor(ev.sector, 0)}15`,
                        color: getSectorColor(ev.sector, 0),
                      }}
                    >
                      {ev.sector}
                    </span>
                  )}
                  <span className="ml-auto">{sentimentIcon(ev.sentiment)}</span>
                </div>
                <div className="mt-0.5 text-xs font-medium text-white">{ev.title}</div>
                {ev.description && (
                  <div className="mt-0.5 text-[11px] leading-relaxed text-ink-3">{ev.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
