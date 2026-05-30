/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          black: '#000000',
          dark: '#1a1a1a',
          darker: '#0a0a0a',
        },
        accent: {
          red: '#dc2626',
          'red-light': '#ef4444',
          'red-lighter': '#f87171',
          'red-dark': '#b91c1c',
        },
        /* New SaaS landing tokens */
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        surface: {
          0: '#ffffff',
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          800: '#111111',
          850: '#0d0d0d',
          900: '#0a0a0a',
          950: '#070707',
        },
        muted: {
          DEFAULT: '#a1a1aa',
          light: '#71717a',
          dark: '#52525b',
        },
      },
      fontFamily: {
        clash: ['"Clash Display"', '"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        inter: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      animation: {
        'float-slow': 'floatSlow 6s ease-in-out infinite alternate',
        'float-slower': 'floatSlower 8s ease-in-out infinite alternate',
        'fade-in-up': 'fadeInUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards',
        'count-up': 'countPulse 0.6s ease-out',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'marquee': 'marqueeScroll 35s linear infinite',
        'marquee-slow': 'marqueeScroll 50s linear infinite',
        'glow-pulse': 'glowPulse 2s infinite alternate',
      },
      keyframes: {
        floatSlow: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(0, -12px, 0)' },
        },
        floatSlower: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(0, -8px, 0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        countPulse: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
