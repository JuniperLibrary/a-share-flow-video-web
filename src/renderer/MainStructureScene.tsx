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

  const stats = React.useMemo(() => {
    if (sectorTicks.length === 0) return null;
    const rows = sectorTicks.map((s) => {
      const net = s.data.reduce((x, y) => x + y, 0);
      return {...s, net};
    });
    const inflows = rows.filter((s) => s.net > 0).sort((a, b) => b.net - a.net);
    const outflows = rows.filter((s) => s.net < 0).sort((a, b) => a.net - b.net);
    const totalInflow = inflows.reduce((sum, s) => sum + s.net, 0);
    const topInflow = inflows[0];
    const topOutflow = outflows[0];
    const concentration = topInflow && totalInflow > 0 ? topInflow.net / totalInflow : 0;
    return {inflows, outflows, topInflow, topOutflow, concentration};
  }, [sectorTicks]);

  const fadeIn = Math.min(1, frame / 25);
  const numberProgress = Math.min(1, Math.max(0, (frame - 15) / 30));
  const targetRate = top?.mainRate ?? 0;
  const displayRate = targetRate * numberProgress;

  if (!top || !stats) return null;

  const isPositive = targetRate >= 0;
  const accentColor = isPositive ? '#f87171' : '#4ade80';
  const superW = top.superNet ?? 0;
  const bigW = top.bigNet ?? 0;
  const leader = stats.topInflow ?? top;
  const leaderNet = leader.net ?? top.data.reduce((x, y) => x + y, 0);
  const riskName = stats.topOutflow?.name ?? '高位方向';
  const strengthLabel =
    stats.concentration >= 0.45 ? '主线集中' : stats.inflows.length >= 6 ? '扩散中' : '分歧明显';
  const conclusion =
    leaderNet > 0
      ? `${leader.name}是今天资金主线`
      : `${riskName}仍是主要压力`;
  const observation =
    leaderNet > 0
      ? `明天看${leader.name}能否继续放量`
      : `明天先看${riskName}能否止住流出`;

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
            fontSize: isTV ? 20 : 28,
            color: '#4a80d0',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            letterSpacing: 4,
            marginBottom: isTV ? 14 : 20,
          }}
        >
          今日主线判断
        </div>
        <div
          style={{
            fontSize: isTV ? 44 : 64,
            fontWeight: 800,
            color: '#ffffff',
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            lineHeight: 1.15,
            textAlign: 'center',
            textShadow: '0 6px 28px rgba(0,0,0,0.55)',
            marginBottom: isTV ? 18 : 26,
          }}
        >
          {conclusion}
        </div>
        <div
          style={{
            fontSize: isTV ? 78 : 116,
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
          {leader.name}主力净占比
        </div>
        <div
          style={{
            marginTop: isTV ? 20 : 30,
            display: 'flex',
            gap: isTV ? 12 : 16,
            flexDirection: isTV ? 'row' : 'column',
            width: isTV ? 980 : 820,
            maxWidth: width - 120,
          }}
        >
          {[
            {label: '强度', value: strengthLabel, color: '#facc15'},
            {label: '风险', value: `${riskName}拖累`, color: '#60a5fa'},
            {label: '观察', value: observation, color: '#34d399'},
          ].map((item, index) => (
            <div
              key={item.label}
              style={{
                opacity: Math.min(1, Math.max(0, (frame - 28 - index * 8) / 12)),
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: isTV ? 10 : 14,
                background: 'rgba(10, 20, 40, 0.62)',
                border: '1px solid rgba(80, 110, 150, 0.24)',
                borderRadius: 8,
                padding: isTV ? '12px 16px' : '18px 22px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  fontSize: isTV ? 18 : 24,
                  fontWeight: 800,
                  color: item.color,
                  fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                  letterSpacing: 2,
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: isTV ? 20 : 28,
                  color: '#dce4ec',
                  fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                  lineHeight: 1.25,
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
        {(superW !== 0 || bigW !== 0) && (
          <div
            style={{
              marginTop: isTV ? 18 : 26,
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
