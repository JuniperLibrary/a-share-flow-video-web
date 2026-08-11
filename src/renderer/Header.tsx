import React from 'react';

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

  const totalMins = TOTAL_MINS[session] || 330;
  const progress = frame / totalFrames;
  const mins = Math.round(progress * totalMins);
  const clock = tradingMinsToClock(mins);
  const seconds = Math.round((progress * totalMins * 60) % 60);
  const timeStr = timeString ?? `${clock.h.toString().padStart(2, '0')}:${clock.m.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const getMarketPhase = () => {
    if (session === 'morning') {
      if (mins < 15) return { text: 'OPEN', color: '#fbbf24' };
      if (mins < 60) return { text: 'AM SESSION', color: '#4ade80' };
      return { text: 'AM CLOSE', color: '#4a80d0' };
    }
    if (mins < 15) return { text: 'OPEN', color: '#fbbf24' };
    if (mins < 60) return { text: 'AM SESSION', color: '#4ade80' };
    if (mins < 120) return { text: 'AM CLOSE', color: '#4a80d0' };
    if (mins < 150) return { text: 'BREAK', color: '#8899aa' };
    if (mins < 240) return { text: 'PM SESSION', color: '#4ade80' };
    if (mins < 315) return { text: 'CLOSING', color: '#f87171' };
    return { text: 'CLOSE', color: '#fbbf24' };
  };

  const phase = getMarketPhase();
  const sentimentColor = sentiment === 'bullish' ? '#4ade80' : sentiment === 'bearish' ? '#f87171' : sentiment === 'mainline' ? '#FFD700' : '#8899aa';
  const livePulse = Math.sin(frame * 0.15) * 0.4 + 0.6;

  const titleColors = ['#f87171', '#fb923c', '#fbbf24', '#4ade80', '#2dd4bf'];
  const titleChars = ['板', '块', '情', '绪', '流'];
  const visibleInsights = insightItems.filter((item) => item.value && item.value.trim()).slice(0, 3);

  const getInsightColor = (tone: HeaderInsightItem['tone']) => {
    switch (tone) {
      case 'positive':
        return '#86efac';
      case 'negative':
        return '#fda4af';
      case 'focus':
        return '#fde68a';
      default:
        return '#cbd5e1';
    }
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width, zIndex: 10 }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${12 * scale}px ${24 * scale}px`,
          background: 'linear-gradient(180deg, rgba(10,15,24,0.95) 0%, rgba(10,15,24,0) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 * scale }}>
          <div
            style={{
              padding: `${2 * scale}px ${10 * scale}px`,
              borderRadius: 3,
              backgroundColor: `${sentimentColor}12`,
              border: `1px solid ${sentimentColor}33`,
              fontSize: 13 * scale,
              color: sentimentColor,
              fontWeight: 600,
              letterSpacing: 1,
              fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            }}
          >
            板块
          </div>

          <div
            style={{
              color: '#8899aa',
              fontSize: 30 * scale,
              fontWeight: 600,
              letterSpacing: 3,
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              opacity: 0.9,
            }}
          >
            {displayDate}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 * scale }}>
          <div
            style={{
              color: '#4a80d0',
              fontSize: 20 * scale,
              fontWeight: 500,
              fontFamily: '"Helvetica Neue", "SF Mono", monospace',
              letterSpacing: 2,
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
              backgroundColor: '#0f1922',
              border: '1px solid #1e3a5f',
            }}
          >
            <div
              style={{
                width: 6 * scale,
                height: 6 * scale,
                borderRadius: '50%',
                backgroundColor: sentimentColor,
                boxShadow: `0 0 ${6 + livePulse * 6}px ${sentimentColor}`,
                opacity: livePulse,
              }}
            />
            <span style={{ color: sentimentColor, fontSize: 11 * scale, fontWeight: 600, letterSpacing: 2 }}>
              {phase.text}
            </span>
          </div>
        </div>
      </div>

      {/* Title area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${4 * scale}px 0 ${2 * scale}px 0`,
          background: 'linear-gradient(180deg, rgba(10,15,24,0.5) 0%, transparent 100%)',
          flexDirection: 'column',
          gap: 2 * scale,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {titleChars.map((char, i) => (
            <span
              key={i}
              style={{
                fontSize: 36 * scale,
                fontWeight: 700,
                letterSpacing: 2.6,
                fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                color: titleColors[i],
                textShadow: `0 0 20px ${titleColors[i]}44, 0 2px 8px rgba(0,0,0,0.5)`,
              }}
            >
              {char}
            </span>
          ))}
          <span
            style={{
              fontSize: 15 * scale,
              fontWeight: 400,
              color: '#556677',
              marginLeft: 12 * scale,
              letterSpacing: 2,
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
            }}
          >
            主力资金净流入（亿）
          </span>
        </div>
      </div>

      {/* Separator line */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #2a3550, transparent)', margin: `0 ${40 * scale}px` }} />

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
            return (
              <div
                key={`${item.label}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8 * scale,
                  padding: `${6 * scale}px ${12 * scale}px`,
                  borderRadius: 999,
                  background: 'rgba(10, 20, 34, 0.58)',
                  border: `1px solid ${valueColor}26`,
                  boxShadow: '0 8px 22px rgba(0,0,0,0.16)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                }}
              >
                <span
                  style={{
                    fontSize: 11 * scale,
                    color: '#7f8ea3',
                    letterSpacing: 1.4,
                    fontWeight: 700,
                    fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: 13 * scale,
                    color: valueColor,
                    letterSpacing: 0.6,
                    fontWeight: 700,
                    fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                    textShadow: `0 0 18px ${valueColor}22`,
                  }}
                >
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
                    background: `${sentimentColor}14`,
                    border: `1px solid ${sentimentColor}33`,
                    marginBottom: 16 * scale,
                    opacity: Math.min(1, enter * 1.1) * exit,
                    transform: `translateY(${(1 - pageant) * 8}px) scale(${0.96 + 0.04 * pageant})`,
                  }}
                >
                  <span
                    style={{
                      width: 6 * scale,
                      height: 6 * scale,
                      borderRadius: '50%',
                      background: sentimentColor,
                      boxShadow: `0 0 ${10 + livePulse * 10}px ${sentimentColor}`,
                      opacity: 0.6 + livePulse * 0.4,
                    }}
                  />
                  <span
                    style={{
                      fontSize: isTV ? 13 * scale : 15 * scale,
                      color: sentimentColor,
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                    }}
                  >
                    {phase.text} · 今日资金焦点
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
                    textShadow: `0 4px 18px rgba(0,0,0,0.65), 0 0 44px ${sentimentColor}22`,
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
                    color: '#cbd5e1',
                    fontWeight: 500,
                    fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
                    letterSpacing: isTV ? 1.6 : 2,
                    opacity: baseOpacity * 0.82,
                    maxWidth: isTV ? '66%' : '82%',
                    marginInline: 'auto',
                  }}
                >
                  <span style={{ color: sentimentColor, fontWeight: 700, marginRight: 8 }}>结论先给你</span>
                  <span style={{ opacity: 0.88 }}>{marketTagline || '看懂今天资金到底在抢什么'}</span>
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
              color: '#8899aa',
              fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
              letterSpacing: 3,
              padding: `${4 * scale}px ${14 * scale}px`,
              borderRadius: 4,
              background: 'rgba(15,25,40,0.6)',
              border: '1px solid rgba(60,80,120,0.3)',
            }}
          >
            今日主力流向概览
          </div>
        </div>
      )}
    </div>
  );
};
