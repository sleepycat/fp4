import { JSDOM } from "jsdom"

const dom = new JSDOM(
  `
    <!DOCTYPE html>
    <head>
      <title>test</title>
    </head>
    <body></body>
    </html>
  `,
  {
    url: "http://localhost",
  },
)

declare namespace globalThis {
  var window: typeof dom.window
  var document: typeof dom.window.document
}

globalThis.window = dom.window
globalThis.document = dom.window.document
