import { cn } from '@/lib/utils';

interface SpotlightProps {
  color?: string;
  intensity?: 'low' | 'med' | 'high';
  className?: string;
}

export function Spotlight({ color, intensity = 'med', className }: SpotlightProps) {
  const opacityMap = { low: 0.06, med: 0.1, high: 0.15 };
  const blurMap = { low: 80, med: 120, high: 160 };
  const op = opacityMap[intensity];
  const blur = blurMap[intensity];
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {color ? (
        <>
          <div
            className="absolute left-1/2 top-[20%] -translate-x-1/2 rounded-full"
            style={{
              width: '70%',
              height: '70%',
              background: `radial-gradient(circle, ${color}${Math.round(op * 255).toString(16).padStart(2, '0')} 0%, transparent 60%)`,
              filter: `blur(${blur}px)`,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: '50%',
              background: `linear-gradient(180deg, transparent 0%, ${color}0a 100%)`,
            }}
          />
        </>
      ) : (
        <div
          className="absolute left-1/2 top-[30%] -translate-x-1/2 rounded-full bg-primary"
          style={{
            width: '60%',
            height: '60%',
            opacity: op,
            filter: `blur(${blur}px)`,
          }}
        />
      )}
    </div>
  );
}

export default Spotlight;
