# FP4 UI

This service provides the User Interface (UI) that users will interact with. It runs client-side, in the users browser, and uses the functionality exposed by the API, focusing on [safely encoding](https://youtu.be/NcAYsC_TKCA?t=642) the data received into accessible HTML using [React](https://react.dev/). This approach means that teams with varying skill levels can reliably produce UI that is free from Cross Site-Scripting vulnerabilities (aka XSS). Using React also makes it possible to leverage accessible-by-default components created by others (such as Microsoft's [Fluent UI](https://learn.microsoft.com/en-us/shows/fluent-ui-insights/fluent-ui-insights-accessible-by-default) components, Adobe's [React Aria](https://react-spectrum.adobe.com/react-aria/index.html), or community-led projects like [Radix-UI](https://www.radix-ui.com/)).
When devs are building with components that are both secure and accessible by default, organizations have the option of implementing lighter, faster process without worry that these requirements will not be met.

This project is based on the Rsbuild quickstart with specific approaches for [handling logos]([url](https://mikewilliamson.wordpress.com/2025/07/26/dealing-with-government-of-canada-logos-on-the-web/)) and [internationalization]([url](https://mikewilliamson.wordpress.com/2025/03/08/i18n-for-rsbuild-with-lingui/)).

## Nota Bene

Because of Rspacks support for asset preloading (used in the logo handling) this service uses [Nodejs](https://nodejs.org) instead of using [Deno](https://deno.com/) like the API.
Ideally this would be resolved in favour of using Deno everywhere, but that will require figuring out a similar preloading scheme with [Denos esbuild based bundler](https://docs.deno.com/runtime/reference/bundling/) and a plugin like [esbuild-plugin-html](https://github.com/craftamap/esbuild-plugin-html)

## Setup

Install the dependencies:

```bash
npm install
```

## Get started

Start the dev server, and the app will be available at [http://localhost:3000](http://localhost:3000).

```bash
npm dev
```

Build the app for production:

```bash
npm build
```

Preview the production build locally:

```bash
npm preview
```

## Learn more

To learn more about Rsbuild, check out the following resources:

- [Rsbuild documentation](https://rsbuild.rs) - explore Rsbuild features and APIs.
- [Rsbuild GitHub repository](https://github.com/web-infra-dev/rsbuild) - your feedback and contributions are welcome!
