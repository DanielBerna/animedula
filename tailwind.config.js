/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        'surface-4': 'var(--surface-4)',
        accent: 'var(--accent)',
        'accent-2': 'var(--accent-2)',
        sakura: 'var(--sakura)',
        gold: 'var(--gold)',
        text: 'var(--text)',
        muted: 'var(--text-muted)',
        faint: 'var(--text-faint)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        jp: ['var(--font-jp)', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '22px',
        xl: '32px',
      },
      boxShadow: {
        glow: '0 0 40px rgba(139,124,255,0.15)',
        'glow-sakura': '0 0 40px rgba(255,107,157,0.12)',
        card: '0 24px 64px rgba(0,0,0,0.45)',
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        'enter-up': 'enterUp 700ms cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
}
