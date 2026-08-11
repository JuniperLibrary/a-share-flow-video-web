import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { Background } from './Background.tsx';

interface FarewellSceneProps {
  displayDate: string;
  width: number;
  height: number;
  format: 'mobile' | 'tv';
  totalFrames: number;
  sentiment?: 'bullish' | 'bearish' | 'neutral' | 'mainline';
  blessingText?: string;
  signoffText?: string;
}

const fontFamily = '"PingFang SC", "Helvetica Neue", sans-serif';

const DEFAULT_BLESSING_POOL = [
  '愿你明天出手都踩在节奏上，持仓稳稳抬轿',
  '祝愿持仓长阳，账户净值步步抬升',
  '祝你交易顺利，看准的方向都能走出延续',
  '愿你明天下单即逢低，卖飞不回头',
  '愿你行情稳稳，账户新高，每天好心情',
];

const DEFAULT_SIGNOFF_POOL = [
  '明天开盘见！',
  '明天我们盘中再见！',
  '明天开盘，不见不散！',
  '祝好，明天见！',
];

function pickByDate<T>(pool: T[], seed: string): T {
  if (pool.length === 0) {
    throw new Error('pool is empty');
  }
  let sum = 0;
  for (let i = 0; i < seed.length; i++) {
    sum = (sum * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return pool[sum % pool.length];
}

export const FarewellScene: React.FC<FarewellSceneProps> = ({
  displayDate,
  width,
  height,
  format,
  totalFrames,
  sentiment = 'mainline',
  blessingText,
  signoffText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isTV = format === 'tv';
  const duration = Math.max(1, totalFrames);

  const blessing = blessingText || pickByDate(DEFAULT_BLESSING_POOL, displayDate + '-blessing');
  const signoff = signoffText || pickByDate(DEFAULT_SIGNOFF_POOL, displayDate + '-signoff');

  const fadeInFrames = Math.min(Math.round(fps * 0.5), Math.max(6, Math.floor(duration * 0.12)));
  const fadeOutFrames = Math.min(Math.round(fps * 0.7), Math.max(10, Math.floor(duration * 0.22)));
  const holdStart = fadeInFrames;
  const holdEnd = Math.max(holdStart + 2, duration - fadeOutFrames);

  const baseOpacity = interpolate(frame, [0, fadeInFrames, holdEnd, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const peak = interpolate(frame, [0, Math.min(fadeInFrames + 20, duration - fadeOutFrames - 1), duration], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cardEnter = Math.min(1, frame / Math.max(1, Math.round(fadeInFrames * 1.1)));
  const translateY = interpolate(cardEnter, [0, 1], [28, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const cardScale = interpolate(cardEnter, [0, 1], [0.96, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.2)) });

  const accentColor =
    sentiment === 'bullish'
      ? '#ef4444'
      : sentiment === 'bearish'
        ? '#22c55e'
        : '#60a5fa';

  const titleText = isTV ? '今天就聊到这里' : '今天就聊到这里';
  const subText = blessing;
  const signText = signoff;

  return (
    <AbsoluteFill style={{ width, height, pointerEvents: 'none' }}>
      <Background frame={frame} totalFrames={duration} sentiment={sentiment} width={width} height={height} format={format} />

      <AbsoluteFill
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: baseOpacity,
          zIndex: 30,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: isTV ? Math.floor(width * 0.58) : Math.floor(width * 0.86),
            padding: isTV ? '42px 58px' : '44px 34px',
            borderRadius: 24,
            border: `1px solid rgba(170, 210, 255, ${0.14 + 0.1 * peak})`,
            background:
              'linear-gradient(180deg, rgba(10,20,40,0.74) 0%, rgba(8,14,28,0.82) 100%)',
            boxShadow: `0 30px 80px rgba(0,0,0,0.55), 0 0 ${Math.round(30 + 40 * peak)}px rgba(120, 180, 255, ${0.08 + 0.08 * peak})`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            transform: `translateY(${translateY}px) scale(${cardScale})`,
            fontFamily,
            textAlign: 'center' as const,
            color: '#f8fafc',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 24,
              pointerEvents: 'none',
              background:
                'radial-gradient(circle at 50% 0%, rgba(170,210,255,0.22) 0%, rgba(170,210,255,0.05) 40%, rgba(170,210,255,0) 75%)',
              opacity: 0.6 + 0.4 * peak,
            }}
          />

          <div
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: isTV ? '8px 22px' : '8px 18px',
              borderRadius: 999,
              fontSize: isTV ? 20 : 22,
              fontWeight: 700,
              letterSpacing: isTV ? 2.5 : 3,
              color: '#cbd5e1',
              background: 'rgba(148, 163, 184, 0.08)',
              border: '1px solid rgba(148, 163, 184, 0.16)',
              marginBottom: isTV ? 22 : 24,
            }}
          >
            <span
              style={{
                width: isTV ? 8 : 9,
                height: isTV ? 8 : 9,
                borderRadius: 999,
                background: accentColor,
                boxShadow: `0 0 14px ${accentColor}aa`,
                display: 'inline-block',
              }}
            />
            {displayDate} · 告别仪式
          </div>

          <div
            style={{
              position: 'relative',
              fontSize: isTV ? 54 : 64,
              fontWeight: 800,
              letterSpacing: isTV ? 3 : 4,
              lineHeight: 1.15,
              marginBottom: isTV ? 16 : 20,
              textShadow: `0 10px 40px rgba(0,0,0,0.7), 0 0 24px ${accentColor}22`,
            }}
          >
            {titleText}
          </div>

          <div
            style={{
              position: 'relative',
              width: isTV ? 160 : 200,
              height: 3,
              margin: '0 auto',
              borderRadius: 999,
              background: `linear-gradient(90deg, rgba(170,210,255,0) 0%, ${accentColor}cc 50%, rgba(170,210,255,0) 100%)`,
              opacity: 0.6 + 0.4 * peak,
              marginBottom: isTV ? 26 : 28,
            }}
          />

          <div
            style={{
              position: 'relative',
              fontSize: isTV ? 30 : 34,
              fontWeight: 700,
              letterSpacing: isTV ? 1.6 : 2,
              lineHeight: 1.45,
              color: '#e5efff',
              textShadow: '0 6px 24px rgba(0,0,0,0.65)',
              marginBottom: isTV ? 14 : 16,
              padding: isTV ? '0 12px' : '0 4px',
            }}
          >
            {subText}
          </div>

          <div
            style={{
              position: 'relative',
              fontSize: isTV ? 34 : 40,
              fontWeight: 800,
              letterSpacing: isTV ? 2.8 : 3.5,
              color: accentColor,
              textShadow: `0 6px 26px rgba(0,0,0,0.7), 0 0 22px ${accentColor}55`,
            }}
          >
            {signText}
          </div>

          <div
            style={{
              position: 'relative',
              marginTop: isTV ? 28 : 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isTV ? 22 : 18,
              opacity: 0.9,
            }}
          >
            <HandWaveEmoji peak={peak} size={isTV ? 44 : 54} />
            <span
              style={{
                fontSize: isTV ? 22 : 26,
                fontWeight: 700,
                letterSpacing: 2,
                color: '#dbeafe',
              }}
            >
              感谢收看 · 点赞收藏 · 明天再战
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const HandWaveEmoji: React.FC<{ peak: number; size?: number }> = ({ peak, size = 48 }) => {
  const frame = useCurrentFrame();
  const waveT = (frame / 8) % (Math.PI * 2);
  const wave = Math.sin(waveT) * (0.08 + 0.04 * peak);
  return (
    <div
      style={{
        width: size,
        height: size,
        transformOrigin: '70% 85%',
        transform: `rotate(${(wave * 180) / Math.PI}deg) scale(${1 + 0.04 * peak})`,
        filter: `drop-shadow(0 6px 18px rgba(0,0,0,0.55))`,
      }}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id="farewell-hand" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
        </defs>
        <path
          d="M18 34
             C15 28 16 20 22 20
             C24 16 30 15 32 20
             C33 14 40 14 41 20
             C44 15 50 18 49 25
             L52 32
             C56 40 50 48 43 50
             C40 54 32 55 27 51
             C21 52 16 48 15 42
             Z"
          fill="url(#farewell-hand)"
          stroke="#1e293b"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M21 27 C22 24 25 23 27 26
             M31 23 C32 21 35 21 36 25
             M39 24 C40 22 43 23 43 27"
          stroke="#1e293b"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default FarewellScene;
