/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: { // Screens Anda sudah benar, kita salin langsung
        xs: "0px",
        sm: "540px",
        md: "768px",
        lg: "1280px",
        xl: "1580px",
        "2xl": "1806px",
      },

      fontFamily: {
        Poppins: ["var(--font-poppins)", "sans-serif"],
        Roboto: ["var(--font-roboto)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
