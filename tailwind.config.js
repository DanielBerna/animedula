/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#08080F',
        'surface-2': '#10101C',
        'surface-3': '#18182B',
        'surface-4': '#22223A',
        accent: '#8B7CFF',
        'accent-2': '#6C5CE7',
        sakura: '#FF6B9D',
        gold: '#F5C842',
        text: '#F2F2FA',
        muted: '#A8A8C4',
        faint: '#6E6E8A',
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
