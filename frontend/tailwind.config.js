/** @type {import('tailwindcss').Config} */
export default {
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
      },
    },
  },
  plugins: [],
}
