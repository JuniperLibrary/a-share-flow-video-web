import React from 'react';
import { CINE_COLORS, CINE_EASE } from './cinema.ts';
import { useGsapState } from './gsap/useRemotionGsap.ts';

interface HeaderProps {
  displayDate: string;
  frame?: number;
  totalFrames?: number;
  sentiment?: 'bullish' | 'bearish' | 'neutral' | 'mainline';
  width?: number;
  height?: number;
  format?: 'mobile' | 'tv';
  session?: 'morning' | 'full';
  hookText?: string;
  timeString?: string;
  marketTagline?: string;
  insightItems?: HeaderInsightItem[];
}

interface HeaderInsightItem {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'neutral' | 'focus';
}

const TOTAL_MINS: Record<string, number> = { morning: 120, full: 330 };
const BASE_MINUTE = 9 * 60 + 30; // 09:30

function tradingMinsToClock(mins: number): { h: number; m: number } {
  const raw = BASE_MINUTE + mins;
  let h = Math.floor(raw / 60);
  let m = raw % 60;
  if (h >= 13) { h -= 1; m += 60; } // skip 12:00-13:00 display gap
  if (h >= 13) { h = 13; m = m % 60; }
  return { h: h % 24, m: m % 60 };
}

const sentimentGlow: Record<NonNullable<HeaderProps['sentiment']>, string> = {
  bullish: CINE_COLORS.inflow,
  bearish: CINE_COLORS.outflow,
  mainline: CINE_COLORS.gold,
  neutral: CINE_COLORS.cyan,
};

const TITLE_COLORS = ['#ff6b6b', '#f7b32b', '#f5c648', '#38d9a9', '#4fd8ff'];

