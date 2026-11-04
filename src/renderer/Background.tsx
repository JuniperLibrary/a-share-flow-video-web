import React from 'react';
import { filmGrain } from './cinema.ts';

interface BackgroundProps {
  frame: number;
  totalFrames: number;
  sentiment?: 'bullish' | 'bearish' | 'neutral' | 'mainline';
  width?: number;
  height?: number;
  format?: 'mobile' | 'tv';
}

/** Deterministic hash → [0,1). */
function fract(n: number): number {
  return n - Math.floor(n);
}

/**
 * Apple-style atmosphere — no grid, no HUD, no scanline. Just deep dark
 * gradients + huge, ultra-soft color fields that drift imperceptibly slowly,
 * a few floating dust motes and a whisper of grain. The hero colors stay as
 * faint emotional undertones so the frame reads "premium" before "red/green".
 */
interface Atmosphere {
  wash: string[];
  tint: string;
}

function atmosphere(sentiment: BackgroundProps['sentiment']): Atmosphere {
  switch (sentiment) {
    case 'bearish':
      return {
        wash: ['rgba(43,214,123,0.07)', 'rgba(52,140,200,0.05)', 'rgba(20,40,60,0.10)'],
        tint: 'rgba(43,214,123,0.025)',
      };
    case 'bullish':
      return {
        wash: ['rgba(255,107,138,0.07)', 'rgba(255,196,120,0.06)', 'rgba(40,24,38,0.10)'],
        tint: 'rgba(255,77,79,0.025)',
      };
    case 'mainline':
      return {
        wash: ['rgba(245,198,72,0.09)', 'rgba(255,150,90,0.05)', 'rgba(48,40,24,0.10)'],
        tint: 'rgba(245,198,72,0.03)',
      };
    default:
      return {
        wash: ['rgba(105,150,240,0.08)', 'rgba(79,216,255,0.06)', 'rgba(30,40,70,0.10)'],
        tint: 'rgba(79,216,255,0.02)',
      };
  }
}

/** Deep near-black base with the faintest violet/indigo cast (Apple's night palette). */
function baseDeep(sentiment: BackgroundProps['sentiment']): string {
  switch (sentiment) {
    case 'bearish':
      return 'linear-gradient(180deg, #03040a 0%, #070d0d 48%, #0a1210 100%)';
    case 'bullish':
      return 'linear-gradient(180deg, #040308 0%, #0d0a0c 48%, #120c0e 100%)';
    case 'mainline':
      return 'linear-gradient(180deg, #040309 0%, #0e0c08 48%, #150f06 100%)';
    default:
      return 'linear-gradient(180deg, #030407 0%, #080b18 48%, #0b1020 100%)';
  }
}

/**
 * Huge, ultra-blurred color fields drifting on slow Lissajous paths.
 * Large enough to cover a quarter of the frame each, soft enough to feel like
 * studio light — never a blob, never a beam.
 */
const AtmosphereFields: React.FC<{
  frame: number;
  width: number;
  height: number;
  wash: string[];
}> = ({ frame, width, height, wash }) => {
  const t = frame / 30;
  const fields = [
    {
      x: width * (0.18 + 0.16 * Math.sin(t * 0.045 + 1.2)),
      y: height * (0.16 + 0.12 * Math.sin(t * 0.06)),
      r: Math.max(width, height) * 0.55,
      color: wash[0],
      o: 1,
      blur: 90,
    },
    {
      x: width * (0.82 + 0.14 * Math.cos(t * 0.05)),
      y: height * (0.62 + 0.16 * Math.sin(t * 0.048 + 2.4)),
      r: Math.max(width, height) * 0.5,
      color: wash[1],
      o: 0.85,
      blur: 90,
    },
    {
      x: width * 0.5 + width * 0.1 * Math.sin(t * 0.033),
      y: height * 0.42 + height * 0.1 * Math.cos(t * 0.04 + 0.8),
      r: Math.max(width, height) * 0.7,
      color: wash[2],
      o: 0.5,
      blur: 110,
    },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {fields.map((f, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: f.x - f.r / 2,
            top: f.y - f.r / 2,
            width: f.r,
            height: f.r,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${f.color} 0%, transparent 68%)`,
            opacity: f.o,
            filter: `blur(${f.blur}px)`,
            transform: `scale(${1 + 0.03 * Math.sin(t * 0.02 + i)})`,
          }}
        />
      ))}
    </div>
  );
};

/** A few floating dust motes — sparse, tiny, barely-lit. Apple's "breathing room". */
const Dust: React.FC<{ frame: number; width: number; height: number; count?: number }> = ({
  frame,
  width,
  height,
  count = 22,
}) => {
  const t = frame / 30;
  const motes = Array.from({ length: count }, (_, i) => {
    const seed = i * 137.508;
    const x = width * (0.08 + 0.84 * fract(Math.sin(i * 12.9898) * 43758.5453));
    const y = height * fract(Math.sin(i * 78.233) * 12543.6657);
    const drift = 0.02 + 0.03 * Math.abs(Math.sin(seed));
    const r = 1.2 + 0.9 * fract(Math.sin(i * 39.1) * 987.5);
    const opacity = 0.08 + 0.14 * fract(Math.sin(seed + 7.7) * 741.3);
    return {
      x: x + Math.sin(t * drift + seed * 3) * width * 0.03,
      y: y + Math.cos(t * drift * 0.8 + seed) * height * 0.02,
      r,
      opacity,
      color: i % 3 === 0 ? 'rgba(220,230,255,0.7)' : 'rgba(255,214,170,0.6)',
    };
  });

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {motes.map((m, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: m.x,
            top: m.y,
            width: m.r,
            height: m.r,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${m.color} 0%, transparent 70%)`,
            opacity: m.opacity,
            filter: 'blur(0.6px)',
          }}
        />
      ))}
    </div>
  );
};

/** Soft ground reflection — a faint upward wash that grounds the subject. */
const GroundReflect: React.FC<{ width: number; height: number; bottom: string }> = ({ width, height, bottom }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        width,
        height: height * 0.3,
        background: `linear-gradient(0deg, ${bottom} 0%, transparent 60%)`,
        filter: 'blur(24px)',
        pointerEvents: 'none',
      }}
    />
  );
};

export const Background: React.FC<BackgroundProps> = ({
  frame,
  totalFrames,
  sentiment = 'neutral',
  width = 1080,
  height = 1920,
  format,
}) => {
  void totalFrames;
  void format;
  const { wash, tint } = atmosphere(sentiment);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        overflow: 'hidden',
        background: baseDeep(sentiment),
      }}
    >
      {/* near-black atmosphere fields — the heart of the look */}
      <AtmosphereFields frame={frame} width={width} height={height} wash={wash} />

      {/* faint sentiment undertone */}
      <div style={{ position: 'absolute', inset: 0, background: tint }} />

      {/* breathing dust */}
      <Dust frame={frame} width={width} height={height} />

      {/* ambient ground light */}
      <GroundReflect width={width} height={height} bottom={wash[0]} />

      {/* gentle vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(150% 120% at 50% 42%, transparent 52%, rgba(0,0,0,0.12) 74%, rgba(0,0,0,0.38) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* whisper of grain */}
      <div style={{ position: 'absolute', inset: 0, ...filmGrain() }} />
    </div>
  );
};