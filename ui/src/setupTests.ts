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

// Copy all properties from window to globalThis
const global = globalThis as any;
const win = dom.window as any;

Object.keys(win).forEach((property) => {
  if (typeof global[property] === "undefined") {
    try {
      global[property] = win[property];
    } catch (e) {
      // Ignore properties that cannot be set
    }
  }
});

// Explicitly assign common globals that might be missed
global.HTMLElement = win.HTMLElement;
global.Element = win.Element;
global.Node = win.Node;
global.Event = win.Event;
global.CustomEvent = win.CustomEvent;
global.SVGElement = win.SVGElement;

if (!global.InputEvent) {
  // @ts-ignore
  global.InputEvent = class InputEvent extends Event {
    inputType: string;
    data: string | null;
    isComposing: boolean;
    constructor(type: string, eventInitDict: InputEventInit = {}) {
      super(type, eventInitDict);
      this.inputType = eventInitDict.inputType || "";
      this.data = eventInitDict.data || null;
      this.isComposing = eventInitDict.isComposing || false;
    }
  }
}