export const Header: React.FC<HeaderProps> = ({
  displayDate,
  frame = 0,
  totalFrames = 900,
  sentiment = 'neutral',
  width = 1080,
  format = 'mobile',
  session = 'full',
  hookText,
  timeString,
  marketTagline,
  insightItems = [],
}) => {
  const isTV = format === 'tv';
  const scale = isTV ? 1.2 : 1.55;
  const accent = sentimentGlow[sentiment] ?? CINE_COLORS.cyan;

  const totalMins = TOTAL_MINS[session] || 330;
  const progress = Math.min(1, Math.max(0, frame / Math.max(1, totalFrames)));
  const mins = Math.round(progress * totalMins);
  const clock = tradingMinsToClock(mins);
  const seconds = Math.round((progress * totalMins * 60) % 60);
  const timeStr = timeString ?? `${clock.h.toString().padStart(2, '0')}:${clock.m.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const getMarketPhase = () => {
    if (session === 'morning') {
      if (mins < 15) return { text: 'OPEN', color: '#fbbf24' };
      if (mins < 60) return { text: 'AM SESSION', color: '#4ade80' };
      return { text: 'AM CLOSE', color: CINE_COLORS.cyan };
    }
    if (mins < 15) return { text: 'OPEN', color: '#fbbf24' };
    if (mins < 60) return { text: 'AM SESSION', color: '#4ade80' };
    if (mins < 120) return { text: 'AM CLOSE', color: CINE_COLORS.cyan };
    if (mins < 150) return { text: 'BREAK', color: CINE_COLORS.inkDim };
    if (mins < 240) return { text: 'PM SESSION', color: '#4ade80' };
    if (mins < 315) return { text: 'CLOSING', color: CINE_COLORS.inflowLight };
    return { text: 'CLOSE', color: '#fbbf24' };
  };

  const phase = getMarketPhase();
  const livePulse = Math.sin(frame * 0.15) * 0.4 + 0.6;

  const titleChars = ['板', '块', '情', '绪', '流'];
  const visibleInsights = insightItems.filter((item) => item.value && item.value.trim()).slice(0, 3);

  const getInsightColor = (tone: HeaderInsightItem['tone']) => {
    switch (tone) {
      case 'positive':
        return CINE_COLORS.inflowLight;
      case 'negative':
        return CINE_COLORS.outflowLight;
      case 'focus':
        return CINE_COLORS.gold;
      default:
        return CINE_COLORS.inkBody;
    }
  };

  // ── GSAP-driven entrances ─────────────────────────────────
  // Title letters cascade in one-by-one; insight chips stagger after.
  const titleAnim = useGsapState(
    frame,
    (p, t, fps) => {
      t.fromTo(p, { title: 0 }, { title: 1, duration: 0.9 * fps / 30, ease: 'power4.out' }, 0.02 * fps / 30);
    },
    [],
  );
  const letterProgress = titleAnim.title ?? 0;

  const chipsAnim = useGsapState(
    frame,
    (p, t, fps) => {
      t.fromTo(p, { chips: 0 }, { chips: 1, duration: 0.8 * fps / 30, ease: 'power3.out' }, 0.6 * fps / 30);
    },
    [],
  );
  const chipsProgress = chipsAnim.chips ?? 0;

  const titlePerChar = 1 / titleChars.length;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width, zIndex: 10 }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${12 * scale}px ${24 * scale}px`,
          background: 'linear-gradient(180deg, rgba(5,9,16,0.95) 0%, rgba(5,9,16,0) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 * scale }}>
          <div
            style={{
              padding: `${2 * scale}px ${10 * scale}px`,
              borderRadius: 3,
              backgroundColor: `${accent}12`,
              border: `1px solid ${accent}33`,
              fontSize: 13 * scale,
              color: accent,
              fontWeight: 600,
              letterSpacing: 1,
              fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
              boxShadow: `0 0 18px ${accent}22`,
            }}
          >
            板块
          </div>

          <div
            style={{
              color: CINE_COLORS.inkBody,
              fontSize: 30 * scale,
              fontWeight: 600,
              letterSpacing: 3,
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              opacity: 0.92,
            }}
          >
            {displayDate}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 * scale }}>
          <div
            style={{
              color: CINE_COLORS.cyan,
              fontSize: 20 * scale,
              fontWeight: 500,
              fontFamily: '"Helvetica Neue", "SF Mono", monospace',
              letterSpacing: 2,
              textShadow: `0 0 14px ${CINE_COLORS.cyan}44`,
            }}
          >
            {timeStr}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6 * scale,
              padding: `${3 * scale}px ${10 * scale}px`,
              borderRadius: 4,
              backgroundColor: 'rgba(9,18,32,0.7)',
              border: `1px solid ${accent}33`,
              boxShadow: `0 0 16px ${accent}22`,
            }}
          >
            <div
              style={{
                width: 6 * scale,
                height: 6 * scale,
                borderRadius: '50%',
                backgroundColor: phase.color,
                boxShadow: `0 0 ${6 + livePulse * 6}px ${phase.color}`,
                opacity: livePulse,
              }}
            />
            <span style={{ color: phase.color, fontSize: 11 * scale, fontWeight: 600, letterSpacing: 2 }}>
              {phase.text}
            </span>
          </div>
        </div>
      </div>

      {/* Title area — letters cascade in like a news chyron */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${4 * scale}px 0 ${2 * scale}px 0`,
          background: 'linear-gradient(180deg, rgba(5,9,16,0.5) 0%, transparent 100%)',
          flexDirection: 'column',
          gap: 2 * scale,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {titleChars.map((char, i) => {
            const start = i * titlePerChar;
            const local = Math.max(0, Math.min(1, (letterProgress - start) / titlePerChar));
            const eased = CINE_EASE.expoOut(local);
            return (
              <span
                key={i}
                style={{
                  fontSize: 36 * scale,
                  fontWeight: 700,
                  letterSpacing: 2.6,
                  fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                  color: TITLE_COLORS[i],
                  opacity: eased,
                  transform: `translateY(${(1 - eased) * -22}px)`,
                  textShadow: `0 0 22px ${TITLE_COLORS[i]}55, 0 2px 8px rgba(0,0,0,0.5)`,
                }}
              >
                {char}
              </span>
            );
          })}
          <span
            style={{
              fontSize: 15 * scale,
              fontWeight: 400,
              color: CINE_COLORS.inkDim,
              marginLeft: 12 * scale,
              letterSpacing: 2,
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              opacity: easedTitleSuffix(letterProgress),
            }}
          >
            主力资金净流入（亿）
          </span>
        </div>
      </div>

      {/* Separator line */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accent}55, transparent)`, margin: `0 ${40 * scale}px`, opacity: letterProgress }} />

      {visibleInsights.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10 * scale,
            flexWrap: 'wrap',
            padding: `${10 * scale}px ${24 * scale}px 0`,
          }}
        >
          {visibleInsights.map((item, index) => {
            const valueColor = getInsightColor(item.tone);
            const chipStart = index * 0.16;
            const local = Math.max(0, Math.min(1, (chipsProgress - chipStart) / 0.16));
            const eased = CINE_EASE.quartOut(local);
            return (
              <div
                key={`${item.label}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8 * scale,
                  padding: `${6 * scale}px ${12 * scale}px`,
                  borderRadius: 999,
                  background: 'rgba(6, 14, 26, 0.66)',
                  border: `1px solid ${valueColor}2e`,
                  boxShadow: `0 8px 24px rgba(0,0,0,0.28), 0 0 14px ${valueColor}1a`,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  opacity: eased,
                  transform: `translateY(${(1 - eased) * 14}px) scale(${0.94 + 0.06 * eased})`,
                }}
              >
                <span style={{ fontSize: 11 * scale, color: CINE_COLORS.inkDim, letterSpacing: 1.4, fontWeight: 700, fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: 13 * scale, color: valueColor, letterSpacing: 0.6, fontWeight: 700, fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif', textShadow: `0 0 18px ${valueColor}33` }}>
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {hookText && frame < 110 && (
        <div
          style={{
            position: 'absolute',
            top: isTV ? '36%' : '42%',
            left: 0,
            right: 0,
            textAlign: 'center',
            transform: 'translateY(-50%)',
            zIndex: 20,
            padding: `0 ${isTV ? 80 : 40}px`,
          }}
        >
          {(() => {
            const enter = frame < 14 ? frame / 14 : 1;
            const exit = frame > 80 ? Math.max(0, (110 - frame) / 30) : 1;
            const pageant = Math.min(1, Math.max(0, (frame - 4) / 10));
            const baseOpacity = Math.min(1, enter * exit) * 0.94;
            const tagScale = 0.94 + 0.06 * pageant;
            return (
              <>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8 * scale,
                    padding: `${4 * scale}px ${12 * scale}px`,
                    borderRadius: 999,
                    background: `${accent}14`,
                    border: `1px solid ${accent}33`,
                    marginBottom: 16 * scale,
                    opacity: Math.min(1, enter * 1.1) * exit,
                    transform: `translateY(${(1 - pageant) * 8}px) scale(${0.96 + 0.04 * pageant})`,
                  }}
                >
                  <span style={{ width: 6 * scale, height: 6 * scale, borderRadius: '50%', background: accent, boxShadow: `0 0 ${10 + livePulse * 10}px ${accent}`, opacity: 0.6 + livePulse * 0.4 }} />
                  <span style={{ fontSize: isTV ? 13 * scale : 15 * scale, color: accent, fontWeight: 700, letterSpacing: 1.2, fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif' }}>
                    {phase.text} · 盘面资金焦点
                  </span>
                </div>
                <div
                  style={{
                    fontSize: isTV ? 32 * scale : 46 * scale,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.96)',
                    fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                    letterSpacing: isTV ? 1.4 : 1.8,
                    lineHeight: 1.28,
                    textShadow: `0 4px 18px rgba(0,0,0,0.65), 0 0 44px ${accent}22`,
                    maxWidth: isTV ? '72%' : '88%',
                    margin: '0 auto',
                    opacity: baseOpacity,
                    transform: `translateY(${(1 - pageant) * 18}px) scale(${tagScale})`,
                  }}
                >
                  {hookText}
                </div>
                <div
                  style={{
                    marginTop: isTV ? 20 * scale : 22 * scale,
                    fontSize: isTV ? 15 * scale : 18 * scale,
                    color: CINE_COLORS.inkBody,
                    fontWeight: 500,
                    fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                    letterSpacing: isTV ? 1.6 : 2,
                    opacity: baseOpacity * 0.82,
                    maxWidth: isTV ? '66%' : '82%',
                    marginInline: 'auto',
                  }}
                >
                  <span style={{ color: accent, fontWeight: 700, marginRight: 8 }}>结论先给你</span>
                  <span style={{ opacity: 0.88 }}>{marketTagline || '看懂盘面资金到底在抢什么'}</span>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {!hookText && frame < 90 && (
        <div
          style={{
            position: 'absolute',
            top: isTV ? 68 : 100,
            left: 0,
            right: 0,
            textAlign: 'center',
            opacity: Math.min(1, Math.max(0, (frame - 15) / 15)) * Math.min(1, Math.max(0, (75 - frame) / 15)),
            zIndex: 20,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              fontSize: isTV ? 13 * scale : 15 * scale,
              color: CINE_COLORS.inkDim,
              fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
              letterSpacing: 3,
              padding: `${4 * scale}px ${14 * scale}px`,
              borderRadius: 4,
              background: 'rgba(9,18,32,0.66)',
              border: '1px solid rgba(60,80,120,0.3)',
            }}
          >
            盘面主力流向概览
          </div>
        </div>
      )}
    </div>
  );
};

/** Suffix fades in after the 5 title letters have fully landed. */
function easedTitleSuffix(letterProgress: number): number {
  return Math.max(0, Math.min(1, (letterProgress - 0.9) / 0.1));
}