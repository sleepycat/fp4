import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ["./src/**/*.{ts,tsx,js,jsx}"],

  // Files to exclude
  exclude: [],
  hash: true,

  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        radii: {
          sm: { value: "0.25rem" },
        },
        colors: {
          red: {
            value: "hsl(354, 97%, 36%)",
          },
          brightred: { value: "#EA2D37" },
          burgundy: {
            value: "rgb(130, 55, 62)",
          },
          yellow: {
            value: "hsl(43, 83%, 56%)",
          },
          gray: {
            value: "hsl(210, 6%, 30%)",
          },
          navy: {
            value: "hsl(214, 42%, 27%)",
          },
          gold: {
            value: "hsl(42, 40%, 58%)",
          },
          lightgray: { value: "#f1f2f3;" },
          white: { value: "#ffffff" },
        },
      },
      semanticTokens: {
        colors: {
          rcmpred: {
            value: "{colors.red}",
          },
          canadared: {
            value: "{colors.brightred}",
          },
        },
      },
    },
  },
  // The output directory for your css system
  outdir: "styled-system",

  // The JSX framework to use
  jsxFramework: "react",

  // The CSS Syntax to use to use
  syntax: "template-literal",
});
