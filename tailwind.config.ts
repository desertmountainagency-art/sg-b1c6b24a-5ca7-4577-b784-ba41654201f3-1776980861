import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          container: "hsl(var(--primary-container))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          container: "hsl(var(--secondary-container))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--tertiary-foreground))",
          container: "hsl(var(--tertiary-container))",
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
        surface: {
          DEFAULT: "hsl(var(--surface))",
          dim: "hsl(var(--surface-dim))",
          bright: "hsl(var(--surface-bright))",
          container: {
            lowest: "hsl(var(--surface-container-lowest))",
            low: "hsl(var(--surface-container-low))",
            DEFAULT: "hsl(var(--surface-container))",
            high: "hsl(var(--surface-container-high))",
            highest: "hsl(var(--surface-container-highest))",
          },
        },
        outline: {
          DEFAULT: "hsl(var(--outline))",
          variant: "hsl(var(--outline-variant))",
        },
      },
      fontFamily: {
        serif: ["Noto Serif", "Georgia", "serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      fontSize: {
        "mentor-lg": ["32px", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
        "mentor-md": ["24px", { lineHeight: "1.5", letterSpacing: "0" }],
        "ui-md": ["16px", { lineHeight: "1.6", letterSpacing: "0.01em" }],
        "ui-sm": ["14px", { lineHeight: "1.4", letterSpacing: "0.02em" }],
        "label-caps": ["12px", { lineHeight: "1.2", letterSpacing: "0.05em" }],
      },
      borderRadius: {
        sm: "0.25rem",   // 4px
        DEFAULT: "0.5rem",  // 8px
        md: "0.75rem",   // 12px
        lg: "1rem",      // 16px
        xl: "1.5rem",    // 24px
        "2xl": "2rem",   // 32px
        full: "9999px",
      },
      spacing: {
        unit: "8px",
        element: "24px",
        section: "64px",
        container: "32px",
      },
      boxShadow: {
        ambient: "0 2px 16px rgba(24, 36, 27, 0.05)",
        "ambient-lg": "0 4px 24px rgba(24, 36, 27, 0.08)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        breath: {
          "0%, 100%": { opacity: "0.3", transform: "scaleY(1)" },
          "50%": { opacity: "0.6", transform: "scaleY(1.2)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        breath: "breath 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;