/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaria: '#048187',
        secundaria: '#62ccd1',
        fundo: '#f8fafc',
        cards: '#ffffff'
      }
    },
  },
  plugins: [],
}