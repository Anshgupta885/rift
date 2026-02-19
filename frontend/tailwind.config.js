/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfaf5',
          100: '#f7f0e6',
          200: '#ede0cc',
          300: '#ddc9aa',
        },
        ink: {
          900: '#1a1410',
          800: '#2d2520',
          700: '#3d3430',
          600: '#5a4f48',
          500: '#7a6e66',
          400: '#9e9590',
        },
        amber: {
          warm: '#c8870a',
          light: '#e6a020',
          pale: '#f5d080',
        },
        rust: {
          600: '#c44a2a',
          500: '#d95e3a',
          400: '#e8754f',
          200: '#f5c4b2',
        },
        sage: {
          700: '#3a5a4a',
          500: '#5a8a6a',
          300: '#a0c4af',
          100: '#ddeee5',
        },
        stone: {
          warm: '#e8e0d8',
          mid: '#c8bfb5',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Lora', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-right': 'slideRight 0.4s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}