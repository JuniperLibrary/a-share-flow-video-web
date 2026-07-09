import React from 'react';
import type { SectorData } from './types.ts';
import { getVideoLayout } from './layout.ts';

interface RankingPanelProps {
  sectors: SectorData[];
  frame: number;
  totalFrames: number;
  highlightId?: string;
  highlightMode?: 'focus' | 'mainline';
  width?: number;
  height?: number;
  format?: 'mobile' | 'tv';
}

const PODIUM_COLORS: Record<number, { bg: string; text: string; badge: string }> = {
  1: { bg: 'rgba(255, 215, 0, 0.08)', text: '#FFD700', badge: '🥇' },
  2: { bg: 'rgba(192, 192, 192, 0.08)', text: '#C0C0C0', badge: '🥈' },
  3: { bg: 'rgba(205, 127, 50, 0.08)', text: '#CD7F32', badge: '🥉' },
};

const RankingGroup: React.FC<{
  title: string;
  sectors: SectorData[];
  isPositive: boolean;
  visibleCount: number;
  highlightId?: string;
  highlightMode?: 'focus' | 'mainline';
  frame: number;
  scale: number;
  compact?: boolean;
}> = ({ title, sectors, isPositive, visibleCount, highlightId, highlightMode = 'focus', frame, scale, compact = false }) => {
  const color = isPositive ? '#f87171' : '#4ade80';
  const arrow = isPositive ? '↑' : '↓';
  const displaySectors = sectors.slice(0, 18);

  return (
    <div style={{ marginBottom: 20 * scale }}>
      <div
        style={{
          fontSize: 16 * scale,
          color: '#8899aa',
          fontWeight: 600,
          letterSpacing: 1,
          paddingBottom: 6 * scale,
          marginBottom: 4 * scale,
          borderBottom: `1px solid ${color}33`,
        }}
      >
        {title}
      </div>

      {displaySectors.map((sector, i) => {
        const isVisible = i < visibleCount;
        const opacity = isVisible ? Math.min(1, Math.max(0.8, (frame - i * 5) / 10)) : 0;
        const isHighlighted = sector.name === highlightId;
        const isMainlineHighlight = isHighlighted && highlightMode === 'mainline';
        const pulseOpacity = isHighlighted ? Math.min(0.4, (frame % 30) / 30) : 0;

        return (
          <div
            key={sector.name || `sector-${i}`}
            style={{
              display: 'grid',
              gridTemplateColumns: compact
                ? `${26 * scale}px minmax(${56 * scale}px, 1fr) auto`
                : `${26 * scale}px minmax(${72 * scale}px, 1fr) auto`,
              gap: `${4 * scale}px`,
              alignItems: 'center',
              padding: `${5 * scale}px 0`,
              opacity: Math.max(0, opacity),
              borderBottom: '1px solid rgba(42,53,80,0.15)',
              background: isHighlighted
                ? `linear-gradient(90deg, ${isMainlineHighlight ? '#fbbf241f' : `${sector.color}18`}, transparent)`
                : i < 3
                  ? `linear-gradient(90deg, ${PODIUM_COLORS[i + 1].bg}, transparent)`
                  : undefined,
              position: 'relative',
              borderRadius: i < 3 ? 4 : 0,
            }}
          >
            {isHighlighted && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 4 * scale,
                  bottom: 4 * scale,
                  width: 2,
                  borderRadius: 999,
                  background: isMainlineHighlight ? '#fbbf24' : sector.color,
                  boxShadow: isMainlineHighlight ? '0 0 12px rgba(251,191,36,0.55)' : `0 0 10px ${sector.color}66`,
                }}
              />
            )}
            {isHighlighted && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 4,
                  background: `radial-gradient(circle at 30% 50%, ${sector.color}${Math.round(pulseOpacity * 50).toString(16).padStart(2, '0')}, transparent 70%)`,
                  pointerEvents: 'none',
                }}
              />
            )}

            <span
              style={{
                fontSize: 14 * scale,
                fontWeight: 700,
                color: isHighlighted ? sector.color : (i < 3 ? PODIUM_COLORS[i + 1].text : '#556677'),
                width: 26 * scale,
                fontVariantNumeric: 'tabular-nums' as const,
                position: 'relative',
                zIndex: 1,
                textShadow: i < 3 ? `0 0 6px ${PODIUM_COLORS[i + 1].text}44` : 'none',
              }}
            >
              {i < 3 ? PODIUM_COLORS[i + 1].badge : i + 1}
            </span>

            <span
              style={{
                fontSize: 15 * scale,
                fontWeight: 600,
                color: isHighlighted ? '#ddeeff' : '#ccddee',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4 * scale,
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {sector.name || '—'}
              </span>
              {isMainlineHighlight && (
                <span
                  style={{
                    fontSize: 9 * scale,
                    fontWeight: 800,
                    color: '#fcd34d',
                    padding: `${1 * scale}px ${4 * scale}px`,
                    borderRadius: 999,
                    background: 'rgba(251,191,36,0.12)',
                    border: '1px solid rgba(251,191,36,0.35)',
                    letterSpacing: 0.8,
                    flexShrink: 0,
                  }}
                >
                  主线
                </span>
              )}
            </span>

            <span
              style={{
                fontSize: compact ? 13 * scale : 15 * scale,
                fontWeight: 700,
                color,
                fontVariantNumeric: 'tabular-nums' as const,
                textShadow: `0 0 8px ${color}44`,
                textAlign: 'right',
                position: 'relative',
                zIndex: 1,
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {isPositive ? '+' : ''}{sector.net.toFixed(1)}亿
              {!compact && sector.rate !== 0 && (
                <span style={{ fontSize: 12 * scale, color: isPositive ? '#f87171' : '#4ade80', opacity: 0.7, marginLeft: 4 * scale }}>
                  ({sector.rate > 0 ? '+' : ''}{sector.rate.toFixed(1)}%)
                </span>
              )}
              {!compact && sector.changePct !== undefined && sector.changePct !== 0 && (
                <span
                  style={{
                    fontSize: 11 * scale,
                    fontWeight: 600,
                    color: sector.changePct > 0 ? '#f87171' : '#4ade80',
                    opacity: 0.85,
                    marginLeft: 4 * scale,
                    padding: `0 ${3 * scale}px`,
                    borderRadius: 2,
                    backgroundColor: sector.changePct > 0 ? 'rgba(248, 113, 113, 0.12)' : 'rgba(74, 222, 128, 0.12)',
                    fontVariantNumeric: 'tabular-nums' as const,
                  }}
                >
                  {sector.changePct > 0 ? '+' : ''}{sector.changePct.toFixed(2)}%
                </span>
              )}
              {!compact && (sector.superNet !== 0 || sector.bigNet !== 0) && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 48 * scale,
                    height: 3,
                    marginLeft: 6 * scale,
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    backgroundColor: 'rgba(74, 144, 217, 0.1)',
                    verticalAlign: 'middle',
                  }}
                  title={`超大单 ${(sector.superNet ?? 0).toFixed(1)}亿 · 大单 ${(sector.bigNet ?? 0).toFixed(1)}亿`}
                >
                  {(() => {
                    const superW = (sector.superNet ?? 0);
                    const bigW = (sector.bigNet ?? 0);
                    const total = Math.abs(superW) + Math.abs(bigW);
                    if (total === 0) return null;
                    const superPct = (Math.abs(superW) / total) * 100;
                    const bigPct = (Math.abs(bigW) / total) * 100;
                    return (
                      <>
                        <span
                          style={{
                            display: 'inline-block',
                            width: `${superPct}%`,
                            height: '100%',
                            backgroundColor: '#f87171',
                            verticalAlign: 'top',
                          }}
                        />
                        <span
                          style={{
                            display: 'inline-block',
                            width: `${bigPct}%`,
                            height: '100%',
                            backgroundColor: '#fb923c',
                            verticalAlign: 'top',
                          }}
                        />
                      </>
                    );
                  })()}
                </span>
              )}
              &nbsp;{arrow}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const RankingPanel: React.FC<RankingPanelProps> = ({
  sectors,
  frame,
  totalFrames,
  highlightId,
  highlightMode = 'focus',
  width = 1080,
  height = 1920,
  format = 'mobile',
}) => {
  const isTV = format === 'tv';
  const scale = isTV ? 1.1 : 1.5;
  const layout = getVideoLayout(width, height, format);

  const panelLeft = layout.rankingPanelLeft;
  const panelTop = layout.rankingPanelTop;
  const panelWidth = layout.rankingPanelWidth;

  const inflowSectors = sectors.filter((s) => s.net >= 0).sort((a, b) => b.net - a.net);
  const outflowSectors = sectors.filter((s) => s.net < 0).sort((a, b) => a.net - b.net);

  const progress = frame / totalFrames;
  const showTop3Preview = frame < 60;
  const inflowVisible = Math.min(
    inflowSectors.length,
    showTop3Preview ? Math.min(3, inflowSectors.length) : Math.floor(progress * inflowSectors.length * 1.6),
  );
  const outflowVisible = Math.min(
    outflowSectors.length,
    showTop3Preview ? Math.min(3, outflowSectors.length) : Math.floor(progress * outflowSectors.length * 1.6),
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: panelLeft,
        top: panelTop,
        width: panelWidth,
        zIndex: 10,
        fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
        background: 'linear-gradient(90deg, rgba(8,14,26,0.92) 0%, rgba(8,14,26,0.78) 100%)',
        borderRadius: 8,
        padding: `${8 * scale}px ${10 * scale}px`,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: 18 * scale,
          color: '#8899aa',
          fontWeight: 600,
          letterSpacing: 2,
          marginBottom: 12 * scale,
          paddingBottom: 6 * scale,
          borderBottom: '1px solid #2a3550',
        }}
      >
        资金排行榜
      </div>

      {inflowSectors.length > 0 && (
        <RankingGroup
          title="净流入 TOP"
          sectors={inflowSectors}
          isPositive={true}
          visibleCount={inflowVisible}
          highlightId={highlightId}
          highlightMode={highlightMode}
          frame={frame}
          scale={scale}
          compact={!isTV}
        />
      )}

      {outflowSectors.length > 0 && (
        <RankingGroup
          title="净流出 TOP"
          sectors={outflowSectors}
          isPositive={false}
          visibleCount={outflowVisible}
          highlightId={highlightId}
          highlightMode={highlightMode}
          frame={frame}
          scale={scale}
          compact={!isTV}
        />
      )}
    </div>
  );
};
