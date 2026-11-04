/**
 * Cinematic visual tokens for the tick video renderer.
 * Blends the DESIGN.md dark financial-terminal palette with film-grade
 * lighting, camera language and GSAP-native easing curves.
 */
import { Easing } from 'remotion';
import type { CSSProperties } from 'react';

/** GSAP ease names mapped onto Remotion Easing so timeline + frame model stay in sync. */
export const CINE_EASE = {
  /** power4.out — authoritative deceleration, used for big entrances. */
  quartOut: Easing.bezier(0.25, 1, 0.5, 1),
  /** expo.out — theatrical, used for hero reveals. */
  expoOut: Easing.bezier(0.16, 1, 0.3, 1),
  /** power3.inOut — cinematic pacing for held elements. */
  cubicInOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** soft flicker, film plate. */
  sineInOut: Easing.bezier(0.37, 0, 0.63, 1),
} as const;

/** Base layer colors — deeper than DESIGN.md canvas for film depth. */
export const CINE_COLORS = {
  canvasDeep: '#04070d',
  canvas: '#071019',
  canvasRaised: '#0b1726',
  panel: 'rgba(9, 18, 32, 0.72)',
  panelSolid: '#0a1424',
  hairline: 'rgba(120, 160, 210, 0.16)',
  hairlineSoft: 'rgba(120, 160, 210, 0.08)',
  gold: '#f5c648',
  goldSoft: 'rgba(245, 198, 72, 0.16)',
  cyan: '#4fd8ff',
  cyanSoft: 'rgba(79, 216, 255, 0.16)',
  inkHigh: '#f7fbff',
  inkBody: '#cfe0f2',
  inkDim: '#6f87a3',
  /** A股 convention: inflow red = 涨/净流入, outflow green = 跌/净流出. */
  inflow: '#ff4d4f',
  inflowLight: '#ff8787',
  outflow: '#2bd67b',
  outflowLight: '#63e6ab',
} as const;

/** Film-anamorphic-style light leak gradient string. */
export const filmLeak = (color: string, opacity = 0.5): string =>
  `radial-gradient(120% 90% at 50% -15%, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 58%), radial-gradient(90% 70% at 85% 120%, ${color}${Math.round(opacity * 0.4 * 255).toString(16).padStart(2, '0')} 0%, transparent 55%)`;

/** Subtle film grain overlay — one SVG data-uri used by Background. */
export const filmGrain = (): CSSProperties => ({
  backgroundImage:
    'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/></filter><rect width=\'160\' height=\'160\' filter=\'url(%23n)\' opacity=\'0.42\'/></svg>")',
  opacity: 0.05,
  mixBlendMode: 'overlay',
});

/** Camera shake for a hard hit (translate in px). */
export const cameraHit = (t: number): { x: number; y: number } => ({
  x: Math.sin(t * 31.7) * (1 - t) * 6,
  y: Math.cos(t * 27.1) * (1 - t) * 5,
});

/** Number locker → tabular display with mono feel. */
export const tabularMono = (size: number) =>
  ({
    fontFamily: '"JetBrains Mono", "SF Mono", monospace, "PingFang SC"',
    fontSize: size,
    fontVariantNumeric: 'tabular-nums',
  }) as const;