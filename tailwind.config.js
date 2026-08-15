/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens IsentaPCD (design.md §2)
        ink: {
          950: "#0E1512",
          900: "#14201B",
          800: "#1B2A23",
          700: "#24352D",
          "900-txt": "#182420",
          "600-txt": "#44554D",
        },
        paper: {
          50: "#F7F3EA",
          100: "#EFE9DB",
          400: "#B9B2A0",
          bg: "#F6F2E8",
          card: "#FFFFFF",
          line: "#E3DCCB",
        },
        amber: {
          300: "#F8CC72",
          400: "#F2B53F",
          600: "#8A5B0B",
        },
        moss: {
          400: "#5BC8A0",
          600: "#16724F",
        },
        coral: {
          400: "#FF8A6B",
          600: "#C24A2E",
        },
        whatsapp: {
          dark: "#1FAF54",
          light: "#178A43",
        },
        // Tokens semânticos (consomem CSS vars — funcionam nos 2 temas)
        bg: "var(--bg)",
        "bg-alt": "var(--bg-alt)",
        surface: "var(--surface)",
        line: "var(--line)",
        txt: "var(--text)",
        "txt-2": "var(--text-2)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        "on-accent": "var(--on-accent)",
        success: "var(--success)",
        warn: "var(--warn)",
        danger: "var(--danger)",
        // shadcn base tokens (mantidos para components/ui)
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
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
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
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["'Atkinson Hyperlegible'", "'Segoe UI'", "Arial", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        display: ["clamp(2.75rem, 6vw, 4.5rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        h1: ["clamp(2.25rem, 4.5vw, 3.25rem)", { lineHeight: "1.08", letterSpacing: "-0.015em" }],
        h2: ["clamp(1.75rem, 3.2vw, 2.5rem)", { lineHeight: "1.12", letterSpacing: "-0.01em" }],
        h3: ["clamp(1.3rem, 2vw, 1.6rem)", { lineHeight: "1.2", letterSpacing: "-0.005em" }],
        lead: ["1.25rem", { lineHeight: "1.55" }],
        body: ["1.0625rem", { lineHeight: "1.65" }],
        small: ["0.9375rem", { lineHeight: "1.5", letterSpacing: "0.005em" }],
        mono: ["0.875rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],
      },
      maxWidth: {
        content: "1200px",
        wide: "1320px",
        prose68: "68ch",
      },
      borderRadius: {
        card: "20px",
        input: "12px",
        btn: "14px",
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "card-light": "0 1px 2px rgba(24,36,32,.06), 0 8px 24px rgba(24,36,32,.06)",
        "amber-glow": "0 0 0 1px rgba(242,181,63,.4), 0 8px 32px rgba(242,181,63,.12)",
      },
      transitionTimingFunction: {
        "ease-out-expo": "cubic-bezier(0.22, 1, 0.36, 1)",
        "ease-in-quart": "cubic-bezier(0.64, 0, 0.78, 0)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "float-soft": {
          "0%,100%": { transform: "translateY(-10px)" },
          "50%": { transform: "translateY(10px)" },
        },
        "breathe": {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "float-soft": "float-soft 6s ease-in-out infinite",
        "breathe": "breathe 8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
