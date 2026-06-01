import React, { useMemo } from 'react';
import type { SectorTick } from './types.ts';

interface TickChartProps {
  sectorTicks: SectorTick[];
  frame: number;
  totalFrames: number;
  activeEventSector?: string | null;
  width?: number;
  height?: number;
  format?: 'mobile' | 'tv';
  sentiment?: 'bullish' | 'bearish' | 'neutral' | 'mainline';
  session?: 'morning' | 'full';
  xLim?: [number, number];
}

const PALETTE = [
  '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9',
  '#2bd6d6', '#4dabf7', '#748ffc', '#9775fa', '#e599f7',
  '#f783ac', '#ff8787', '#ffb068', '#ffe066', '#8ce99a',
  '#63e6be', '#3bc9db', '#66c0ff', '#91a7ff', '#b197fc',
  '#d0bfff',
];

/** Smooth easing for entrance animations */
function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/** Convert "HH:MM" to x-axis position (0-300), matching the XTICK positions.
 *  XTICKS model: morning 0→120 (09:30→11:30), afternoon 180→300 (13:00→15:00).
 *  The 90-min lunch break is compressed into 60 units of chart space.
 */
function timeToTradingMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  let val = h * 60 + m - (9 * 60 + 30);
  if (val < 0) val = 0;
  if (h >= 13) val -= 30; // compress 90 min lunch → 60 chart units
  return val;
}

/** Build SVG path d-string for the curve points */
function buildCurvePath(
  cumValues: number[],
  tradingMinutes: number[],
  xScale: (v: number) => number,
  yScale: (v: number) => number,
): string {
  if (cumValues.length === 0) return '';
  let d = '';
  for (let i = 0; i < cumValues.length; i++) {
    const px = xScale(tradingMinutes[i]);
    const py = yScale(cumValues[i]);
    d += (i === 0 ? 'M' : 'L') + ` ${px} ${py}`;
  }
  return d;
}

/** Build area fill path: curve → down to yZero → back to start */
function buildAreaPath(
  curvePathD: string,
  cumValues: number[],
  tradingMinutes: number[],
  xScale: (v: number) => number,
  yScale: (v: number) => number,
  yZero: number,
): string {
  if (cumValues.length < 2) return '';
  let d = curvePathD;
  const lastIdx = cumValues.length - 1;
  d += ` L ${xScale(tradingMinutes[lastIdx])} ${yZero}`;
  d += ` L ${xScale(tradingMinutes[0])} ${yZero} Z`;
  return d;
}

