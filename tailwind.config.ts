import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        shopper: {
          primary: "#534AB7",
          light: "#EEEDFE",
          dark: "#3C3489",
        },
        shoppee: {
          primary: "#0F6E56",
          light: "#E1F5EE",
          dark: "#085041",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F6F2FC",
          dim: "#DCD8E2",
        },
        border: {
          subtle: "#E2E8F0",
        },
        text: {
          primary: "#1C1B22",
          secondary: "#474553",
          tertiary: "#64748B",
        },
        success: "#0F6E56",
        danger: "#BA1A1A",
        warning: "#8A4900",
      },
      fontSize: {
        h1: ["22px", { lineHeight: "28px", fontWeight: "500" }],
        "h1-mobile": ["20px", { lineHeight: "26px", fontWeight: "500" }],
        h2: ["18px", { lineHeight: "24px", fontWeight: "500" }],
        h3: ["16px", { lineHeight: "20px", fontWeight: "500" }],
        body: ["16px", { lineHeight: "1.7", fontWeight: "400" }],
        button: ["12px", { lineHeight: "16px", fontWeight: "500" }],
        meta: ["11px", { lineHeight: "14px", fontWeight: "400", letterSpacing: "0.02em" }],
      },
    },
  },
  plugins: [],
};
export default config;
