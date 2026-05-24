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
        work: {
          navy: "#0f2d4a",
          blue: "#1e5a8a",
          sky: "#e8f4fc",
          amber: "#f59e0b",
          green: "#059669",
          red: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};

export default config;
