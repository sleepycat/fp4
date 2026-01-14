import { defineConfig } from "@rsbuild/core"
import { pluginReact } from "@rsbuild/plugin-react"
import RspackDenoPlugin from "rspack-deno-plugin"

export default defineConfig({
  plugins: [
    pluginReact(),
  ],
  dev: {
    // Deno's node compat layer struggles with the socket optimizations
    // used by Rspack's lazy compilation.
    lazyCompilation: false,
  },
  tools: {
    rspack: {
      // This allows rspack to handle code with deno import specifiers
      // like npm:react
      plugins: [new RspackDenoPlugin()],
    },
    swc: {
      jsc: {
        experimental: {
          plugins: [["@lingui/swc-plugin", {}]],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@sleepycat/headless-goc-wordmark": "@jsr/sleepycat__headless-goc-wordmark",
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
})
