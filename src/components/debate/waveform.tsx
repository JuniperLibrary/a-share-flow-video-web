import { cn } from '@/lib/utils';

interface WaveformProps {
  size?: number;
  bars?: number;
  className?: string;
  color?: string;
}

export function Waveform({ size = 16, bars = 8, className, color }: WaveformProps) {
  const barW = 2;
  const gap = 1.5;
  const totalW = bars * (barW + gap);
  return (
    <span
      className={cn('inline-flex items-center', className)}
      style={{ width: totalW, height: size, color: color ?? 'currentColor' }}
      aria-hidden
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="inline-block bg-current rounded-sm wave-bar"
          style={{
            width: barW,
            height: '40%',
            marginRight: i < bars - 1 ? gap : 0,
            animation: `waveform 0.9s ease-in-out ${i * 0.08}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes waveform {
          0%, 100% { height: 25%; }
          50% { height: 95%; }
        }
        .wave-bar:nth-child(odd) { animation-delay: 0.04s; }
      `}</style>
    </span>
  );
}

export default Waveform;
