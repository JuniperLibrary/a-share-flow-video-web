/**
 * Design system tokens.
 * Static values for chart libraries that need stable hex colors.
 * For theme-aware values, use getThemeTokens().
 */

export const tokens = {
  canvas: '#0a1628',
  surface: {
    1: '#0d1f3c',
    2: '#1a3a5c',
    3: '#2a4a6c',
  },
  ink: {
    DEFAULT: '#ffffff',
    2: '#b0b8c4',
    3: '#86909c',
    muted: 'rgba(255, 255, 255, 0.30)',
  },
  hairline: {
    DEFAULT: 'rgba(255, 255, 255, 0.06)',
    strong: 'rgba(255, 255, 255, 0.10)',
    active: 'rgba(255, 255, 255, 0.18)',
  },
  primary: {
    DEFAULT: '#00d4ff',
    hover: '#33ddff',
    soft: 'rgba(0, 212, 255, 0.15)',
    softer: 'rgba(0, 212, 255, 0.10)',
    ink: '#0a1628',
  },
  // Chinese-market convention: red = inflow/up/positive, green = outflow/down/negative.
  // Do not flip these under any context.
  inflow: {
    DEFAULT: '#f53f3f',
    light: '#ff7875',
    muted: 'rgba(245, 63, 63, 0.15)',
    softer: 'rgba(245, 63, 63, 0.05)',
    rgb: '245, 63, 63',
  },
  outflow: {
    DEFAULT: '#00b42a',
    light: '#30c64a',
    muted: 'rgba(0, 180, 42, 0.15)',
    softer: 'rgba(0, 180, 42, 0.05)',
    rgb: '0, 180, 42',
  },
  warning: '#f0ab00',
  info: '#4488ff',
  chart: {
    1: '#00d4ff',
    2: '#f53f3f',
    3: '#00b42a',
    4: '#ff7d00',
    5: '#7c3aed',
    6: '#14b8a6',
  },
} as const;

export type Tokens = typeof tokens;

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function getThemeTokens() {
  return {
    canvas: cssVar('--canvas'),
    surface: {
      1: cssVar('--surface-1'),
      2: cssVar('--surface-2'),
      3: cssVar('--surface-3'),
    },
    ink: {
      DEFAULT: cssVar('--ink'),
      2: cssVar('--ink-2'),
      3: cssVar('--ink-3'),
      muted: cssVar('--ink-muted'),
    },
    hairline: {
      DEFAULT: cssVar('--hairline'),
      strong: cssVar('--hairline-strong'),
      active: cssVar('--hairline-active'),
    },
    primary: {
      DEFAULT: cssVar('--chart-1'),
      soft: cssVar('--primary-soft'),
      softer: cssVar('--primary-softer'),
      ink: cssVar('--primary-ink'),
    },
    inflow: {
      DEFAULT: cssVar('--inflow'),
      light: cssVar('--inflow-light'),
      muted: cssVar('--inflow-muted'),
      softer: cssVar('--inflow-softer'),
    },
    outflow: {
      DEFAULT: cssVar('--outflow'),
      light: cssVar('--outflow-light'),
      muted: cssVar('--outflow-muted'),
      softer: cssVar('--outflow-softer'),
    },
    warning: cssVar('--warning'),
    info: cssVar('--info'),
    chart: {
      1: cssVar('--chart-1'),
      2: cssVar('--chart-2'),
      3: cssVar('--chart-3'),
      4: cssVar('--chart-4'),
      5: cssVar('--chart-5'),
      6: cssVar('--chart-6'),
    },
  };
}
