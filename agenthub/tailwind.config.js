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
          DEFAULT: '#1890ff',
          dark: '#096dd9',
          light: '#40a9ff',
        },
        accent: {
          DEFAULT: '#ff6b35',
          dark: '#e8582c',
          light: '#ff8659',
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
