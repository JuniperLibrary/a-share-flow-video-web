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
    low: 'bg-glass border-glass',
    medium: 'bg-glass-md border-glass backdrop-blur-md',
    high: 'bg-glass-lg border-glass backdrop-blur-lg',
  };

  const glowMap = {
    default: 'border border-glass',
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
