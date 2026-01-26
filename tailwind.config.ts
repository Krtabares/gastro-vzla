import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0A0A0B",
          card: "#161618",
          accent: "#7C3AED",
          highlight: "#06B6D4",
          border: "#27272A",
          text: "#EDEDED",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "nebula-glow": "radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.05) 0%, transparent 50%)",
      },
      borderRadius: {
        'bento': '24px',
      },
    },
  },
  plugins: [],
};
export default config;
