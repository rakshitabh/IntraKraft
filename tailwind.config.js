/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'sans-serif'],
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        erp: {
          bg: '#F8F9FA',
          panel: '#FFFFFF',
          border: '#D1D5DB',
          borderLight: '#E5E7EB',
          header: '#1E293B',
          brand: '#2563EB',
          brandDark: '#1D4ED8',
          subtle: '#64748B',
          text: '#0F172A',
        }
      }
    },
  },
  plugins: [],
}
