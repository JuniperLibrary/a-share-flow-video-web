import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
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

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const eventVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

function TimelineFallback() {
  return (
    <div className="rounded-xl border border-glass bg-glass border-glass px-4 py-5 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-ink-3" />
        <span className="text-sm font-semibold text-ink">时间线事件</span>
      </div>
      <div className="py-6 text-center text-xs text-ink-3">加载异常</div>
    </div>
  );
}

export function TimelinePanel({ events }: TimelinePanelProps) {
  try {
    if (!events || events.length === 0) {
      return (
        <div className="rounded-xl border border-glass bg-glass border-glass px-4 py-5 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-ink-3" />
            <span className="text-sm font-semibold text-ink">时间线事件</span>
          </div>
          <div className="py-6 text-center text-xs text-ink-3">暂无事件数据</div>
        </div>
      );
    }

    const eventItems = Array.isArray(events) ? events : [];

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-glass bg-glass border-glass px-4 py-5 backdrop-blur-sm"
      >
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-ink-3" />
          <span className="text-sm font-semibold text-ink">时间线事件</span>
          <span className="rounded bg-glass-subtle px-1.5 py-0.5 text-[11px] text-ink-3">
            {eventItems.length} 件
          </span>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative"
          role="list"
          aria-label="时间线事件列表"
        >
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-glass-sm" aria-hidden="true" />

          <div className="space-y-0">
            {eventItems.map((ev, i) => (
              <motion.div
                key={`${ev.time}-${i}`}
                variants={eventVariants}
                className="relative flex gap-3 pb-3 last:pb-0"
              >
                <div className="relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
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
                    <span className="ml-auto" aria-label={`情绪: ${ev.sentiment === 'positive' ? '正面' : ev.sentiment === 'negative' ? '负面' : '中性'}`}>{sentimentIcon(ev.sentiment)}</span>
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-ink">{ev.title}</div>
                  {ev.description && (
                    <div className="mt-0.5 text-[11px] leading-relaxed text-ink-3">{ev.description}</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  } catch (err) {
    console.error('TimelinePanel render error:', err);
    return <TimelineFallback />;
  }
}
