/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        primary: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        surface: {
          light: '#fafafa',
          dark: '#0c0c0f',
        },
      },
      borderRadius: {
        none: '0',
        sm: '0.375rem',
        DEFAULT: '0.625rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        // Fine, low-contrast shadows — Linear/Vercel style
        xs: '0 1px 2px 0 rgb(9 9 11 / 0.04)',
        soft: '0 1px 3px 0 rgb(9 9 11 / 0.06), 0 1px 2px -1px rgb(9 9 9 / 0.04)',
        pop: '0 4px 24px -4px rgb(9 9 11 / 0.12), 0 2px 8px -2px rgb(9 9 11 / 0.06)',
        overlay: '0 24px 64px -12px rgb(9 9 11 / 0.28)',
        glow: '0 0 0 1px rgb(9 9 11 / 0.05)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'fade-out': { from: { opacity: 1 }, to: { opacity: 0 } },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        'slide-up-fade': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'fade-out': 'fade-out 0.18s ease-in',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-out-right': 'slide-out-right 0.25s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'slide-up-fade': 'slide-up-fade 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
