import React, { useMemo } from 'react';
import type { SectorTick } from './types.ts';
import { getVideoLayout } from './layout.ts';

interface TickChartProps {
  sectorTicks: SectorTick[];
  times?: string[];
  frame: number;
  totalFrames: number;
  activeEventSector?: string | null;
  highlightSector?: string;
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

/** Convert "HH:MM" to x-axis position (0-240), matching the XTICK positions.
 *  XTICKS model: morning 0→120 (09:30→11:30), afternoon 120→240 (13:00→15:00).
 *  The 90-min lunch break is compressed into 0 units of chart space (merged).
 */
function timeToTradingMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  let val = h * 60 + m - (9 * 60 + 30);
  if (val < 0) val = 0;
  if (h >= 13) val -= 90; // compress 90 min lunch → 0 chart units (merged)
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

interface InflectionMarker {
  sectorName: string;
  color: string;
  index: number;
  time: string;
  value: number;
  delta: number;
  label: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 全部曲线标签：按终点 Y 排序后均匀分布，保证垂直方向绝不重叠。 */
function resolveAllLabelPositions(
  items: Array<{ name: string; rawY: number }>,
  topBound: number,
  bottomBound: number,
): Map<string, { rawY: number; adjY: number }> {
  const positions = new Map<string, { rawY: number; adjY: number }>();
  if (items.length === 0) return positions;

  const sorted = [...items].sort((a, b) => a.rawY - b.rawY);
  const span = bottomBound - topBound;
  const step = span / Math.max(sorted.length - 1, 1);

  sorted.forEach((item, i) => {
    positions.set(item.name, { rawY: item.rawY, adjY: topBound + i * step });
  });
  return positions;
}

function buildInflectionLabel(name: string, delta: number): string {
  if (delta >= 0) {
    return `${name}资金加速`;
  }
  return `${name}资金转弱`;
}

export const TickChart: React.FC<TickChartProps> = ({
  sectorTicks,
  times,
  frame,
  totalFrames,
  activeEventSector,
  highlightSector,
  width = 1080,
  height = 1920,
  format = 'mobile',
  sentiment = 'neutral',
  session = 'full',
  xLim: propXLim,
}) => {
  const isTV = format === 'tv';
  const configuredXMin = propXLim ? propXLim[0] : 0;
  const configuredXMax = propXLim ? propXLim[1] : (session === 'morning' ? 120 : 240);
  const isMorning = session === 'morning';

  const layout = getVideoLayout(width, height, format);
  const chartLeft = layout.chartLeft;
  const chartRight = layout.chartRight;
  const chartTop = layout.chartTop;
  const chartBottom = layout.chartBottom;
  const labelMaxX = layout.labelMaxX;

  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  const sharedTimes = useMemo(() => {
    if (times && times.length > 0) return times;
    return sectorTicks[0]?.times ?? [];
  }, [times, sectorTicks]);

  const coloredTicks = useMemo(() => {
    return sectorTicks.map((s, i) => ({
      ...s,
      color: PALETTE[i % PALETTE.length],
      times: (s.times && s.times.length > 0) ? s.times : sharedTimes,
    }));
  }, [sectorTicks, sharedTimes]);

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

  const dataXBounds = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const sector of cumulativeData) {
      for (const time of sector.times) {
        const minute = timeToTradingMinutes(time);
        if (minute < min) min = minute;
        if (minute > max) max = minute;
      }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return {min: configuredXMin, max: configuredXMax};
    }
    const minSpan = (configuredXMax - configuredXMin) * 0.5;
    const paddedMax = Math.min(configuredXMax, Math.max(max, min + minSpan));
    return {
      min: Math.max(configuredXMin, min),
      max: paddedMax,
    };
  }, [cumulativeData, configuredXMin, configuredXMax]);

  const sortedByAbs = useMemo(() => {
    return [...cumulativeData].sort((a, b) => {
      const lastA = a.cum.length > 0 ? Math.abs(a.cum[a.cum.length - 1]) : 0;
      const lastB = b.cum.length > 0 ? Math.abs(b.cum[b.cum.length - 1]) : 0;
      return lastB - lastA;
    });
  }, [cumulativeData]);

  const progress = frame / totalFrames;
  const numPoints = cumulativeData.length > 0 ? cumulativeData[0].cum.length : 1;
  const currentIdx = Math.min(Math.floor(progress * numPoints), numPoints - 1);

  const inflectionMarkers = useMemo<InflectionMarker[]>(() => {
    const topSectors = sortedByAbs.slice(0, isTV ? 4 : 3);
    const markers: InflectionMarker[] = [];
    const minGap = Math.max(2, Math.floor(numPoints * 0.1));

    for (const sector of topSectors) {
      if (sector.data.length < 4 || sector.cum.length < 4) continue;

      let bestIdx = -1;
      let bestDelta = 0;
      for (let i = 1; i < sector.data.length; i++) {
        const delta = sector.data[i];
        if (i < minGap || i > sector.data.length - minGap) continue;
        if (Math.abs(delta) > Math.abs(bestDelta)) {
          bestDelta = delta;
          bestIdx = i;
        }
      }

      if (bestIdx < 0 || Math.abs(bestDelta) < 0.5) continue;

      markers.push({
        sectorName: sector.name,
        color: sector.color,
        index: bestIdx,
        time: sector.times[bestIdx] ?? '',
        value: sector.cum[bestIdx] ?? 0,
        delta: bestDelta,
        label: buildInflectionLabel(sector.name, bestDelta),
      });
    }

    return markers
      .sort((a, b) => a.index - b.index)
      .slice(0, isTV ? 4 : 3);
  }, [sortedByAbs, isTV, numPoints]);

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

  const xScale = (v: number) => {
    const range = dataXBounds.max - dataXBounds.min || 1;
    const normalized = (v - dataXBounds.min) / range;
    return chartLeft + Math.max(0, Math.min(1, normalized)) * chartW;
  };
  const yScale = (v: number) => {
    const range = yBounds.max - yBounds.min;
    if (range === 0) return (chartTop + chartBottom) / 2;
    const normalized = (v - yBounds.min) / range;
    return chartBottom - normalized * chartH;
  };

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

  const inflectionMarkersJSX = inflectionMarkers.map((marker, i) => {
    if (marker.index > currentIdx) return null;

    const age = currentIdx - marker.index;
    const fadeIn = Math.min(1, age / 2);
    const fadeOut = Math.min(1, Math.max(0, (numPoints * 0.28 - age) / Math.max(1, numPoints * 0.08)));
    const opacity = Math.max(0, Math.min(fadeIn, fadeOut));
    if (opacity <= 0) return null;

    const x = xScale(timeToTradingMinutes(marker.time));
    const y = yScale(marker.value);
    const boxW = isTV ? 152 : 180;
    const boxH = isTV ? 42 : 52;
    const offsetY = (i % 2 === 0 ? -1 : 1) * (isTV ? 46 : 56);
    const boxX = clamp(x + (isTV ? 12 : 10), chartLeft + 6, Math.min(chartRight - boxW - 6, labelMaxX - boxW - 4));
    const boxY = clamp(y + offsetY, chartTop + 6, chartBottom - boxH - 6);
    const isPositive = marker.delta >= 0;
    const valueText = `${isPositive ? '+' : ''}${marker.delta.toFixed(1)}亿`;

    return (
      <g key={`inflection-${marker.sectorName}`} opacity={opacity}>
        <line
          x1={x}
          y1={y}
          x2={boxX}
          y2={boxY + boxH / 2}
          stroke={marker.color}
          strokeWidth={1}
          opacity={0.45}
        />
        <circle
          cx={x}
          cy={y}
          r={isTV ? 5 : 7}
          fill={marker.color}
          stroke="#ffffff"
          strokeWidth={1.2}
          opacity={0.95}
        />
        <circle
          cx={x}
          cy={y}
          r={isTV ? 13 : 18}
          fill={marker.color}
          opacity={0.14 + Math.sin(frame * 0.22 + i) * 0.04}
          style={{ filter: 'blur(3px)' }}
        />
        <rect
          x={boxX}
          y={boxY}
          width={boxW}
          height={boxH}
          rx={7}
          fill="rgba(8, 18, 34, 0.88)"
          stroke={marker.color}
          strokeWidth={1}
          opacity={0.96}
        />
        <text
          x={boxX + (isTV ? 10 : 14)}
          y={boxY + (isTV ? 16 : 22)}
          fill="#dce4ec"
          fontSize={isTV ? 14 : 20}
          fontWeight={700}
          textAnchor="start"
          dominantBaseline="middle"
          style={{ fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif' }}
        >
          {marker.label}
        </text>
        <text
          x={boxX + (isTV ? 10 : 14)}
          y={boxY + (isTV ? 31 : 43)}
          fill={isPositive ? '#f87171' : '#4ade80'}
          fontSize={isTV ? 13 : 18}
          fontWeight={700}
          textAnchor="start"
          dominantBaseline="middle"
          style={{ fontFamily: '"Helvetica Neue", "PingFang SC", sans-serif', fontVariantNumeric: 'tabular-nums' }}
        >
          {marker.time}  单笔{valueText}
        </text>
      </g>
    );
  });

  // ─── Entrance animation: global curve reveal ───
  // Curves start appearing from frame 10, fully visible by frame 120
  const CURVE_REVEAL_START = 10;
  const CURVE_REVEAL_END = 120;
  const globalReveal = frame < CURVE_REVEAL_START
    ? 0
    : frame >= CURVE_REVEAL_END
      ? 1
      : easeOutQuad((frame - CURVE_REVEAL_START) / (CURVE_REVEAL_END - CURVE_REVEAL_START));

  const labelCount = cumulativeData.length;
  const labelFontSize = isTV
    ? (labelCount > 20 ? 11 : labelCount > 14 ? 12 : 14)
    : (labelCount > 20 ? 13 : labelCount > 14 ? 14 : 16);

  const labelPositions = React.useMemo(() => {
    if (cumulativeData.length === 0) return new Map<string, { rawY: number; adjY: number }>();

    const padding = 16;
    const topBound = chartTop + padding;
    const bottomBound = chartBottom - padding;

    const labelCandidates = cumulativeData.map((s) => {
      const yVal = s.cum.length > 0 ? s.cum[currentIdx] : 0;
      return { name: s.name, rawY: yScale(yVal) };
    });

    return resolveAllLabelPositions(labelCandidates, topBound, bottomBound);
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
  }, [cumulativeData, sortedByAbs, currentIdx, frame, xScale, yScale, isTV]);

  const curvesJSX = cumulativeData.map((sector) => {
    const rankIdx = sortedByAbs.findIndex(s => s.name === sector.name);
    const isActiveEvent = activeEventSector === sector.name;
    const isHighlighted = highlightSector === sector.name;
    const isMainlineFocus = isHighlighted && sentiment === 'mainline';

    const lineWidth = isHighlighted ? (isTV ? 2.8 : 4.6) : (isTV ? 1.8 : 3.0);
    const glowWidth = isHighlighted ? (isTV ? 10 : 16) : (isTV ? 6 : 10);
    const glowOpacity = isHighlighted ? 0.18 : 0.1;
    const mainOpacity = isHighlighted ? 0.96 : 0.8;
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
    const labelPos = labelPositions.get(sector.name);
    const labelY = labelPos ? labelPos.adjY : endY;

    // 标签统一放在图表与排行榜之间的固定列，右对齐，避免各曲线 X 不同导致重叠
    const labelColumnX = labelMaxX - 4;
    const leaderEndX = labelColumnX - 6;
    const textAnchor = 'end' as const;
    const lastVal = visibleCum.length > 0 ? visibleCum[visibleCum.length - 1] : 0;
    const valueText = `${lastVal >= 0 ? '+' : ''}${lastVal.toFixed(1)}`;
    const showStructureBar = labelCount <= 10;
    const areaColor = lastVal >= 0 ? '#4ade80' : '#f87171';
    const areaOpacity = sectorReveal * (isHighlighted ? 0.14 : 0.08) * eventPulse;

    // Pulsing endpoint glow
    const pulsePhase = Math.sin(frame * 0.15 + rankIdx) * 0.3 + 0.7;
    const glowR = pointR * (isHighlighted ? 3.6 : 2.5 + pulsePhase * 1.5);
    const glowOp = pointOpacity * (isHighlighted ? 0.22 : 0.12) * pulsePhase * eventPulse * sectorReveal;
    const accentColor = isMainlineFocus ? '#fbbf24' : sector.color;

    return (
      <g key={sector.name}>
        <g opacity={sectorReveal}>
          {/* Area fill under curve */}
          {areaD && visibleCum.length > 2 && (
            <path d={areaD} fill={areaColor} opacity={areaOpacity} />
          )}

          {/* Outer glow */}
          {glowWidth > 0 && (
            <path d={pathD} fill="none" stroke={accentColor} strokeWidth={glowWidth * eventPulse} opacity={glowOpacity * eventPulse * sectorReveal} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'blur(8px)' }} />
          )}

          {/* Thick background line */}
          <path d={pathD} fill="none" stroke={sector.color} strokeWidth={lineWidth * 1.2} opacity={mainOpacity * 0.15 * eventPulse * sectorReveal} strokeLinecap="round" strokeLinejoin="round" />

          {/* Main line */}
          <path d={pathD} fill="none" stroke={sector.color} strokeWidth={lineWidth} opacity={effectiveOpacity} strokeLinecap="round" strokeLinejoin="round" />

          {isMainlineFocus && (
            <path d={pathD} fill="none" stroke="#fbbf24" strokeWidth={lineWidth * 0.42} opacity={0.45 * eventPulse * sectorReveal} strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Event highlight */}
          {isActiveEvent && (
            <path d={pathD} fill="none" stroke="#ffffff" strokeWidth={lineWidth * 0.4} opacity={0.25 * eventPulse * sectorReveal} strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Endpoint glow + dot */}
          {currentIdx > 1 && pointR > 0 && (
            <>
              <circle cx={endX} cy={endY} r={glowR} fill={accentColor} opacity={glowOp} style={{ filter: 'blur(4px)' }} />
              {isHighlighted && (
                <circle cx={endX} cy={endY} r={pointR + (isTV ? 3 : 4)} fill="none" stroke={isMainlineFocus ? '#fbbf24' : accentColor} strokeWidth={1.2} opacity={0.55 * eventPulse * sectorReveal} />
              )}
              <circle cx={endX} cy={endY} r={pointR} fill={sector.color} stroke="#ffffff" strokeWidth={isHighlighted ? 1.4 : 1} opacity={pointOpacity * eventPulse * sectorReveal} />
            </>
          )}
        </g>

        {showLabel && (
          <g>
            <line
              x1={endX + pointR + 2}
              y1={endY}
              x2={leaderEndX}
              y2={labelY}
              stroke={accentColor}
              strokeWidth={1}
              opacity={isHighlighted ? 0.55 : 0.35}
            />
            <line
              x1={leaderEndX}
              y1={labelY}
              x2={labelColumnX}
              y2={labelY}
              stroke={accentColor}
              strokeWidth={1}
              opacity={isHighlighted ? 0.55 : 0.35}
            />
            {isMainlineFocus && (
              <>
                <rect
                  x={labelColumnX - (isTV ? 56 : 68)}
                  y={labelY - (isTV ? 26 : 30)}
                  width={isTV ? 44 : 52}
                  height={isTV ? 16 : 20}
                  rx={999}
                  fill="rgba(251,191,36,0.18)"
                  stroke="rgba(251,191,36,0.6)"
                  strokeWidth={0.8}
                />
                <text
                  x={labelColumnX - (isTV ? 34 : 42)}
                  y={labelY - (isTV ? 18 : 20)}
                  fill="#fcd34d"
                  fontSize={isTV ? 10 : 12}
                  fontWeight={800}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif', letterSpacing: 1.2 }}
                >
                  主线
                </text>
              </>
            )}
            <text
              x={labelColumnX}
              y={labelY + 1}
              fontSize={labelFontSize}
              fontWeight={isHighlighted ? 700 : 600}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              style={{ fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif' }}
            >
              <tspan fill={accentColor} style={{ textShadow: `0 0 4px ${accentColor}33` }}>
                {sector.name}
              </tspan>
              <tspan fill={lastVal >= 0 ? '#f87171' : '#4ade80'} dx={5}>
                {valueText}
              </tspan>
            </text>
            {showStructureBar && (sector.superNet !== undefined || sector.bigNet !== undefined) &&
              (Math.abs(sector.superNet ?? 0) > 0 || Math.abs(sector.bigNet ?? 0) > 0) && (
                <g transform={`translate(${labelColumnX - (isTV ? 36 : 48)}, ${labelY + 12})`}>
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
      </g>
    );
  });

  const XTICKS = isMorning
    ? [{ pos: 0, label: '09:30' }, { pos: 30, label: '10:00' }, { pos: 60, label: '10:30' }, { pos: 90, label: '11:00' }, { pos: 120, label: '11:30' }]
    : [{ pos: 0, label: '09:30' }, { pos: 60, label: '10:30' }, { pos: 120, label: '11:30/13:00' }, { pos: 180, label: '14:00' }, { pos: 240, label: '15:00' }];
  const visibleXTicks = XTICKS.filter((t) => t.pos >= dataXBounds.min && t.pos <= dataXBounds.max);

  // Zero line pulse
  const zeroPulse = Math.sin(frame * 0.08) * 0.15 + 0.7;

  return (
    <svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, zIndex: 5, pointerEvents: 'none', overflow: 'visible' }}>
      {/* Grid lines */}
      {visibleXTicks.map((t, i) => (
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
      {visibleXTicks.map((t, i) => (
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

      {/* Inflection markers */}
      {inflectionMarkersJSX}

      {/* Progress line */}
      {cumulativeData.length > 0 && cumulativeData[0].times.length > 0 && currentIdx >= 0 && (
        <line x1={xScale(timeToTradingMinutes(cumulativeData[0].times[currentIdx]))} y1={chartTop - 8} x2={xScale(timeToTradingMinutes(cumulativeData[0].times[currentIdx]))} y2={chartBottom + 8} stroke="#5a90d0" strokeWidth={1.2} opacity={0.6} strokeDasharray="4 4" />
      )}
    </svg>
  );
};
