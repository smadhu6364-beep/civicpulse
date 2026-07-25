/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        civic: {
          blue: "#1D4ED8",
          green: "#15803D",
          amber: "#D97706",
          red: "#DC2626",
        },
      },
    },
  },
  plugins: [],
};
