# FP4 UI

## Policy Drivers

* In the Government of Canada [APIs are mandatory](https://www.canada.ca/en/government/system/digital-government/policies-standards/government-canada-enterprise-architecture-framework.html#toc04:~:text=expose%20services%2C%20including%20existing%20ones%2C%20through%20APIs).
* Departments are required to [consume the APIs they build](https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/government-canada-standards-apis.html#:~:text=Consume%20what%20you%20build) in order to validate the API is usable.
* "[design systems as highly modular and loosely coupled services](https://www.canada.ca/en/government/system/digital-government/policies-standards/government-canada-enterprise-architecture-framework.html#:~:text=design%20systems%20as%20highly%20modular%20and%20loosely%20coupled%20services)"
* "[ensure automated testing occurs](https://www.canada.ca/en/government/system/digital-government/policies-standards/government-canada-enterprise-architecture-framework.html#:~:text=ensure%20automated%20testing%20occurs)"

## Architectural Decisions

This is a client side application that talks to the backend API, fullfilling the API standard's requirement to "consume what you build".
Using only the public interface of the API, this design is an example of the "loosely coupled services" that TBS requires.

### Using React

[React](http://react.dev/) is a JavaScript library for building user interfaces. Data from both the [State of JS 2024](https://stateofjs.com/en-US/libraries/front-end-frameworks) and the [2025 Stack Overflow Survey](https://survey.stackoverflow.co/2025/technology#most-popular-technologies-webframe-prof) show its massive adoption. This large talent pool makes it a safe and sustainable choice for large organizations. The recent move to an independent [React Foundation](https://react.dev/blog/2025/10/07/introducing-the-react-foundation) further solidifies its position as a stable, long-term technology. React's component-based architecture allows for the creation of reusable UI elements, which can be standardized for accessibility and reused across different applications, increasing development speed and ensuring a consistent, accessible-by-default user experience across RCMP applications.

React is also used to enhance security. Meta (the company that originally created React) explains that they "invest heavily in building frameworks that help engineers prevent and remove entire classes of bugs when writing code", listing [XHP as one of those frameworks](https://about.fb.com/news/2019/01/designing-security-for-billions/#:~:text=Hack%20and%20XHP%20are%20examples%20of%20secure%20frameworks%20that%20help%20ensure%20our%20engineers%20build%20technology%20that%20is%20more%20secure%20from%20the%20very%20beginning%2C%20rather%20than%20requiring%20they%20write%20additional%20code). The [JSX syntax that React popularized](https://www.typescriptlang.org/docs/handbook/jsx.html#:~:text=JSX%20is,framework) is actually just [a JavaScript version of XHP](https://youtu.be/vG8WpLr6y_U?si=jzQ47g2hZcoZVR9r&t=1050), which [solves XSS by default](https://youtu.be/vG8WpLr6y_U?si=tUcaWe4g-mh4m4rZ&t=874).

### Using React Aria

Headless component libraries, like [React Aria](https://react-spectrum.adobe.com/react-aria/index.html), provide accessible, unstyled UI primitives. This allows an organization to apply its own branding and design system without having to build and maintain a full component library from scratch. While the Canadian Digital Service provides [GCDS components](https://design-system.alpha.canada.ca/en/components/), they are tightly coupled to the generic Canada.ca brand, making them unsuitable for departments with distinct branding, like the RCMP. By using React Aria, the RCMP can leverage a well-maintained, accessible foundation for its user interface, while still retaining its unique visual identity. This approach avoids the significant cost and effort of maintaining a custom component library.

### Single Page Application (SPA) Architecture

The Single Page Application (SPA) architecture was chosen to reduce complexity and align with TBS enterprise architecture, which mandates modular, loosely coupled services and APIs. This design ensures a strong separation of concerns and a clear security boundary, with the UI focused solely on safely encoding HTML based on data received from the API, thereby fulfilling the 'consume what we build' API standard. Applications built in this architechtural tend to accumulate large bundles of JavaScript over time which can make for slow loading times and poor user experience. Managing this using bundle splitting and careful library selection will mitgate this architectural tradeoff.

### Using Rspack/Rsbuild/Nodejs

[Rspack](https://rspack.rs/)/[Rsbuild](https://rsbuild.rs/) is utilized to manage bundle size issues inherent in SPA architecture, enabling performant inclusion of web fonts and other assets through features like asset preloading.

## Setup

Install the dependencies:

```bash
deno install
```

## Get started

Start the dev server, and the app will be available at [http://localhost:3000](http://localhost:3000).

```bash
deno task dev
```

Build the app for production:

```bash
deno task build
```

Preview the production build locally:

```bash
deno task preview
```

## Learn more

To learn more about Rsbuild, check out the following resources:

- [Rsbuild documentation](https://rsbuild.rs) - explore Rsbuild features and APIs.
- [Rsbuild GitHub repository](https://github.com/web-infra-dev/rsbuild) - your feedback and contributions are welcome!
