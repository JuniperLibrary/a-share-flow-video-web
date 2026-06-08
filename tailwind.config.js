/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
    './src/**/*.css',
  ],
  theme: {
    extend: {
      colors: {
        // Shadcn base layer (kept for backward compatibility with imported primitives)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        canvas: 'var(--canvas)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',

        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        'ink-muted': 'var(--ink-muted)',

        hairline: 'var(--hairline)',
        'hairline-strong': 'var(--hairline-strong)',
        'hairline-active': 'var(--hairline-active)',

        'primary-soft': 'var(--primary-soft)',
        'primary-softer': 'var(--primary-softer)',
        'primary-ink': 'var(--primary-ink)',

        // Inflow (red) and outflow (green) follow the Chinese-market convention
        // (red = inflow/up/positive) — opposite of Western markets. Do not flip.
        inflow: {
          DEFAULT: 'var(--inflow)',
          light: 'var(--inflow-light)',
          muted: 'var(--inflow-muted)',
          softer: 'var(--inflow-softer)',
        },
        outflow: {
          DEFAULT: 'var(--outflow)',
          light: 'var(--outflow-light)',
          muted: 'var(--outflow-muted)',
          softer: 'var(--outflow-softer)',
        },

        warning: {
          DEFAULT: 'var(--warning)',
          soft: 'var(--warning-soft)',
        },
        info: 'var(--info)',

        'chart-1': 'var(--chart-1)',
        'chart-2': 'var(--chart-2)',
        'chart-3': 'var(--chart-3)',
        'chart-4': 'var(--chart-4)',
        'chart-5': 'var(--chart-5)',
        'chart-6': 'var(--chart-6)',

        // Backward-compat aliases for the legacy `financial-*` names.
        'financial-cyan': 'var(--chart-1)',
        'financial-blue': 'var(--info)',
        'financial-purple': 'var(--chart-5)',
        'financial-gold': 'var(--warning)',
        'financial-teal': 'var(--chart-6)',
        'financial-indigo': 'var(--chart-5)',
        'financial-rose': 'var(--inflow)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'monospace'],
        display: ['"Plus Jakarta Sans"', '"PingFang SC"', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(0, 212, 255, 0.15)',
        'glow-danger': '0 0 20px rgba(245, 63, 63, 0.15)',
        'glow-success': '0 0 20px rgba(0, 180, 42, 0.15)',
        'glow-warning': '0 0 20px rgba(240, 171, 0, 0.15)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.3)',
        bento: '0 4px 24px rgba(0, 0, 0, 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'dashboard-grid':
          'linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-sm': '20px 20px',
        'grid-lg': '40px 40px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'tick-flash': 'tick-flash 1.5s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'tick-flash': {
          '0%': { backgroundColor: 'rgba(255,255,255,0.12)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
};
