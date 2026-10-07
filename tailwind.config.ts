import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Agrilink design tokens. A familiar online-grocery look: white cards on a light grey page, one brand green,
 * a red Add button, amber for "pending". Token names (paper, ink, field...) map to that palette in src/index.css.
 */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1320px" },
    },
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', "system-ui", "sans-serif"],
        serif: ['"Inter Variable"', "system-ui", "sans-serif"],
        mono: ['"Inter Variable"', "system-ui", "sans-serif"],
      },
      fontSize: {
        // Labels and metadata. Below 12px only for uppercase mono, which stays legible thanks to tracking.
        label: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],
        display: ["clamp(1.75rem, 3.4vw, 2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        headline: ["clamp(1.5rem, 2.4vw, 1.875rem)", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
        title: ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        // Named materials. Use these for meaning, not decoration.
        paper: { DEFAULT: "hsl(var(--paper))", raised: "hsl(var(--paper-raised))", sunk: "hsl(var(--paper-sunk))" },
        ink: { DEFAULT: "hsl(var(--ink))", soft: "hsl(var(--ink-soft))" },
        rule: { DEFAULT: "hsl(var(--rule))", strong: "hsl(var(--rule-strong))" },
        field: { DEFAULT: "hsl(var(--field))", deep: "hsl(var(--field-deep))", wash: "hsl(var(--field-wash))" },
        turmeric: { DEFAULT: "hsl(var(--turmeric))", ink: "hsl(var(--turmeric-ink))", wash: "hsl(var(--turmeric-wash))" },
        chili: { DEFAULT: "hsl(var(--chili))", wash: "hsl(var(--chili-wash))" },
        indigo: { DEFAULT: "hsl(var(--indigo))", wash: "hsl(var(--indigo-wash))" },
        soil: "hsl(var(--soil))",
        lime: "hsl(var(--lime))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionTimingFunction: {
        // Quick out, settled in: things arrive, they don't bounce.
        settle: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        rise: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        // Bars and meters grow from their baseline.
        grow: { from: { transform: "scaleY(0)" }, to: { transform: "scaleY(1)" } },
        "grow-x": { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
        // The loading furrow: a short stroke travelling along a rule.
        plough: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(400%)" } },
        // A confirmation stamp lands once.
        stamp: { "0%": { opacity: "0", transform: "scale(1.25) rotate(-4deg)" }, "100%": { opacity: "1", transform: "scale(1) rotate(-2deg)" } },
        "bump": { "0%,100%": { transform: "scale(1)" }, "40%": { transform: "scale(1.18)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        rise: "rise 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "fade-in": "fade-in 0.25s ease-out both",
        grow: "grow 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "grow-x": "grow-x 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        plough: "plough 1.1s cubic-bezier(0.45, 0, 0.55, 1) infinite",
        stamp: "stamp 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        bump: "bump 0.32s cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
