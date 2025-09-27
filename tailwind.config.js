/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#0a0a0a',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#0a0a0a',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#0a0a0a',
        },
        primary: {
          DEFAULT: '#171717',
          foreground: '#fafafa',
        },
        secondary: {
          DEFAULT: '#f5f5f5',
          foreground: '#171717',
        },
        muted: {
          DEFAULT: '#f5f5f5',
          foreground: '#737373',
        },
        accent: {
          DEFAULT: '#f5f5f5',
          foreground: '#171717',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#fafafa',
        },
        border: '#e5e5e5',
        input: '#e5e5e5',
        ring: '#0a0a0a',
        chart: {
          "1": '#f97316',
          "2": '#0891b2',
          "3": '#1e40af',
          "4": '#eab308',
          "5": '#dc2626',
        },
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
}

