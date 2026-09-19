import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stage: {
          950: "#05030a",
          900: "#0b0714",
          800: "#120c22"
        },
        neon: {
          magenta: "#ff2ea6",
          purple: "#8b2fe0",
          blue: "#2ee8ff"
        }
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        display: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ]
      },
      boxShadow: {
        glow: "0 0 24px rgba(255, 46, 166, 0.35)",
        "glow-blue": "0 0 24px rgba(46, 232, 255, 0.35)"
      },
      backgroundImage: {
        "stage-gradient": "radial-gradient(circle at top, #1a0f2e 0%, #05030a 70%)"
      },
      zIndex: {
        // Fullscreen karaoke mode layering tokens (docs/PLAYER.md).
        // Use these instead of arbitrary z-index values.
        video: "0",
        "video-overlay": "10",
        queue: "20",
        search: "30",
        "top-controls": "40",
        dialog: "50"
      }
    }
  },
  plugins: []
};

export default config;
