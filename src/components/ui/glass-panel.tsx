import * as React from 'react';
import { cn } from '@/lib/utils';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow-primary' | 'glow-danger' | 'glow-success';
  density?: 'low' | 'medium' | 'high';
}

export function GlassPanel({
  className,
  variant = 'default',
  density = 'medium',
  children,
  ...props
}: GlassPanelProps) {
  const densityMap = {
    low: 'bg-black/30 backdrop-blur-sm',
    medium: 'bg-black/40 backdrop-blur-md',
    high: 'bg-black/50 backdrop-blur-lg',
  };

  const glowMap = {
    default: 'border border-white/[0.06]',
    'glow-primary': 'border border-primary/20 shadow-glow-primary',
    'glow-danger': 'border border-inflow/20 shadow-glow-danger',
    'glow-success': 'border border-outflow/20 shadow-glow-success',
  };

  return (
    <div
      className={cn(
        'rounded-xl',
        densityMap[density],
        glowMap[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
