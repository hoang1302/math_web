/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f4ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da5ff',
          400: '#1a8bff',
          500: '#4FACFE', // Vibrant Blue - Main color
          600: '#3d8ae6',
          700: '#2b68cc',
          800: '#1946b3',
          900: '#072499',
        },
        action: {
          DEFAULT: '#FFA726', // Vibrant Orange - Action buttons
          50: '#fff3e0',
          100: '#ffe0b2',
          200: '#ffcc80',
          300: '#ffb74d',
          400: '#ffa726',
          500: '#ff9800',
          600: '#fb8c00',
          700: '#f57c00',
          800: '#ef6c00',
          900: '#e65100',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'Quicksand', 'system-ui', 'sans-serif'],
        display: ['Fredoka One', 'cursive'],
        body: ['Quicksand', 'sans-serif'],
        heading: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

