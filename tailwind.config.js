/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        skoczek: {
          bg: '#ffffff',
          card: '#ffffff',
          text: '#111111',
          primary: '#ff5a00',
          primaryHover: '#e04f00',
          light: '#fff7ed',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
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
};
