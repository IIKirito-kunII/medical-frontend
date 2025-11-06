/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // You can extend the theme here if needed
    },
  },
  plugins: [],
  // This will ensure Tailwind's gradient classes work without warnings
  future: {
    hoverOnlyWhenSupported: true,
  },
};
