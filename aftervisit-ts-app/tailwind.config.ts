import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102033",
        mist: "#f4f8ff",
        sky: "#d9ecff",
        mint: "#dff6ea",
        peach: "#fff0df"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(16, 32, 51, 0.10)"
      },
      animation: {
        floatIn: "floatIn 0.45s ease-out",
        pulseSoft: "pulseSoft 1.4s ease-in-out infinite"
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55", transform: "scale(0.98)" },
          "50%": { opacity: "1", transform: "scale(1)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
