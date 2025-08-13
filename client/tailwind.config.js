/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'primary-green': '#2f855a',
          'secondary-yellow': '#f6e05e',
        },
        fontFamily: {
          'inter': ['Inter', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }