import { cn } from '@/lib/utils';
import { PERSONA, PERSONA_ORDER, type PersonaName } from './persona-config';
import { PersonaCard } from './persona-card';

interface PersonaLineupProps {
  activeSpeaker: PersonaName | null;
  pastSpeakers: Set<PersonaName>;
  upcomingSpeakers: PersonaName[];
  className?: string;
}

export function PersonaLineup({
  activeSpeaker,
  pastSpeakers,
  upcomingSpeakers,
  className,
}: PersonaLineupProps) {
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
              CAST
            </span>
            <span className="text-[10px] text-ink-muted">6 名辩手</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
            <span>现在发言</span>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {PERSONA_ORDER.map((name) => {
            const state: 'idle' | 'active' | 'past' | 'upcoming' =
              activeSpeaker === name
                ? 'active'
                : pastSpeakers.has(name)
                  ? 'past'
                  : 'upcoming';
            return (
              <PersonaCard
                key={name}
                name={name}
                state={state}
                showRole
              />
            );
          })}
        </div>
        {activeSpeaker && (
          <div className="mt-3 flex items-center gap-2 text-[10px]">
            <span className="text-ink-muted">聚光:</span>
            <span className={cn('font-semibold tracking-wider', PERSONA[activeSpeaker].text)}>
              {PERSONA[activeSpeaker].name}
            </span>
            <span className="text-ink-muted">·</span>
            <span className="text-ink-3">{PERSONA[activeSpeaker].role}</span>
          </div>
        )}
        {upcomingSpeakers.length > 0 && (
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-ink-muted">
            <span>下一位:</span>
            <span className="flex items-center gap-1.5">
              {upcomingSpeakers.slice(0, 3).map((s) => (
                <span key={s} className={cn('font-medium', PERSONA[s].text)}>
                  {PERSONA[s].name}
                </span>
              ))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PersonaLineup;
