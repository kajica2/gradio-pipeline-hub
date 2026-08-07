/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './tester.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          '"SF Mono"',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
      },
      colors: {
        // Mapped to the design tokens in src/styles.css so utility classes
        // resolve the same way whether you use @apply or var(--accent)
        ink: {
          50: '#e8e9ed',
          100: '#9094a6',
          200: '#5b5f70',
          900: '#0a0b10',
          950: '#0d0e15',
        },
        accent: {
          DEFAULT: '#7dd3c0',
          dark: '#5fb8a3',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
        'fade-in': 'fade-in 220ms ease',
      },
    },
  },
  plugins: [],
};
