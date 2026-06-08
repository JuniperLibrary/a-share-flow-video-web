import * as React from 'react';
import { cn } from '@/lib/utils';
import { Spotlight } from './spotlight';
import type { PersonaName } from './persona-config';
import { PERSONA } from './persona-config';

interface DebateStageProps {
  activeSpeaker: PersonaName | null;
  children: React.ReactNode;
  className?: string;
}

export function DebateStage({ activeSpeaker, children, className }: DebateStageProps) {
  const color = activeSpeaker ? PERSONA[activeSpeaker].hex.primary : undefined;
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-hairline bg-surface-1/40 backdrop-blur-xl',
        className,
      )}
    >
      <Spotlight color={color} intensity="med" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default DebateStage;
