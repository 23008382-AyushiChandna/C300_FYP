module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#050B18',
        card: '#0F172A',
        card2: '#111827',
        border: 'rgba(255,255,255,0.08)',
        primary: '#38BDF8',
        secondary: '#14B8A6',
        textPrimary: '#FFFFFF',
        textSecondary: '#94A3B8'
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px'
      }
    }
  },
  plugins: []
}
