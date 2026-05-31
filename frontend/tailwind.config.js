/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/(marketing)/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/landing/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        landing: {
          bg: '#0A0A0A',
          surface: '#111111',
          border: 'rgba(255,255,255,0.08)',
          muted: '#888888',
          accent: '#FF6B2B',
          stellar: '#00D4FF',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'dot-grid':
          'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-grid': '24px 24px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
