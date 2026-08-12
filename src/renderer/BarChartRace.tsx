import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, spring } from 'remotion';
import type { BarSnapshot, MultiDayAnalysis, SectorData } from './types.ts';

// ============================================================
// Cinematic Financial Bar Chart Race
// Bloomberg Terminal / TradingView Premium Style
// ============================================================

const BAR_HEIGHT = 40;
const BAR_GAP = 6;
const LABEL_WIDTH = 110;
const VALUE_WIDTH = 100;
const MAX_BAR_WIDTH_RATIO = 0.65;
const TOP_SECTION_HEIGHT_RATIO = 0.70;

// Financial color palette (low saturation, institutional feel)
const FINANCIAL_COLORS: Record<string, string> = {
  inflow: '#00B4D8',
  inflowBright: '#00F0FF',
  outflow: '#E63946',
  neutral: '#4A90D9',
  grid: 'rgba(74, 144, 217, 0.08)',
};

// Sector-specific colors (financial terminal style)
const SECTOR_COLOR_MAP: Record<string, string> = {
  '半导体': '#00B4D8',
  'AI应用': '#00F0FF',
  'CPO概念': '#48CAE4',
  '人工智能': '#0096C7',
  '机器人': '#F4A261',
  '商业航天': '#E76F51',
  '创新药': '#2A9D8F',
  '电池': '#264653',
  '银行': '#E9C46A',
  '白酒': '#D4A574',
  '消费电子': '#81B29A',
  '低空经济': '#F2CC8F',
  '锂矿概念': '#95D5B2',
  '有色金属': '#B5838D',
  '云计算': '#6D6875',
  '国产芯片': '#E07A5F',
  '元件': '#5CDB95',
  '通信服务': '#845EC2',
  '电网设备': '#4A90D9',
  '通信设备': '#FF6B8A',
  '传媒': '#F4D03F',
  '证券': '#5DADE2',
};

