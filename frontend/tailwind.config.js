/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#020617', // slate-950
        surface: {
          DEFAULT: '#0f172a', // slate-900
          subtle: '#1e293b',  // slate-800
        },
        primary: {
          DEFAULT: '#06b6d4', // cyan-500
          hover: '#22d3ee',   // cyan-400
          dark: '#0891b2',    // cyan-600
        },
        ai: {
          DEFAULT: '#8b5cf6', // violet-500
          hover: '#a78bfa',   // violet-400
          dark: '#7c3aed',    // violet-600
        },
        status: {
          pending: '#f59e0b',   // amber-500
          confirmed: '#10b981', // emerald-500
          alert: '#f43f5e',     // rose-500
        }
      },
    },
  },
  plugins: [],
}
