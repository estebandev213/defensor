import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        paper: "var(--paper)",
        ink: "var(--ink)",
        navy: "var(--navy)",
        "navy-soft": "var(--navy-soft)",
        muted: "var(--muted)",
        brass: "var(--brass)",
        "brass-soft": "var(--brass-soft)",
        verified: "var(--verified)",
        danger: "var(--danger)",
        border: "var(--border)",
        "border-soft": "var(--border-soft)",
      },
      fontFamily: {
        sans: ["var(--font-plex-sans)", "sans-serif"],
        serif: ["var(--font-fraunces)", "serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      boxShadow: {
        paper: "0 18px 50px rgba(22, 37, 62, 0.08)",
      },
    },
  },
  plugins: [forms],
};

export default config;
