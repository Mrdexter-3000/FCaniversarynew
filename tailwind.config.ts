/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./@/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    // js files primarily because in dist
    "./node_modules/frames.js/dist/**/*.{ts,tsx,js,css}",
    "./node_modules/@frames.js/render/dist/*.{ts,tsx,js,css}",
    "./node_modules/@frames.js/render/dist/**/*.{ts,tsx,js,css}",

    // monorepo weirdness
    "../../node_modules/frames.js/dist/**/*.{ts,tsx,js,css}",
    "../../node_modules/@frames.js/render/dist/*.{ts,tsx,js,css}",
    "../../node_modules/@frames.js/render/dist/**/*.{ts,tsx,js,css}",
  ],
  theme: {
    extend: {
      fontFamily: {
        bungee: ["Bungee", "sans-serif"],
      },
    },
  },
  plugins: [],
}

