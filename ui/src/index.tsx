import React from "react";
import ReactDOM from "react-dom/client";
import { t } from "@lingui/macro";
import Layout from "./Layout.tsx";
import { I18nProvider } from "@lingui/react";
import { defaultLocale, dynamicActivate } from "./i18n.ts";
import { createBrowserRouter, RouterContextProvider } from "react-router";
import { RouterProvider } from "react-router/dom";
import LoginRoute from "./routes/Login.tsx";
import HomeRoute from "./routes/Home.tsx";
import AboutRoute from "./routes/About.tsx";
import VerifyRoute from "./routes/Verify.tsx";
import DrugSeizuresRoute, { DrugSeizures } from "./routes/DrugSeizures.tsx";
import { client, UrqlClientContext } from "./context.tsx";
import { Provider } from "urql";

const i18n = await dynamicActivate(defaultLocale);

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      HomeRoute,
      AboutRoute,
      LoginRoute,
      DrugSeizuresRoute,
      VerifyRoute,
      { path: t`drug-seizures`, Component: DrugSeizures },
    ],
  },
], {
  // This context object will be available in all the loaders and actions.
  // By adding our initialized GraphQL client in there we can use it everywhere.
  getContext() {
    const context = new RouterContextProvider();
    context.set(UrqlClientContext, client);
    return context;
  },
});

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <Provider value={client}>
        <I18nProvider i18n={i18n}>
          <RouterProvider router={router} />,
        </I18nProvider>
      </Provider>
    </React.StrictMode>,
  );
}
