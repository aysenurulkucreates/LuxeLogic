/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // İleride LuxeLogic için buraya özel lüks renkler ekleriz
      },
    },
  },
  plugins: [],
};
