import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Javidan Color Palette - Gold Lion on Navy Blue
        navy: {
          DEFAULT: '#1a3a52',
          dark: '#0f2537',
          light: '#2d5170',
        },
        gold: {
          DEFAULT: '#d4af37',
          light: '#e5c158',
          dark: '#b8941f',
        },
      },
    },
  },
  plugins: [],
};

export default config;
