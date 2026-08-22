/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base:    '#090b1a',  // deep midnight navy
        surface: '#0c0f24',  // glass surface base
        elevated:'#111530',  // inputs, buttons
        border:  '#1c2040',  // subtle borders
        accent: {
          DEFAULT: '#7c3aed',  // violet — more distinctive than indigo
          light:   '#a78bfa',
          dark:    '#6d28d9',
        },
        gold:    '#f59e0b',
        emerald: '#10b981',
        rose:    '#f43f5e',
        sky:     '#06b6d4',  // teal-cyan
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: {
        '2xl': '16px',
        '3xl': '22px',
        '4xl': '28px',
      },
      animation: {
        'xp-fill':    'xpFill 1.4s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-up':   'slideUp 0.4s cubic-bezier(0.34,1.2,0.64,1)',
        'fade-in':    'fadeIn 0.3s ease',
        'bounce-in':  'bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        xpFill:   { '0%': { width: '0%' }, '100%': { width: 'var(--xp-progress)' } },
        slideUp:  { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        fadeIn:   { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        bounceIn: { '0%': { transform: 'scale(0.6)', opacity: 0 }, '60%': { transform: 'scale(1.08)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
      },
    },
  },
  plugins: [],
}
