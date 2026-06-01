import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Background } from './Background.tsx';
import type { SectorTick } from './types.ts';

interface MainStructureSceneProps {
  sectorTicks: SectorTick[];
  displayDate: string;
  width: number;
  height: number;
  format: 'mobile' | 'tv';
  totalFrames: number;
}

export const MainStructureScene: React.FC<MainStructureSceneProps> = ({
  sectorTicks,
  displayDate,
  width,
  height,
  format,
  totalFrames,
}) => {
  const frame = useCurrentFrame();
  const isTV = format === 'tv';

  const top = React.useMemo(() => {
    if (sectorTicks.length === 0) return null;
    const sorted = [...sectorTicks].sort(
      (a, b) =>
        Math.abs(b.data.reduce((x, y) => x + y, 0)) -
        Math.abs(a.data.reduce((x, y) => x + y, 0)),
    );
    return sorted[0];
  }, [sectorTicks]);

  const fadeIn = Math.min(1, frame / 25);
  const numberProgress = Math.min(1, Math.max(0, (frame - 15) / 30));
  const targetRate = top?.mainRate ?? 0;
  const displayRate = targetRate * numberProgress;

  if (!top) return null;

  const isPositive = targetRate >= 0;
  const accentColor = isPositive ? '#f87171' : '#4ade80';
  const superW = top.superNet ?? 0;
  const bigW = top.bigNet ?? 0;

  return (
    <>
      <Background
        frame={frame}
        totalFrames={totalFrames}
        sentiment={isPositive ? 'mainline' : 'bearish'}
        width={width}
        height={height}
        format={format}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          opacity: fadeIn,
          padding: '0 60px',
        }}
      >
        <div
          style={{
            fontSize: isTV ? 18 : 24,
            color: '#4a80d0',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            letterSpacing: 4,
            marginBottom: isTV ? 14 : 20,
          }}
        >
          主力结构
        </div>
        <div
          style={{
            fontSize: isTV ? 22 : 30,
            color: '#aab8c8',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            marginBottom: isTV ? 4 : 6,
          }}
        >
          {top.name}
        </div>
        <div
          style={{
            fontSize: isTV ? 80 : 120,
            fontWeight: 700,
            color: accentColor,
            fontFamily: '"Helvetica Neue", Arial, sans-serif',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            textShadow: `0 0 24px ${accentColor}55, 0 2px 12px rgba(0,0,0,0.5)`,
            marginBottom: isTV ? 10 : 16,
          }}
        >
          {isPositive ? '+' : ''}
          {displayRate.toFixed(1)}%
        </div>
        <div
          style={{
            fontSize: isTV ? 14 : 18,
            color: '#667788',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            letterSpacing: 1,
          }}
        >
          主力净占比
        </div>
        {(superW !== 0 || bigW !== 0) && (
          <div
            style={{
              marginTop: isTV ? 16 : 24,
              fontSize: isTV ? 14 : 18,
              color: '#8a98aa',
              fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: isTV ? 6 : 10,
            }}
          >
            <span style={{ color: '#f87171' }}>
              超大单 {superW > 0 ? '+' : ''}
              {superW.toFixed(1)}亿
            </span>
            <span style={{ color: '#3a4557' }}>·</span>
            <span style={{ color: '#fb923c' }}>
              大单 {bigW > 0 ? '+' : ''}
              {bigW.toFixed(1)}亿
            </span>
          </div>
        )}
      </div>
    </>
  );
};