export const TickChart: React.FC<TickChartProps> = ({
  sectorTicks,
  frame,
  totalFrames,
  activeEventSector,
  width = 1080,
  height = 1920,
  format = 'mobile',
  sentiment = 'neutral',
  session = 'full',
  xLim: propXLim,
}) => {
  const isTV = format === 'tv';
  const xMax = propXLim ? propXLim[1] : 330;
  const isMorning = session === 'morning';

  const chartLeft = isTV ? 80 : 50;
  const chartRight = isTV ? width * 0.72 : 580;
  const chartTop = isTV ? 150 : 180;
  const chartBottom = isTV ? height * 0.86 : height * 0.83;

  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  const coloredTicks = useMemo(() => {
    return sectorTicks.map((s, i) => ({
      ...s,
      color: PALETTE[i % PALETTE.length],
    }));
  }, [sectorTicks]);

  const cumulativeData = useMemo(() => {
    return coloredTicks.map(s => {
      const cum: number[] = [];
      let sum = 0;
      for (const v of s.data) {
        sum += v;
        cum.push(sum);
      }
      return { ...s, cum };
    });
  }, [coloredTicks]);

  const sortedByAbs = useMemo(() => {
    return [...cumulativeData].sort((a, b) => {
      const lastA = a.cum.length > 0 ? Math.abs(a.cum[a.cum.length - 1]) : 0;
      const lastB = b.cum.length > 0 ? Math.abs(b.cum[b.cum.length - 1]) : 0;
      return lastB - lastA;
    });
  }, [cumulativeData]);

  const yBounds = useMemo(() => {
    if (cumulativeData.length === 0) return { min: -100, max: 300 };
    let minVal = 0, maxVal = 0;
    for (const s of cumulativeData) {
      for (const v of s.cum) {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }
    }
    const padding = Math.max((maxVal - minVal) * 0.15, 30);
    return {
      max: Math.ceil((maxVal + padding) / 10) * 10,
      min: Math.floor((minVal - padding) / 10) * 10,
    };
  }, [cumulativeData]);

  const xScale = (v: number) => chartLeft + (v / xMax) * chartW;
  const yScale = (v: number) => {
    const range = yBounds.max - yBounds.min;
    if (range === 0) return (chartTop + chartBottom) / 2;
    const normalized = (v - yBounds.min) / range;
    return chartBottom - normalized * chartH;
  };

  const progress = frame / totalFrames;
  const numPoints = cumulativeData.length > 0 ? cumulativeData[0].cum.length : 1;
  const currentIdx = Math.min(Math.floor(progress * numPoints), numPoints - 1);

  const yTickStep = useMemo(() => {
    const dataRange = yBounds.max - yBounds.min;
    if (dataRange <= 100) return 10;
    if (dataRange <= 300) return 30;
    if (dataRange <= 600) return 30;
    return 50;
  }, [yBounds]);

  const yTicks: number[] = [];
  const startTick = Math.ceil(yBounds.min / yTickStep) * yTickStep;
  for (let v = startTick; v <= yBounds.max; v += yTickStep) {
    yTicks.push(Math.round(v));
  }

  const yZero = yScale(0);

  // ─── Entrance animation: global curve reveal ───
  // Curves start appearing from frame 10, fully visible by frame 120
  const CURVE_REVEAL_START = 10;
  const CURVE_REVEAL_END = 120;
  const globalReveal = frame < CURVE_REVEAL_START
    ? 0
    : frame >= CURVE_REVEAL_END
      ? 1
      : easeOutQuad((frame - CURVE_REVEAL_START) / (CURVE_REVEAL_END - CURVE_REVEAL_START));

  const labelPositions = React.useMemo(() => {
    const positions = new Map<string, { rawY: number; adjY: number }>();
    if (cumulativeData.length === 0) return positions;

    // Sort sectors by endpoint Y position (top-to-bottom order matching the chart)
    const sorted = cumulativeData
      .map((s) => {
        const yVal = s.cum.length > 0 ? s.cum[currentIdx] : 0;
        return { name: s.name, rawY: yScale(yVal) };
      })
      .sort((a, b) => a.rawY - b.rawY);

    // Evenly distribute all labels across chart height
    const padding = 15;
    const topBound = chartTop + padding;
    const bottomBound = chartBottom - padding;
    const step = (bottomBound - topBound) / Math.max(sorted.length - 1, 1);

    sorted.forEach((item, i) => {
      const adjY = topBound + i * step;
      positions.set(item.name, { rawY: item.rawY, adjY });
    });

    return positions;
  }, [cumulativeData, currentIdx, yScale, chartTop, chartBottom]);

  // ─── Flow particles: pre-compute particle positions along each curve ───
  // Each top-12 sector gets 2-3 particles that travel along the curve
  const flowParticles = useMemo(() => {
    const particles: Array<{
      sectorName: string;
      color: string;
      cx: number;
      cy: number;
      r: number;
      opacity: number;
    }> = [];

    for (const sector of cumulativeData) {
      const rankIdx = sortedByAbs.findIndex(s => s.name === sector.name);
      if (rankIdx >= 12 || sector.cum.length < 3) continue;

      const numParticles = rankIdx < 5 ? 3 : 2;
      const particleR = isTV ? (rankIdx < 5 ? 3 : 2) : (rankIdx < 5 ? 4.5 : 3);

      for (let p = 0; p < numParticles; p++) {
        // Each particle cycles through the visible portion of the curve
        const cycleLen = 90; // frames per cycle
        const offset = (p * cycleLen) / numParticles;
        const cyclePos = ((frame - offset) % cycleLen + cycleLen) % cycleLen;
        const cycleProgress = cyclePos / cycleLen;

        // Map cycle progress to a position along the visible curve
        const visibleLen = currentIdx + 1;
        if (visibleLen < 2) continue;

        // Particle travels from start to current endpoint
        const idx = Math.min(Math.floor(cycleProgress * (visibleLen - 1)), visibleLen - 1);
        const xMinutes = sector.times.length > 0 ? timeToTradingMinutes(sector.times[idx]) : 0;
        const cx = xScale(xMinutes);
        const cy = yScale(sector.cum[idx]);

        // Fade in/out at cycle boundaries
        const edgeFade = Math.sin(cycleProgress * Math.PI);

        particles.push({
          sectorName: sector.name,
          color: sector.color,
          cx,
          cy,
          r: particleR,
          opacity: edgeFade * 0.7 * (rankIdx < 5 ? 0.9 : 0.6),
        });
      }
    }

    return particles;
  }, [cumulativeData, sortedByAbs, currentIdx, frame, xMax, xScale, yScale, isTV]);

  const curvesJSX = cumulativeData.map((sector) => {
    const rankIdx = sortedByAbs.findIndex(s => s.name === sector.name);
    const isActiveEvent = activeEventSector === sector.name;

    const lineWidth = isTV ? 1.8 : 3.0;
    const glowWidth = isTV ? 6 : 10;
    const glowOpacity = 0.1;
    const mainOpacity = 0.8;
    const pointR = isTV ? 3.5 : 5.5;
    const pointOpacity = 0.75;

    const eventPulse = isActiveEvent ? Math.sin(frame * 0.4) * 0.4 + 0.8 : 1;

    // Stagger entrance: top-ranked sectors appear first
    const staggerDelay = rankIdx * 4; // 4 frames per rank
    const sectorRevealStart = CURVE_REVEAL_START + staggerDelay;
    const sectorRevealEnd = CURVE_REVEAL_END + staggerDelay;
    const sectorReveal = frame < sectorRevealStart
      ? 0
      : frame >= sectorRevealEnd
        ? 1
        : easeOutQuad((frame - sectorRevealStart) / (sectorRevealEnd - sectorRevealStart));

    const effectiveOpacity = sectorReveal * mainOpacity * eventPulse;

    const visibleCum = sector.cum.slice(0, currentIdx + 1);
    const visibleTimes = sector.times.slice(0, currentIdx + 1);
    const visibleMinutes = visibleTimes.map(timeToTradingMinutes);

    const pathD = buildCurvePath(visibleCum, visibleMinutes, xScale, yScale);
    const areaD = buildAreaPath(pathD, visibleCum, visibleMinutes, xScale, yScale, yZero);

    // Correct endpoint position (use actual trading minute, not even distribution)
    const endX = visibleCum.length > 0
      ? xScale(visibleMinutes[visibleMinutes.length - 1])
      : 0;
    const endY = visibleCum.length > 0 ? yScale(visibleCum[visibleCum.length - 1]) : 0;

    const showLabel = pointR > 0;
    const showValueLabel = pointR > 0;
    const labelPos = labelPositions.get(sector.name);
    const labelY = labelPos ? labelPos.adjY : endY;

    // Area fill color: green for positive, red for negative
    const lastVal = visibleCum.length > 0 ? visibleCum[visibleCum.length - 1] : 0;
    const areaColor = lastVal >= 0 ? '#4ade80' : '#f87171';
    const areaOpacity = sectorReveal * 0.08 * eventPulse;

    // Pulsing endpoint glow
    const pulsePhase = Math.sin(frame * 0.15 + rankIdx) * 0.3 + 0.7;
    const glowR = pointR * (2.5 + pulsePhase * 1.5);
    const glowOp = pointOpacity * 0.12 * pulsePhase * eventPulse * sectorReveal;

    return (
      <g key={sector.name}>
        <g opacity={sectorReveal}>
          {/* Area fill under curve */}
          {areaD && visibleCum.length > 2 && (
            <path d={areaD} fill={areaColor} opacity={areaOpacity} />
          )}

          {/* Outer glow */}
          {glowWidth > 0 && (
            <path d={pathD} fill="none" stroke={sector.color} strokeWidth={glowWidth * eventPulse} opacity={glowOpacity * eventPulse * sectorReveal} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'blur(8px)' }} />
          )}

          {/* Thick background line */}
          <path d={pathD} fill="none" stroke={sector.color} strokeWidth={lineWidth * 1.2} opacity={mainOpacity * 0.15 * eventPulse * sectorReveal} strokeLinecap="round" strokeLinejoin="round" />

          {/* Main line */}
          <path d={pathD} fill="none" stroke={sector.color} strokeWidth={lineWidth} opacity={effectiveOpacity} strokeLinecap="round" strokeLinejoin="round" />

          {/* Event highlight */}
          {isActiveEvent && (
            <path d={pathD} fill="none" stroke="#ffffff" strokeWidth={lineWidth * 0.4} opacity={0.25 * eventPulse * sectorReveal} strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Endpoint glow + dot */}
          {currentIdx > 1 && pointR > 0 && (
            <>
              <circle cx={endX} cy={endY} r={glowR} fill={sector.color} opacity={glowOp} style={{ filter: 'blur(4px)' }} />
              <circle cx={endX} cy={endY} r={pointR} fill={sector.color} stroke="#ffffff" strokeWidth={1} opacity={pointOpacity * eventPulse * sectorReveal} />
            </>
          )}
        </g>

        {showLabel && (
          <g>
            {Math.abs(labelY - endY) > 2 && (
              <line x1={endX + pointR + 2} y1={endY} x2={endX + pointR + 8} y2={labelY} stroke={sector.color} strokeWidth={1} opacity={0.4} />
            )}
            <line x1={endX + pointR + 8} y1={labelY} x2={endX + pointR + 16} y2={labelY} stroke={sector.color} strokeWidth={1} opacity={0.4} />
            <text x={endX + pointR + 19} y={labelY + 1} fill={sector.color} fontSize={isTV ? 16 : 22} fontWeight={500} textAnchor="start" dominantBaseline="middle" style={{ textShadow: `0 0 4px ${sector.color}33`, fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif' }}>
              {sector.name}
            </text>
            {(sector.superNet !== undefined || sector.bigNet !== undefined) &&
              (Math.abs(sector.superNet ?? 0) > 0 || Math.abs(sector.bigNet ?? 0) > 0) && (
                <g transform={`translate(${endX + pointR + 19}, ${labelY + 12})`}>
                  {(() => {
                    const superW = Math.abs(sector.superNet ?? 0);
                    const bigW = Math.abs(sector.bigNet ?? 0);
                    const total = superW + bigW;
                    if (total === 0) return null;
                    const BAR_W = isTV ? 36 : 48;
                    const superPct = superW / total;
                    return (
                      <>
                        <rect x={0} y={0} width={BAR_W} height={3} fill="rgba(74,144,217,0.12)" rx={1.5} />
                        <rect x={0} y={0} width={BAR_W * superPct} height={3} fill="#f87171" rx={1.5} />
                        <rect x={BAR_W * superPct} y={0} width={BAR_W * (1 - superPct)} height={3} fill="#fb923c" rx={1.5} />
                      </>
                    );
                  })()}
                </g>
              )}
          </g>
        )}

        {showValueLabel && (
          <text x={endX + pointR + 120} y={labelY + 1} fill={visibleCum[currentIdx] >= 0 ? '#f87171' : '#4ade80'} fontSize={isTV ? 16 : 22} fontWeight={500} textAnchor="start" dominantBaseline="middle" style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
            {visibleCum[currentIdx] >= 0 ? '+' : ''}{visibleCum[currentIdx].toFixed(1)}
          </text>
        )}
      </g>
    );
  });

  const XTICKS = isMorning
    ? [{ pos: 0, label: '09:30' }, { pos: 30, label: '10:00' }, { pos: 60, label: '10:30' }, { pos: 90, label: '11:00' }, { pos: 120, label: '11:30' }]
    : [{ pos: 0, label: '09:30' }, { pos: 60, label: '10:30' }, { pos: 120, label: '11:30' }, { pos: 180, label: '13:00' }, { pos: 240, label: '14:00' }, { pos: 300, label: '15:00' }];

  // Zero line pulse
  const zeroPulse = Math.sin(frame * 0.08) * 0.15 + 0.7;

  return (
    <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, zIndex: 5, pointerEvents: 'none', overflow: 'visible' }}>
      {/* Grid lines */}
      {XTICKS.map((t, i) => (
        <line key={`xgrid${i}`} x1={xScale(t.pos)} y1={chartTop} x2={xScale(t.pos)} y2={chartBottom} stroke="#1e2d45" strokeWidth={0.8} opacity={0.5} />
      ))}
      {yTicks.map((v) => (
        <line key={`ygrid${v}`} x1={chartLeft} y1={yScale(v)} x2={chartRight} y2={yScale(v)} stroke="#1e2d45" strokeWidth={0.8} opacity={0.6} />
      ))}

      {/* Zero line with glow */}
      {yZero >= chartTop && yZero <= chartBottom && (
        <>
          <line x1={chartLeft} y1={yZero} x2={chartRight} y2={yZero} stroke="#3a5570" strokeWidth={4 * zeroPulse} opacity={0.08 * zeroPulse} style={{ filter: 'blur(3px)' }} />
          <line x1={chartLeft} y1={yZero} x2={chartRight} y2={yZero} stroke="#3a5570" strokeWidth={1.5} opacity={0.7 * zeroPulse} strokeDasharray="6 4" />
          <text x={chartRight + 8} y={yZero + 4} fill="#6b7280" fontSize={isTV ? 12 : 16} fontWeight={600} textAnchor="start" fontFamily='"Helvetica Neue", Arial, sans-serif'>0</text>
        </>
      )}

      {/* X-axis labels */}
      {XTICKS.map((t, i) => (
        <text key={`xlabel${i}`} x={xScale(t.pos)} y={chartBottom + 22} fill="#5a6577" fontSize={isTV ? 14 : 20} fontWeight={500} textAnchor="middle" fontFamily='"Helvetica Neue", Arial, sans-serif'>{t.label}</text>
      ))}

      {/* Y-axis labels */}
      {yTicks.map((v) => {
        const y = yScale(v);
        if (y < chartTop || y > chartBottom) return null;
        return (
          <text key={`ylabel${v}`} x={chartLeft - 8} y={y + 4} fill={v === 0 ? '#6b7280' : '#4a5568'} fontSize={isTV ? 13 : 18} fontWeight={v === 0 ? 600 : 400} textAnchor="end" fontFamily='"Helvetica Neue", Arial, sans-serif'>{v >= 0 ? `+${v}` : `${v}`}</text>
        );
      })}

      {/* Chart title */}
      <text x={chartLeft} y={chartTop - 12} fill="#6b7280" fontSize={isTV ? 14 : 15} fontWeight={500} textAnchor="start" fontFamily='"Helvetica Neue", Arial, sans-serif'>主力资金净流入（亿）</text>

      {/* Curves with area fills */}
      {curvesJSX}

      {/* Flow particles */}
      {flowParticles.map((p, i) => (
        <circle key={`flow-${p.sectorName}-${i}`} cx={p.cx} cy={p.cy} r={p.r} fill={p.color} opacity={p.opacity} style={{ filter: 'blur(1px)' }} />
      ))}

      {/* Progress line */}
      {cumulativeData.length > 0 && cumulativeData[0].times.length > 0 && currentIdx >= 0 && (
        <line x1={xScale(timeToTradingMinutes(cumulativeData[0].times[currentIdx]))} y1={chartTop - 8} x2={xScale(timeToTradingMinutes(cumulativeData[0].times[currentIdx]))} y2={chartBottom + 8} stroke="#5a90d0" strokeWidth={1.2} opacity={0.6} strokeDasharray="4 4" />
      )}
    </svg>
  );
};
