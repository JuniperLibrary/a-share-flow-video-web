import { cn } from '@/lib/utils';
import { PERSONA, type PersonaName } from './persona-config';
import { PersonaIcon } from './persona-icon';

interface PersonaCardProps {
  name: PersonaName;
  state?: 'idle' | 'active' | 'past' | 'upcoming';
  showRole?: boolean;
  className?: string;
}

export function PersonaCard({ name, state = 'idle', showRole = true, className }: PersonaCardProps) {
  const p = PERSONA[name];
  const isActive = state === 'active';
  const isPast = state === 'past';
  return (
    <div
      className={cn(
        'group/persona relative flex flex-col items-center gap-2 px-3 py-3 rounded-xl border transition-all duration-500 min-w-[88px]',
        isActive
          ? `${p.border} ${p.bg} ${p.glow} ring-1 ${p.ring}`
          : isPast
            ? 'border-hairline bg-surface-1/60'
            : 'border-hairline bg-surface-1/30',
        'hover:border-hairline-active',
        className,
      )}
    >
      {isActive && (
        <div className="absolute -top-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-80" />
      )}
      <div
        className={cn(
          'relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500',
          isActive ? `${p.bg} ${p.text}` : 'bg-surface-2 text-ink-3',
        )}
      >
        <PersonaIcon name={p.icon} size={26} />
        {isActive && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-current animate-pulse-glow" />
        )}
      </div>
      <div className="text-center leading-tight">
        <div
          className={cn(
            'text-[11px] font-semibold tracking-wider',
            isActive ? p.text : isPast ? 'text-ink-2' : 'text-ink-3',
          )}
        >
          {p.label}
        </div>
        <div
          className={cn(
            'text-[12px] font-medium mt-0.5',
            isActive ? 'text-ink' : isPast ? 'text-ink-2' : 'text-ink-3',
          )}
        >
          {p.name}
        </div>
        {showRole && (
          <div className="text-[9px] text-ink-muted mt-0.5 max-w-[80px] mx-auto truncate">{p.role}</div>
        )}
      </div>
    </div>
  );
}

export default PersonaCard;
