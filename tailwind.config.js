/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Kantumruy Pro"',
          '"Noto Sans Khmer"',
          '"Plus Jakarta Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Khmer OS Battambang"',
          'Roboto',
          'sans-serif',
        ],
        moul: ['"Moul"', '"Khmer OS Muol Light"', 'serif'],
      },
    },
  },
  plugins: [],
};
