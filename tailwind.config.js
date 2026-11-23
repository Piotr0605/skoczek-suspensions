/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Archivo: industrial grotesque for the whole interface.
        // IBM Plex Mono: technical labels, section numbers and prices.
        sans: ['Archivo', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        skoczek: {
          bg: '#ffffff',
          card: '#ffffff',
          text: '#101418',
          primary: '#ff5a00',
          primaryHover: '#d94c00',
          light: '#fff4ec',
        },
        // The whole UI runs on one cool graphite ramp. `gray` is remapped to it
        // as well, so every existing gray-* class picks up the new neutrals.
        gray: {
          50: '#f5f6f8',
          100: '#e8ebee',
          200: '#d7dbe0',
          300: '#b4bac2',
          400: '#848c97',
          500: '#5c646f',
          600: '#454d58',
          700: '#2c333c',
          800: '#1b2026',
          900: '#101418',
          950: '#0a0d10',
        },
        ink: {
          DEFAULT: '#101418',
          900: '#101418',
          800: '#1b2026',
          700: '#2c333c',
          600: '#454d58',
          500: '#5c646f',
          400: '#848c97',
          300: '#b4bac2',
          200: '#d7dbe0',
          100: '#e8ebee',
          50: '#f5f6f8',
        },
        line: {
          DEFAULT: '#e1e5ea',
          strong: '#c9cfd6',
        },
      },
      borderRadius: {
        // Near-square geometry; nothing in the UI is pill-shaped.
        none: '0',
        DEFAULT: '2px',
        sm: '2px',
        md: '3px',
        lg: '3px',
        xl: '3px',
        '2xl': '3px',
        full: '2px',
      },
      boxShadow: {
        // Flat by design: only the sticky header gets a hairline separation.
        none: 'none',
        sm: '0 1px 0 0 rgba(16, 20, 24, 0.06)',
        DEFAULT: '0 1px 0 0 rgba(16, 20, 24, 0.06)',
        md: '0 1px 0 0 rgba(16, 20, 24, 0.06)',
        lg: '0 1px 0 0 rgba(16, 20, 24, 0.08)',
        xl: '0 1px 0 0 rgba(16, 20, 24, 0.08)',
        '2xl': '0 1px 0 0 rgba(16, 20, 24, 0.10)',
        inner: 'none',
      },
      letterSpacing: {
        tightest: '-0.035em',
        tighter: '-0.025em',
        tight: '-0.015em',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'slide-up': 'slideUp 0.35s ease-out',
        'fade-in': 'fadeIn 0.25s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
