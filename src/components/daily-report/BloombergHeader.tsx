import { Compass, RefreshCw, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BloombergHeaderProps {
  date: string;
  generated?: boolean;
  loading: boolean;
  onGenerate: () => void;
  onPrevDate?: () => void;
  onNextDate?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

function HeaderFallback() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-glass bg-glass-sm border-glass px-5 py-3">
      <div className="h-9 w-48 animate-pulse rounded bg-glass-subtle" />
      <div className="h-8 w-24 animate-pulse rounded bg-glass-subtle" />
    </div>
  );
}

export function BloombergHeader({
  date,
  generated,
  loading,
  onGenerate,
  onPrevDate,
  onNextDate,
  hasPrev,
  hasNext,
}: BloombergHeaderProps) {
  try {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-glass bg-glass border-glass px-5 py-3 backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
            <Compass className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-ink">每日日报</h1>
              {generated && (
                <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-400">
                  即时生成
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {onPrevDate && (
                  <motion.button
                    type="button"
                    onClick={onPrevDate}
                    disabled={!hasPrev}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      'rounded p-0.5 transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none',
                      hasPrev
                        ? 'text-ink-2 hover:bg-glass-hover hover:text-ink'
                        : 'text-ink-3/40 cursor-not-allowed',
                    )}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </motion.button>
                )}
                <span className="text-xs font-mono text-primary">{date}</span>
                {onNextDate && (
                  <motion.button
                    type="button"
                    onClick={onNextDate}
                    disabled={!hasNext}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      'rounded p-0.5 transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none',
                      hasNext
                        ? 'text-ink-2 hover:bg-glass-hover hover:text-ink'
                        : 'text-ink-3/40 cursor-not-allowed',
                    )}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-glass-strong bg-glass-md border-glass px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-200 hover:bg-glass-hover hover:text-ink disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {loading ? '生成中…' : '重新生成'}
        </motion.button>
      </motion.div>
    );
  } catch (err) {
    console.error('BloombergHeader render error:', err);
    return <HeaderFallback />;
  }
}
