/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bce0ff",
          300: "#8ecbff",
          400: "#59acff",
          500: "#3388fc",
          600: "#1c68f0",
          700: "#1653dd",
          800: "#1943b3",
          900: "#1a3c8c",
        },
      },
    },
  },
  plugins: [],
};
