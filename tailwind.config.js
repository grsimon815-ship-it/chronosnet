/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        serenity: {
          bg: '#0a0b0e',
          panel: '#12131a',
          surface: '#161822',
          surfaceLight: '#1d202e',
          border: '#1f212c',
          borderHover: '#2e3245',
          textMuted: '#858b9f',
          textMain: '#e2e5ec',
          accent: '#7c3aed', // Amethyst
          accentHover: '#6d28d9',
          accentGlow: 'rgba(124, 58, 237, 0.25)',
          cyan: '#38bdf8', // Neon Cyan
          cyanGlow: 'rgba(56, 189, 248, 0.25)',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Consolas', 'monospace']
      },
      boxShadow: {
        'glow-amethyst': '0 0 20px -3px rgba(124, 58, 237, 0.35)',
        'glow-cyan': '0 0 20px -3px rgba(56, 189, 248, 0.35)',
        'glow-rose': '0 0 20px -3px rgba(244, 63, 94, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'laser': 'laser 2s linear infinite',
      },
      keyframes: {
        laser: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
};
