import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
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
        // PLSOM Brand Colors - Light Mode
        plsom: {
          primary: {
            100: "var(--primary)",
            200: "var(--chart-2)",
            300: "var(--chart-3)",
          },
          accent: {
            100: "#FFD700", // Gold for accents, highlights, and call-to-action
            200: "#e9aa2b", // Warm gold for secondary accents
          },
          text: {
            100: "#333333", // Main text color, high contrast for readability
            200: "#5c5c5c", // Secondary text color
          },
          bg: {
            100: "#F5F5F5", // Light background for main containers
            200: "#ebebeb", // Slightly darker background for sections or cards
            300: "#c2c2c2", // Borders and dividers
          },
        },
        
        // PLSOM Dark Mode Colors
        "plsom-dark": {
          primary: {
            100: "#FFFFFF", // White for primary content text and icons
            200: "#e0e0e0", // Light gray for backgrounds and secondary elements
            300: "#9b9b9b", // Medium gray for borders and dividers
          },
          accent: {
            100: "#FFD700", // Gold accents, call-to-action buttons
            200: "#917800", // Darker gold or bronze for secondary accents
          },
          text: {
            100: "#FFFFFF", // Main light text on dark backgrounds
            200: "#e0e0e0", // Secondary text for contrast
          },
          bg: {
            100: "#0F1626", // Dark base for app backgrounds
            200: "#1e2436", // Slightly lighter dark backgrounds
            300: "#363c4e", // Borders and dividers in dark mode
          },
        },

        // Semantic color tokens that work with CSS variables
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      
      // PLSOM Typography System
      fontFamily: {
        heading: ["var(--font-heading)", "Roboto Slab", "Poppins", "serif"],
        body: ["var(--font-body)", "Poppins", "Open Sans", "sans-serif"],
        button: ["var(--font-button)", "Poppins", "sans-serif"],
        "roboto-slab": ["Roboto Slab", "serif"],
        poppins: ["Poppins", "sans-serif"],
        "open-sans": ["Open Sans", "sans-serif"],
      },
      
      // PLSOM Typography Scale
      fontSize: {
        "plsom-h1": ["var(--text-h1)", { lineHeight: "1.4", fontWeight: "700" }],
        "plsom-h2": ["var(--text-h2)", { lineHeight: "1.4", fontWeight: "700" }],
        "plsom-h3": ["var(--text-h3)", { lineHeight: "1.4", fontWeight: "700" }],
        "plsom-subheading": ["var(--text-subheading)", { lineHeight: "1.4", fontWeight: "600" }],
        "plsom-body": ["var(--text-body)", { lineHeight: "1.6", fontWeight: "400" }],
        "plsom-small": ["var(--text-small)", { lineHeight: "1.4", fontWeight: "400" }],
        "plsom-caption": ["var(--text-caption)", { lineHeight: "1.4", fontWeight: "400" }],
      },
      
      // PLSOM Border Radius (4px as specified in style guide)
      borderRadius: {
        plsom: "var(--radius)", // 4px
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      // PLSOM Shadows
      boxShadow: {
        "plsom-card": "var(--shadow-card)",
        "plsom-modal": "var(--shadow-modal)",
        card: "var(--shadow-card)",
        modal: "var(--shadow-modal)",
      },
      
      // PLSOM Spacing for consistent padding/margins
      spacing: {
        "plsom-xs": "0.5rem",   // 8px
        "plsom-sm": "0.75rem",  // 12px
        "plsom-md": "1rem",     // 16px
        "plsom-lg": "1.5rem",   // 24px
        "plsom-xl": "2rem",     // 32px
        "plsom-2xl": "3rem",    // 48px
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
        // PLSOM Button hover animation
        "plsom-button-hover": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-1px)" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "plsom-button-hover": "plsom-button-hover 0.2s ease",
      },
      
      // PLSOM Transition timings
      transitionDuration: {
        "plsom": "200ms",
      },
      
      transitionTimingFunction: {
        "plsom": "ease",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
