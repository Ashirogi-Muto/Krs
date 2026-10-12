import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/payload/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        krs: {
          dark: '#080c14',
          surface: '#0d1527',
          card: '#111c34',
          border: '#1f2e52',
          cyan: '#06b6d4',
          cyanGlow: '#22d3ee',
          amber: '#f59e0b',
          muted: '#94a3b8',
        },
        aurix: {
          dark: '#0a0a0f',
          surface: '#13131d',
          card: '#1a1a29',
          border: '#2a2a42',
          orange: '#f97316',
          orangeGlow: '#fb923c',
          red: '#ef4444',
          emerald: '#10b981',
          gold: '#eab308',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
        display: ['var(--font-space-grotesk)', 'sans-serif'],
        cinzel: ['var(--font-cinzel)', 'serif'],
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
        'radial-gradient': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'grid-sm': '24px 24px',
        'grid-md': '32px 32px',
      },
    },
  },
  plugins: [],
}

export default config
