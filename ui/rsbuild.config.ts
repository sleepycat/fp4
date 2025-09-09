import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [
    pluginReact(),
  ],
  tools: {
    swc: {
      jsc: {
        experimental: {
          plugins: [["@lingui/swc-plugin", {}]],
        },
      },
    },
  },
  server: {
    open: false,
  },
  html: {
    // use a custom template to address A11y and SEO issues.
    template: "./static/index.html",
  },
  output: {
    // This will prevent .LICENSE.txt files from being generated
    legalComments: "none",
  },
  performance: {
    preload: {
      type: "all-assets",
    },
  },
});
