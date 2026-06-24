import { Compass, RefreshCw, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BloombergHeaderProps {
  date: string;
  session: string;
  generated?: boolean;
  loading: boolean;
  onGenerate: () => void;
  onPrevDate?: () => void;
  onNextDate?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function BloombergHeader({
  date,
  session,
  generated,
  loading,
  onGenerate,
  onPrevDate,
  onNextDate,
  hasPrev,
  hasNext,
}: BloombergHeaderProps) {
  const sessionLabel = session === 'morning' ? '早盘' : '全天';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-5 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
          <Compass className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white">每日日报</h1>
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-ink-2">
              {sessionLabel}
            </span>
            {generated && (
              <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-400">
                即时生成
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {onPrevDate && (
                <button
                  type="button"
                  onClick={onPrevDate}
                  disabled={!hasPrev}
                  className={cn(
                    'rounded p-0.5 transition-colors',
                    hasPrev
                      ? 'text-ink-2 hover:bg-white/[0.06] hover:text-white'
                      : 'text-ink-3/40 cursor-not-allowed',
                  )}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              )}
              <span className="text-xs font-mono text-primary">{date}</span>
              {onNextDate && (
                <button
                  type="button"
                  onClick={onNextDate}
                  disabled={!hasNext}
                  className={cn(
                    'rounded p-0.5 transition-colors',
                    hasNext
                      ? 'text-ink-2 hover:bg-white/[0.06] hover:text-white'
                      : 'text-ink-3/40 cursor-not-allowed',
                  )}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-black/40 px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {loading ? '生成中…' : '重新生成'}
      </button>
    </div>
  );
}
