import type { PersonaIconName } from './persona-config';

export type { PersonaIconName };

interface PersonaIconProps {
  name: PersonaIconName;
  size?: number;
  color?: string;
  className?: string;
}

export function PersonaIcon({ name, size = 24, color, className }: PersonaIconProps) {
  const c = color ?? 'currentColor';
  const accent = c;
  const dim = `${c}55`;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden
      style={color ? { color } : undefined}
    >
      {name === 'bull' && (
        <>
          <rect x="12" y="68" width="16" height="20" fill={accent} rx="2" />
          <rect x="40" y="48" width="16" height="40" fill={accent} rx="2" />
          <rect x="68" y="22" width="16" height="66" fill={accent} rx="2" />
          <path d="M 8 56 L 84 14" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.55" />
          <path d="M 70 14 L 84 14 L 84 28" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === 'bear' && (
        <>
          <path
            d="M 50 10 L 82 24 L 82 56 C 82 76 66 87 50 92 C 34 87 18 76 18 56 L 18 24 Z"
            fill={accent}
            stroke={accent}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <line x1="30" y1="38" x2="70" y2="64" stroke={dim} strokeWidth="6" strokeLinecap="round" opacity="0.7" />
        </>
      )}
      {name === 'moderator' && (
        <>
          <rect x="15" y="30" width="70" height="50" rx="8" fill={accent} fillOpacity="0.3" stroke={accent} strokeWidth="2" />
          <rect x="35" y="22" width="30" height="14" rx="3" fill={accent} />
          <line x1="50" y1="36" x2="50" y2="80" stroke={accent} strokeWidth="2" />
          <circle cx="50" cy="84" r="4" fill={accent} />
        </>
      )}
      {name === 'sector' && (
        <>
          <rect x="10" y="60" width="18" height="30" fill={accent} rx="2" />
          <rect x="32" y="45" width="18" height="45" fill={accent} rx="2" />
          <rect x="54" y="30" width="18" height="60" fill={accent} rx="2" />
          <rect x="76" y="15" width="14" height="75" fill={accent} rx="2" />
          <line x1="5" y1="92" x2="95" y2="92" stroke={accent} strokeWidth="2" />
        </>
      )}
      {name === 'risk' && (
        <>
          <path
            d="M 50 8 L 92 80 L 8 80 Z"
            fill={accent}
            fillOpacity="0.5"
            stroke={accent}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="50" y1="32" x2="50" y2="60" stroke={accent} strokeWidth="5" strokeLinecap="round" />
          <circle cx="50" cy="70" r="3.5" fill={accent} />
        </>
      )}
      {name === 'synthesizer' && (
        <>
          <circle cx="50" cy="20" r="6" fill={accent} />
          <circle cx="20" cy="70" r="6" fill={accent} />
          <circle cx="80" cy="70" r="6" fill={accent} />
          <circle cx="50" cy="50" r="14" fill={accent} fillOpacity="0.5" stroke={accent} strokeWidth="2.5" />
          <line x1="50" y1="26" x2="50" y2="36" stroke={accent} strokeWidth="2" />
          <line x1="26" y1="65" x2="36" y2="56" stroke={accent} strokeWidth="2" />
          <line x1="74" y1="65" x2="64" y2="56" stroke={accent} strokeWidth="2" />
          <line x1="50" y1="64" x2="50" y2="86" stroke={accent} strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

export default PersonaIcon;
