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
          bg: '#FAFAFA',
          surface: '#FFFFFF',
          border: '#E5E5E5',
          'border-light': '#F0F0F0',
          text: '#111111',
          nav: '#444444',
          muted: '#666666',
          accent: '#FF5C00',
          'accent-hover': '#E65200',
          stellar: '#0074FF',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
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
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        'card-lg': '0 2px 8px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.08)',
        tab: '0 1px 2px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
