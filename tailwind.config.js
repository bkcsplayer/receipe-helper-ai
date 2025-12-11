/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F8F4EC',
        ink: '#4E3B31',
        'ink-dark': '#222222',
        brand: {
          blue: '#2A3A68',
          orange: '#FF8C42',
          green: '#5F7A3C',
        },
        highlight: {
          yellow: '#FFD700',
          pink: '#F72585',
        }
      },
      fontFamily: {
        hand: ['"Patrick Hand"', 'cursive'],
        sans: ['"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'paper-texture': "url('https://www.transparenttextures.com/patterns/cream-paper.png')", // Fallback or hosted texture
      },
      boxShadow: {
        'hand': '2px 3px 0px 0px #4E3B31',
        'hand-hover': '3px 4px 0px 0px #4E3B31',
        'hand-deep': '4px 5px 0px 0px #4E3B31',
      }
    },
  },
  plugins: [],
}

