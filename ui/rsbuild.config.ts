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
      "@sleepycat/headless-goc-wordmark":
        "@jsr/sleepycat__headless-goc-wordmark",
    },
  },
  server: {
    open: false,
  },
  html: {
    // use a custom template to address A11y and SEO issues.
    template: "./static/index.html",
    tags: [
      {
        tag: "link",
        attrs: {
          rel: "preload",
          type: "font/woff2",
          as: "font",
          href: "/static/font/OverusedGrotesk-VF.woff2",
          crossorigin: "anonymous",
        },
      },
    ],
  },
  output: {
    // This will prevent .LICENSE.txt files from being generated
    legalComments: "none",
    filename: {
      // Don't use a hash in the font filename, so our tags above can
      // reference the font files directly.
      font: "[name][ext]",
    },
  },
  performance: {
    preload: {
      type: "async-chunks",
      include: [
        "\\.css$",
        "\\.svg$",
      ],
    },
    chunkSplit: {
      strategy: "split-by-experience",
      forceSplitting: {
        "react-spectrum": /node_modules\/@adobe\/react-spectrum/,
        "ag-charts": /node_modules\/ag-charts-community/,
      },
    },
  },
})
