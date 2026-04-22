import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-dm-serif)", "Georgia", "serif"],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
        },
        qs: {
          bg: "#0c0a09",
          "bg-elev": "#171412",
          "bg-elev-2": "#1c1917",
          "bg-subtle": "#201c19",
          line: "#2a2522",
          "line-strong": "#3a322d",
          fg: "#fafaf9",
          "fg-muted": "#d6d3d1",
          "fg-subtle": "#a8a29e",
          "fg-faint": "#78716c",
          "fg-ghost": "#57534e",
          amber: "#f59e0b",
          "amber-bright": "#fbbf24",
          "amber-deep": "#d97706",
          ok: "#34d399",
          danger: "#f87171",
          info: "#60a5fa",
          purple: "#c4b5fd",
        },
      },
      backgroundImage: {
        "amber-tint": "rgba(245,158,11,0.10)",
        "amber-tint-2": "rgba(245,158,11,0.16)",
      },
      boxShadow: {
        "amber-glow":
          "0 0 0 1px rgba(245,158,11,.3), 0 8px 32px rgba(245,158,11,.15)",
        "qs-card":
          "0 1px 2px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.2)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "qs-ping": {
          "75%, 100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "qs-fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "qs-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "qs-ping": "qs-ping 1.8s cubic-bezier(0,0,.2,1) infinite",
        "qs-fade-in": "qs-fade-in .24s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
