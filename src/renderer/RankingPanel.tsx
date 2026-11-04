import React from 'react';
import type { SectorData } from './types.ts';
import { getVideoLayout } from './layout.ts';
import { CINE_COLORS } from './cinema.ts';
import { useGsapState } from './gsap/useRemotionGsap.ts';

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

const PODIUM_COLORS: Record<number, { color: string; label: string }> = {
  1: { color: CINE_COLORS.gold, label: 'TOP' },
  2: { color: '#c7cdd4', label: '2ND' },
  3: { color: '#d78d53', label: '3RD' },
};

type TradeTagTone = 'leader' | 'follow' | 'mixed' | 'fade';

function getTradeTag(
  sector: SectorData,
  index: number,
  isPositive: boolean,
  isHighlighted: boolean,
  highlightMode: 'focus' | 'mainline',
): { text: string; tone: TradeTagTone } | null {
  const changePct = sector.changePct ?? 0;
  const rate = sector.rate ?? 0;

  if (isPositive) {
    if (isHighlighted && highlightMode === 'mainline') return { text: '主升', tone: 'leader' };
    if (index === 0 && sector.net > 0) return { text: '主升', tone: 'leader' };
    if (changePct < 0 || rate < 0) return { text: '分歧', tone: 'mixed' };
    if (index <= 2 && sector.net > 0) return { text: '接力', tone: 'follow' };
    if (sector.net > 0 && rate > 0) return { text: '承接', tone: 'follow' };
    return null;
  }

  if (index === 0 || (isHighlighted && highlightMode !== 'mainline')) return { text: '退潮', tone: 'fade' };
  if (changePct > 0 || rate > 0) return { text: '分歧', tone: 'mixed' };
  if (Math.abs(sector.net) >= 30) return { text: '退潮', tone: 'fade' };
  return null;
}

