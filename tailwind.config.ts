import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8CA891",
          foreground: "#FAFAFA",
        },
        text: {
          DEFAULT: "#2C3333",
          muted: "#6B7280",
        },
        background: {
          DEFAULT: "#FAFAFA",
          muted: "#F3F4F6",
        },
        accent: {
          DEFAULT: "#E5E7EB",
          foreground: "#374151",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out",
        slideIn: "slideIn 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;