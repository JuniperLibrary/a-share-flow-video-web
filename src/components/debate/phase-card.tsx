import { cn } from '@/lib/utils';
import { PERSONA, PHASE_LABEL, type DebatePhaseKey } from './persona-config';
import type { DebateTurn } from '@/types';
import { PersonaIcon } from './persona-icon';
import { Waveform } from './waveform';

interface PhaseCardProps {
  turn: DebateTurn;
  phase: DebatePhaseKey | null;
  isActive: boolean;
  isPlaying: boolean;
  audioDurationSec?: number;
  onTogglePlay?: () => void;
}

export function PhaseCard({
  turn,
  phase,
  isActive,
  isPlaying,
  audioDurationSec,
  onTogglePlay,
}: PhaseCardProps) {
  const p = PERSONA[turn.speaker];
  return (
    <div
      className={cn(
        'relative rounded-lg border p-3.5 transition-all duration-500',
        p.border,
        p.bg,
        isActive && `ring-1 ${p.ring} ${p.glow}`,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            'w-7 h-7 rounded-md flex items-center justify-center transition-all',
            p.bg,
            p.text,
            isActive && 'shadow-glow-primary',
          )}
        >
          <PersonaIcon name={p.icon} size={18} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={cn('text-[10px] font-bold tracking-[0.18em]', p.text)}>
              {p.label}
            </span>
            <span className="text-[10px] text-ink-3">·</span>
            <span className="text-[11px] font-medium text-ink">{p.name}</span>
            <span className="text-[10px] text-ink-muted font-mono">#{turn.index + 1}</span>
          </div>
          {phase && (
            <span className="text-[9px] uppercase tracking-widest text-ink-muted">
              {PHASE_LABEL[phase]}
            </span>
          )}
        </div>
        {turn.emotion && turn.emotion !== 'neutral' && (
          <span className="ml-auto text-[10px] italic text-ink-3 hidden sm:inline">
            · {turn.emotion}
          </span>
        )}
      </div>
      <p className="text-[14px] text-ink-2 leading-relaxed tracking-wide pl-9">
        {turn.text}
      </p>
      {turn.citations && turn.citations.length > 0 && (
        <div className="mt-2 pl-9 flex flex-wrap gap-1.5">
          {turn.citations.map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-2 border border-hairline text-ink-3"
            >
              <span className="text-ink-muted">[{c.source}]</span>
              {c.ref}
            </span>
          ))}
        </div>
      )}
      {audioDurationSec !== undefined && onTogglePlay && (
        <div className="mt-2 pl-9 flex items-center gap-2 text-[10px] text-ink-3 border-t border-hairline pt-2">
          <button
            onClick={onTogglePlay}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded transition-colors',
              isPlaying
                ? 'text-primary bg-primary-softer'
                : 'text-ink-3 hover:bg-surface-2 hover:text-primary',
            )}
          >
            {isPlaying ? (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            <span className="font-mono">{audioDurationSec.toFixed(1)}s</span>
          </button>
          {isPlaying && (
            <Waveform size={14} className={p.text} bars={6} />
          )}
        </div>
      )}
    </div>
  );
}

export default PhaseCard;
