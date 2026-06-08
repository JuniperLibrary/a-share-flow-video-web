import * as React from 'react';
import { cn } from '@/lib/utils';
import { PHASE_ORDER, PHASE_LABEL, PHASE_SUBTITLE, type DebatePhaseKey } from './persona-config';

interface StageTrackProps {
  currentPhase: DebatePhaseKey | null;
  visitedPhases: Set<DebatePhaseKey>;
  className?: string;
}

export function StageTrack({ currentPhase, visitedPhases, className }: StageTrackProps) {
  const currentIdx = currentPhase ? PHASE_ORDER.indexOf(currentPhase) : -1;
  return (
    <div
      className={cn(
        'relative rounded-2xl border border-hairline bg-surface-1/50 backdrop-blur-xl overflow-hidden',
        className,
      )}
    >
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-hairline-active to-transparent" />
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">
              SCRIPT
            </span>
            <span className="text-[10px] text-ink-muted">7 阶段</span>
          </div>
          {currentPhase && (
            <div className="flex items-center gap-1.5 text-[10px] text-ink-3">
              <span className="font-mono">
                {currentIdx + 1} / {PHASE_ORDER.length}
              </span>
            </div>
          )}
        </div>
        <div className="relative flex items-start gap-0">
          {PHASE_ORDER.map((p, i) => {
            const active = p === currentPhase;
            const past = visitedPhases.has(p) && !active;
            return (
              <React.Fragment key={p}>
                <div className="flex flex-col items-center gap-1.5 shrink-0 min-w-0">
                  <div
                    className={cn(
                      'relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500',
                      active
                        ? 'bg-primary-soft text-primary ring-1 ring-primary/40 shadow-glow-primary scale-110'
                        : past
                          ? 'bg-outflow-muted text-outflow ring-1 ring-outflow/30'
                          : 'bg-surface-2 text-ink-muted',
                    )}
                  >
                    {past ? (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className="font-mono">{i + 1}</span>
                    )}
                    {active && (
                      <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                    )}
                  </div>
                  <div
                    className={cn(
                      'text-[10px] font-medium leading-tight transition-colors duration-300',
                      active ? 'text-primary' : past ? 'text-ink-2' : 'text-ink-3/60',
                    )}
                  >
                    {PHASE_LABEL[p]}
                  </div>
                </div>
                {i < PHASE_ORDER.length - 1 && (
                  <div className="flex-1 flex items-center pt-3.5 px-1">
                    <div
                      className={cn(
                        'h-px flex-1 transition-colors duration-500',
                        i < currentIdx
                          ? 'bg-outflow/40'
                          : i === currentIdx
                            ? 'bg-gradient-to-r from-outflow/40 via-primary/30 to-hairline'
                            : 'bg-hairline',
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        {currentPhase && (
          <div className="mt-3 text-[11px] text-ink-2 italic">
            <span className="text-primary font-semibold not-italic mr-1.5">
              {PHASE_LABEL[currentPhase]}
            </span>
            · {PHASE_SUBTITLE[currentPhase]}
          </div>
        )}
      </div>
    </div>
  );
}

export default StageTrack;