function getTradeTagStyle(tone: TradeTagTone): { text: string; border: string; bg: string } {
  switch (tone) {
    case 'leader':
      return { text: '#f3d178', border: 'rgba(245,198,72,0.4)', bg: 'rgba(245,198,72,0.13)' };
    case 'follow':
      return { text: '#a8c7ff', border: 'rgba(110,160,255,0.38)', bg: 'rgba(80,130,250,0.13)' };
    case 'mixed':
      return { text: '#cfc0ff', border: 'rgba(180,160,255,0.38)', bg: 'rgba(140,110,255,0.13)' };
    case 'fade':
      return { text: '#ffb3c0', border: 'rgba(255,140,160,0.36)', bg: 'rgba(255,100,130,0.13)' };
  }
}

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
  const color = isPositive ? CINE_COLORS.inflowLight : CINE_COLORS.outflowLight;
  const displaySectors = sectors.slice(0, 18);

  // GSAP stagger: each row slides up + fades with power3-out pacing.
  const listAnim = useGsapState(
    frame,
    (p, t, fps) => {
      t.fromTo(p, { list: 0 }, { list: 1, duration: 1.2 * fps / 30, ease: 'power3.out' }, 0.1 * fps / 30);
    },
    [],
  );
  const listProgress = listAnim.list ?? 0;
  const rowsPer = 1 / Math.max(1, displaySectors.length);

  return (
    <div style={{ marginBottom: 20 * scale }}>
      <div
        style={{
          fontSize: 16 * scale,
          color: CINE_COLORS.inkDim,
          fontWeight: 700,
          letterSpacing: 1.4,
          paddingBottom: 6 * scale,
          marginBottom: 4 * scale,
          borderBottom: `1px solid ${color}40`,
          display: 'flex',
          alignItems: 'center',
          gap: 8 * scale,
        }}
      >
        <span style={{ width: 3, height: 12 * scale, borderRadius: 2, background: color, boxShadow: `0 0 8px ${color}88` }} />
        {title}
      </div>

      {displaySectors.map((sector, i) => {
        const isVisible = i < visibleCount;
        const rowStart = i * rowsPer;
        const local = Math.max(0, Math.min(1, (listProgress - rowStart) / rowsPer));
        const opacity = isVisible ? Math.min(1, 0.25 + 0.75 * local) : 0;
        const translateY = (1 - local) * 16;
        const isHighlighted = sector.name === highlightId;
        const isMainlineHighlight = isHighlighted && highlightMode === 'mainline';
        const pulseOpacity = isHighlighted ? Math.min(0.4, (frame % 30) / 30) : 0;
        const tradeTag = getTradeTag(sector, i, isPositive, isHighlighted, highlightMode);
        const tradeTagStyle = tradeTag ? getTradeTagStyle(tradeTag.tone) : null;

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
              transform: `translateY(${translateY}px)`,
              borderBottom: '1px solid rgba(42,53,80,0.15)',
              background: isHighlighted
                ? `linear-gradient(90deg, ${isMainlineHighlight ? '#f5c6481f' : `${sector.color}18`}, transparent)`
                : i < 3
                  ? `linear-gradient(90deg, ${PODIUM_COLORS[i + 1].color}14, transparent)`
                  : undefined,
              position: 'relative',
              borderRadius: i < 3 ? 4 : 0,
            }}
          >
            {isHighlighted && (
              <div style={{ position: 'absolute', left: 0, top: 4 * scale, bottom: 4 * scale, width: 2, borderRadius: 999, background: isMainlineHighlight ? CINE_COLORS.gold : sector.color, boxShadow: isMainlineHighlight ? `0 0 12px ${CINE_COLORS.gold}88` : `0 0 10px ${sector.color}66` }} />
            )}
            {isHighlighted && (
              <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: 4, background: `radial-gradient(circle at 30% 50%, ${sector.color}${Math.round(pulseOpacity * 50).toString(16).padStart(2, '0')}, transparent 70%)`, pointerEvents: 'none' }} />
            )}

            <span
              style={{
                fontSize: compact ? 12 * scale : 14 * scale,
                fontWeight: 800,
                color: isHighlighted ? sector.color : (i < 3 ? PODIUM_COLORS[i + 1].color : CINE_COLORS.inkDim),
                width: 26 * scale,
                fontVariantNumeric: 'tabular-nums' as const,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {i < 3 ? (
                <span style={{ padding: `${1 * scale}px ${4 * scale}px`, borderRadius: 3, background: `${PODIUM_COLORS[i + 1].color}1c`, border: `1px solid ${PODIUM_COLORS[i + 1].color}44`, fontSize: 9 * scale, letterSpacing: 1 }}>
                  {PODIUM_COLORS[i + 1].label}
                </span>
              ) : (
                i + 1
              )}
            </span>

            <span
              style={{
                fontSize: 15 * scale,
                fontWeight: 600,
                color: isHighlighted ? '#e6f0ff' : CINE_COLORS.inkBody,
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4 * scale,
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                {sector.name || '—'}
              </span>
              {tradeTag && tradeTagStyle && (
                <span style={{ fontSize: 9 * scale, fontWeight: 800, color: tradeTagStyle.text, padding: `${1 * scale}px ${4 * scale}px`, borderRadius: 999, background: tradeTagStyle.bg, border: `1px solid ${tradeTagStyle.border}`, letterSpacing: 0.8, flexShrink: 0 }}>
                  {tradeTag.text}
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
                <span style={{ fontSize: 12 * scale, color, opacity: 0.7, marginLeft: 4 * scale }}>
                  ({sector.rate > 0 ? '+' : ''}{sector.rate.toFixed(1)}%)
                </span>
              )}
              {!compact && sector.changePct !== undefined && sector.changePct !== 0 && (
                <span
                  style={{
                    fontSize: 11 * scale,
                    fontWeight: 600,
                    color: sector.changePct > 0 ? CINE_COLORS.inflowLight : CINE_COLORS.outflowLight,
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
              &nbsp;{isPositive ? '▲' : '▼'}
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

  const progress = frame / Math.max(1, totalFrames);
  const showTop3Preview = frame < 60;
  const inflowVisible = Math.min(
    inflowSectors.length,
    showTop3Preview ? Math.min(3, inflowSectors.length) : Math.floor(progress * inflowSectors.length * 1.6),
  );
  const outflowVisible = Math.min(
    outflowSectors.length,
    showTop3Preview ? Math.min(3, outflowSectors.length) : Math.floor(progress * outflowSectors.length * 1.6),
  );

  // Panel entrance — glass panel slides in from the right edge.
  const panelAnim = useGsapState(
    frame,
    (p, t, fps) => {
      t.fromTo(p, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9 * fps / 30, ease: 'power4.out' }, 0.05 * fps / 30);
    },
    [],
  );
  const panelX = panelAnim.x ?? 0;
  const panelOpacity = panelAnim.opacity ?? 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: panelLeft,
        top: panelTop,
        width: panelWidth,
        zIndex: 10,
        fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
        background: 'linear-gradient(90deg, rgba(6,12,24,0.92) 0%, rgba(6,12,24,0.8) 100%)',
        border: `1px solid ${CINE_COLORS.hairline}`,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderRadius: 12,
        padding: `${10 * scale}px ${12 * scale}px`,
        boxSizing: 'border-box',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
        opacity: panelOpacity,
        transform: `translateX(${panelX}px)`,
      }}
    >
      <div
        style={{
          fontSize: 18 * scale,
          color: CINE_COLORS.inkBody,
          fontWeight: 700,
          letterSpacing: 2,
          marginBottom: 12 * scale,
          paddingBottom: 6 * scale,
          borderBottom: `1px solid ${CINE_COLORS.hairline}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8 * scale,
        }}
      >
        <span style={{ width: 3, height: 13 * scale, borderRadius: 2, background: CINE_COLORS.cyan, boxShadow: `0 0 10px ${CINE_COLORS.cyan}88` }} />
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