/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0D45FC',
          secondary: '#0DBCFC',
          accent: '#0DFCC4',
          dark: '#0F172A',
          card: '#FFFFFF',
          bg: '#F8FAFC',
          border: '#E2E8F0',
          muted: '#64748B',
        },
        rating: {
          a: '#0DFCC4',
          b: '#FBBF24',
          c: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans Georgian"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -3px rgba(13, 69, 252, 0.4)',
        'glow-accent': '0 0 20px -3px rgba(13, 252, 196, 0.4)',
        'pin': '0 4px 14px 0 rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