// HSL fallback for sectors not in the color map
function getSectorColor(name: string): string {
  const mapped = SECTOR_COLOR_MAP[name];
  if (mapped) return mapped;
  // Deterministic hue from name hash (pure function — stable per sector name)
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 50%)`;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Competitive overshoot easing — bars snap past their target then settle, like overtaking
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// Anticipation easing — brief "charging up" before springing forward
function easeInAnticipate(t: number): number {
  return t < 0.15 ? t / 0.15 * -8 : (t - 0.15) / 0.85;
}

// Podium rank colors
const PODIUM_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

function formatNet(net: number): string {
  const sign = net >= 0 ? '+' : '';
  return `${sign}${net.toFixed(1)}亿`;
}


interface BarRaceChartProps {
  snapshots: BarSnapshot[];
  analysis: MultiDayAnalysis;
  frame: number;
  totalFrames: number;
  width: number;
  height: number;
}

export const BarRaceChart: React.FC<BarRaceChartProps> = ({
  snapshots,
  analysis,
  frame,
  totalFrames,
  width,
  height,
}) => {
  if (snapshots.length === 0) return null;

  // Frame ranges — synced with MultiDayVideo
  const RACE_START = 90;
  const RACE_END = 1259;
  const numSnapshots = snapshots.length;
  const raceDuration = RACE_END - RACE_START;
  const raceFrame = Math.max(0, frame - RACE_START);

  // Per-snapshot frame allocation: each tick time point gets equal budget
  const framesPerSnapshot = Math.max(1, raceDuration / numSnapshots);
  const rawIndex = Math.floor(raceFrame / framesPerSnapshot);
  const currentIndex = Math.min(rawIndex, numSnapshots - 1);
  const nextIndex = Math.min(currentIndex + 1, numSnapshots - 1);
  const transitionProgress = Math.min(1, Math.max(0, (raceFrame - currentIndex * framesPerSnapshot) / framesPerSnapshot));

  // Continuous animation: always easing between tick snapshots
  const netProgress = easeInOutCubic(transitionProgress);
  const rankProgress = easeOutBack(transitionProgress);
  const isTransition = transitionProgress > 0 && transitionProgress < 1;

  const currentSnapshot = snapshots[currentIndex];
  const nextSnapshot = snapshots[nextIndex];

  // Build sector data with interpolated positions — O(n) using Map
  const sectorMap = useMemo(() => {
    const currentBars = currentSnapshot.bars;
    const nextBars = nextSnapshot.bars;

    // Build index maps for O(1) lookup
    const currentIndex = new Map<string, number>();
    currentBars.forEach((b, i) => currentIndex.set(b.name, i));
    const nextIndex = new Map<string, number>();
    nextBars.forEach((b, i) => nextIndex.set(b.name, i));

    const map = new Map<string, { currentNet: number; nextNet: number; currentRank: number; nextRank: number; netChange: number; rankChange: number; color: string; currentChangePct: number; nextChangePct: number }>();

    for (const bar of currentBars) {
      const rank = currentIndex.get(bar.name)! + 1;
      const nextIdx = nextIndex.get(bar.name);
      const nextRank = nextIdx !== undefined ? nextIdx + 1 : rank;
      const nextBar = nextIdx !== undefined ? nextBars[nextIdx] : bar;

      map.set(bar.name, {
        currentNet: bar.net,
        nextNet: nextBar.net,
        currentRank: rank,
        nextRank,
        netChange: nextBar.net - bar.net,
        rankChange: nextRank - rank,
        color: getSectorColor(bar.name),
        currentChangePct: bar.changePct ?? 0,
        nextChangePct: nextBar.changePct ?? 0,
      });
    }

    if (isTransition) {
      for (const bar of nextBars) {
        if (!map.has(bar.name)) {
          const rank = nextIndex.get(bar.name)! + 1;
          const currentIdx = currentIndex.get(bar.name);
          const currentBar = currentIdx !== undefined ? currentBars[currentIdx] : undefined;
          map.set(bar.name, {
            currentNet: currentBar ? currentBar.net : 0,
            nextNet: bar.net,
            currentRank: currentIdx !== undefined ? currentIdx + 1 : rank,
            nextRank: rank,
            netChange: bar.net - (currentBar ? currentBar.net : 0),
            rankChange: rank - (currentIdx !== undefined ? currentIdx + 1 : rank),
            color: getSectorColor(bar.name),
            currentChangePct: currentBar?.changePct ?? 0,
            nextChangePct: bar.changePct ?? 0,
          });
        }
      }
    }

    return map;
  }, [currentSnapshot, nextSnapshot, isTransition]);

  // Interpolate and sort — rank uses overshoot easing for competitive snap, net uses smooth easing
  const sectors = useMemo(() => {
    return Array.from(sectorMap.entries()).map(([name, data]) => {
      const net = data.currentNet + data.netChange * netProgress;
      const rank = data.currentRank + (data.nextRank - data.currentRank) * rankProgress;
      const changePct = data.currentChangePct + (data.nextChangePct - data.currentChangePct) * netProgress;
      return { name, net, rank, color: data.color, prevRank: data.currentRank, targetRank: data.nextRank, rankChange: data.rankChange, netChange: data.netChange, changePct };
    }).sort((a, b) => a.rank - b.rank).slice(0, 21);
  }, [sectorMap, netProgress, rankProgress]);

  // Identify main line (sector with highest absolute net flow)
  const mainLineName = useMemo(() => {
    let maxAbs = 0;
    let main = sectors[0]?.name || '';
    for (const s of sectors) {
      if (Math.abs(s.net) > maxAbs) {
        maxAbs = Math.abs(s.net);
        main = s.name;
      }
    }
    return main;
  }, [sectors]);

  // Calculate max bar width
  const maxAbsNet = Math.max(1, ...sectors.map(s => Math.abs(s.net)));
  const maxBarWidth = width * MAX_BAR_WIDTH_RATIO;

  // Top section height
  const topSectionHeight = height * TOP_SECTION_HEIGHT_RATIO;
  const chartTop = topSectionHeight * 0.12;

  // Date and time from tick snapshot data
  const currentDate = currentSnapshot.date;
  const currentTime = currentSnapshot.time || '';
  const nextTime = nextSnapshot.time || '';

  // Race progress (0-1) for progress bar
  const timeProgress = raceFrame / raceDuration;

  // Sentiment calculation
  const inflowCount = sectors.filter(s => s.net > 0).length;
  const sentiment = inflowCount > sectors.length * 0.6 ? 'bullish' : inflowCount < sectors.length * 0.4 ? 'bearish' : 'neutral';

  // Cross-day detection (for overtaking glow effects)
  const isCrossDay = currentIndex < numSnapshots - 1 && currentSnapshot.date !== nextSnapshot.date;

  const panelOpacity = 0.8;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0e17' }}>
      {/* Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, #0a0e17 0%, #0d1220 40%, #0a0e17 100%)',
      }} />

      {/* HUD Grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05 }}>
        {Array.from({ length: Math.floor(topSectionHeight / 30) }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: i * 30,
            height: 1,
            backgroundColor: '#4a90d9',
          }} />
        ))}
      </div>

      {/* Scan line */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: interpolate(frame % 100, [0, 100], [0, topSectionHeight]),
        height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.1), transparent)',
      }} />

      {/* Top Header Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        borderBottom: '1px solid rgba(0, 240, 255, 0.1)',
        background: 'rgba(10, 14, 23, 0.8)',
        zIndex: 10,
      }}>
        <div style={{
          fontSize: 14,
          fontWeight: 700,
          color: '#00F0FF',
          letterSpacing: 2,
          fontFamily: 'monospace',
        }}>
          A股板块资金流监控
        </div>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 13,
          fontFamily: 'monospace',
        }}>
          <span style={{ color: '#5a6577' }}>{currentDate}</span>
          <span style={{ color: '#e0e4e8', fontWeight: 600 }}>{currentTime}</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: sentiment === 'bullish' ? '#00F0FF' : sentiment === 'bearish' ? '#FF6B8A' : '#8892a4',
              boxShadow: `0 0 8px ${sentiment === 'bullish' ? '#00F0FF' : sentiment === 'bearish' ? '#FF6B8A' : '#8892a4'}80`,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <span style={{ color: '#8892a4', fontSize: 11, letterSpacing: 1 }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div style={{
        position: 'absolute',
        top: 44,
        left: LABEL_WIDTH + 10,
        right: VALUE_WIDTH + 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        fontSize: 12,
        fontWeight: 600,
        color: '#4a5568',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        borderBottom: '1px solid rgba(74, 144, 217, 0.1)',
      }}>
        <div style={{ flex: 1 }}>主力资金净流入</div>
        <div style={{ textAlign: 'right', minWidth: VALUE_WIDTH }}>实时数值</div>
      </div>

      {/* Bars */}
      {sectors.map((sector, index) => {
        const y = chartTop + 28 + index * (BAR_HEIGHT + BAR_GAP);
        const barWidth = (Math.abs(sector.net) / maxAbsNet) * maxBarWidth;
        const isMainLine = sector.name === mainLineName;
        const color = sector.color;
        const rankChange = sector.prevRank - (index + 1);
        const isRising = rankChange > 0;
        const isFalling = rankChange < 0;
        const absRankChange = Math.abs(rankChange);

        // Top 3 podium rank
        const isPodium = index < 3;
        const podiumColor = PODIUM_COLORS[index + 1];

        // Overtaking glow: during cross-day transitions, sectors that moved up get a competitive boost glow
        const isOvertaking = isCrossDay && isRising && absRankChange >= 1;
        const overtakeGlowIntensity = isOvertaking ? interpolate(
          Math.sin(transitionProgress * Math.PI * 4 + index * 0.5),
          [-1, 1],
          [0.3, 1],
        ) : 0;

        // Spring animation for entry (staggered)
        const entryOpacity = spring({ frame: Math.max(0, frame - RACE_START - index * 3), fps: 30, config: { damping: 12, stiffness: 80 } });

        return (
          <div key={sector.name} style={{
            position: 'absolute',
            top: y,
            left: 0,
            right: 0,
            height: BAR_HEIGHT,
            opacity: entryOpacity,
          }}>
            {/* Rank number — podium style for top 3 */}
            <div style={{
              position: 'absolute',
              left: 4,
              top: 0,
              width: 24,
              height: BAR_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isPodium ? 15 : 13,
              fontWeight: 700,
              fontFamily: 'monospace',
              color: isPodium ? podiumColor : (isMainLine ? '#00F0FF' : '#4a5568'),
              textShadow: isPodium ? `0 0 8px ${podiumColor}60` : 'none',
            }}>
              {isPodium
                ? ['🥇', '🥈', '🥉'][index]
                : String(index + 1).padStart(2, '0')}
            </div>

            {/* Sector name */}
            <div style={{
              position: 'absolute',
              left: 28,
              top: 0,
              width: LABEL_WIDTH - 20,
              height: BAR_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              fontSize: isMainLine ? 18 : 16,
              fontWeight: isMainLine ? 700 : 500,
              color: isMainLine ? '#ffffff' : '#c0c8d4',
              fontFamily: isMainLine ? 'sans-serif' : 'sans-serif',
              textShadow: isMainLine ? '0 0 12px rgba(0, 240, 255, 0.4)' : 'none',
            }}>
              {sector.name}
              {isMainLine && (
                <span style={{
                  marginLeft: 6,
                  fontSize: 9,
                  padding: '1px 4px',
                  borderRadius: 2,
                  backgroundColor: 'rgba(0, 240, 255, 0.2)',
                  color: '#00F0FF',
                  letterSpacing: 0.5,
                }}>
                  主线
                </span>
              )}
              {sector.changePct !== undefined && sector.changePct !== 0 && (
                <span style={{
                  marginLeft: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  color: sector.changePct > 0 ? '#f87171' : '#4ade80',
                  fontFamily: 'monospace',
                  fontVariantNumeric: 'tabular-nums' as const,
                  opacity: 0.85,
                }}>
                  {sector.changePct > 0 ? '+' : ''}{sector.changePct.toFixed(2)}%
                </span>
              )}
            </div>

            {/* Bar container */}
            <div style={{
              position: 'absolute',
              left: LABEL_WIDTH + 10,
              right: VALUE_WIDTH + 10,
              top: 0,
              height: BAR_HEIGHT,
              display: 'flex',
              alignItems: 'center',
            }}>
              {/* Bar background track */}
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: BAR_HEIGHT * 0.6,
                borderRadius: 2,
                backgroundColor: 'rgba(74, 144, 217, 0.06)',
              }} />

              {/* Bar fill */}
              <div style={{
                position: 'absolute',
                left: 0,
                width: barWidth,
                height: BAR_HEIGHT * 0.6,
                borderRadius: 2,
                background: isMainLine
                  ? `linear-gradient(90deg, ${color}80, ${color})`
                  : `linear-gradient(90deg, ${color}60, ${color}90)`,
                boxShadow: isMainLine
                  ? `0 0 16px ${color}40, inset 0 0 8px ${color}20`
                  : isOvertaking
                    ? `0 0 ${12 + overtakeGlowIntensity * 12}px ${color}60, inset 0 0 8px ${color}30`
                    : `0 0 8px ${color}20`,
                transition: 'width 0.3s ease-out',
              }}>
                {/* Bar inner glow / HUD shine */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.12), transparent)',
                  borderRadius: '2px 2px 0 0',
                }} />

                {/* Overtaking burst: competitive energy wave on the bar */}
                {isOvertaking && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: `${Math.min(100, overtakeGlowIntensity * 100)}%`,
                    width: 40,
                    height: '100%',
                    background: `linear-gradient(90deg, transparent, ${color}80, transparent)`,
                    borderRadius: 2,
                    opacity: overtakeGlowIntensity * 0.6,
                  }} />
                )}
              </div>
            </div>

            {/* Value */}
            <div style={{
              position: 'absolute',
              right: 10,
              top: 0,
              width: VALUE_WIDTH,
              height: BAR_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              fontSize: isMainLine ? 17 : 15,
              fontWeight: 700,
              color: color,
              fontFamily: 'monospace',
              textShadow: isMainLine ? `0 0 10px ${color}60` : 'none',
            }}>
              {formatNet(sector.net)}
            </div>

            {/* Rank change indicator — amplified during transitions */}
            {rankChange !== 0 && (
              <div style={{
                position: 'absolute',
                right: VALUE_WIDTH + 15,
                top: 0,
                height: BAR_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isOvertaking ? 15 : 12,
                fontWeight: 700,
                color: isRising ? '#00F0FF' : '#FF6B8A',
                fontFamily: 'monospace',
                textShadow: isOvertaking
                  ? `0 0 ${12 + overtakeGlowIntensity * 8}px ${isRising ? '#00F0FF' : '#FF6B8A'}80`
                  : `0 0 6px ${isRising ? '#00F0FF' : '#FF6B8A'}40`,
                opacity: isCrossDay ? interpolate(transitionProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]) : 0.8,
              }}>
                {isRising ? '▲' : '▼'}{absRankChange}
              </div>
            )}

            {/* Separator line */}
            <div style={{
              position: 'absolute',
              bottom: -BAR_GAP / 2,
              left: LABEL_WIDTH + 10,
              right: VALUE_WIDTH + 10,
              height: 1,
              backgroundColor: 'rgba(74, 144, 217, 0.04)',
            }} />
          </div>
        );
      })}

      {/* Bottom separator for 70/30 split */}
      <div style={{
        position: 'absolute',
        top: topSectionHeight,
        left: 0,
        right: 0,
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.2), transparent)',
      }} />

      {/* ========== Bottom Panel (30% height) ========== */}
      <div style={{
        position: 'absolute',
        top: topSectionHeight + 2,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: panelOpacity,
        transition: 'opacity 0.3s ease',
      }}>
        {/* Bottom panel content wrapper */}
        <div style={{
          display: 'flex',
          height: '100%',
          padding: '16px 24px',
          gap: 16,
        }}>
          {/* Right section: day overview — full width */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 48,
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#4a5568',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              paddingBottom: 6,
            }}>
              概览
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#3a4557', fontFamily: 'monospace' }}>主力流入</div>
              <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: sentiment === 'bullish' ? '#22c55e' : sentiment === 'bearish' ? '#ef4444' : '#8892a4',
                fontFamily: 'monospace',
              }}>
                {inflowCount}/{sectors.length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#3a4557', fontFamily: 'monospace' }}>日期</div>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#e0e4e8',
                fontFamily: 'monospace',
              }}>
                {currentDate}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar at top of chart area */}
      <div style={{
        position: 'absolute',
        top: 38,
        left: 20,
        right: 20,
        height: 2,
        backgroundColor: 'rgba(74, 144, 217, 0.1)',
        borderRadius: 1,
      }}>
        <div style={{
          width: `${timeProgress * 100}%`,
          height: '100%',
          backgroundColor: '#00F0FF',
          borderRadius: 1,
          boxShadow: '0 0 8px rgba(0, 240, 255, 0.4)',
        }} />
      </div>

      {/* Time axis — show trading hours marker */}
      <div style={{
        position: 'absolute',
        top: 42,
        left: 20,
        right: 20,
        display: 'flex',
        justifyContent: 'center',
        fontSize: 11,
        color: '#3a4557',
        fontFamily: 'monospace',
        gap: 24,
      }}>
        {currentTime && (
          <>
            <span style={{ color: '#5a6577' }}>09:30</span>
            <span style={{ color: '#00F0FF', fontWeight: 600, fontSize: 12 }}>
              ◉ {currentTime}
            </span>
            <span style={{ color: '#5a6577' }}>15:00</span>
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};
