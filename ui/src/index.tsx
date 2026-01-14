import React from "react"
import ReactDOM from "react-dom/client"
import { t } from "@lingui/core/macro"
import Layout from "./Layout.tsx"
import { I18nProvider } from "@lingui/react"
import { defaultLocale, dynamicActivate } from "./i18n.ts"
import { createBrowserRouter, RouterContextProvider } from "react-router"
import { RouterProvider } from "react-router/dom"

import { client, UrqlClientContext } from "./context.tsx"
import { Provider } from "urql"
import {
  defaultTheme,
  Provider as SpectrumProvider,
} from "@adobe/react-spectrum"

const i18n = await dynamicActivate(defaultLocale)

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        lazy: () => import("./routes/Home.tsx"),
      },
      {
        path: "about",
        lazy: () => import("./routes/About.tsx"),
      },
      {
        path: "login",
        lazy: () => import("./routes/Login.tsx"),
      },
      {
        path: "drug-seizures",
        lazy: () => import("./routes/DrugSeizures.tsx"),
      },
      {
        path: "verify/:token",
        lazy: () => import("./routes/Verify.tsx"),
      },
      {
        path: t`drug-seizures`,
        lazy: () => import("./routes/DrugSeizures.tsx"),
      },
      {
        path: "report-seizure",
        lazy: () => import("./routes/ReportSeizure.tsx"),
      },
      {
        path: "seizure-statistics",
        lazy: () => import("./routes/SeizureStatistics.tsx"),
      },
    ],
  },
], {
  // This context object will be available in all the loaders and actions.
  // By adding our initialized GraphQL client in there we can use it everywhere.
  getContext() {
    const context = new RouterContextProvider()
    context.set(UrqlClientContext, client)
    return context
  },
})

const rootEl = document.getElementById("root")
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  root.render(
    <React.StrictMode>
      <SpectrumProvider theme={defaultTheme} colorScheme="light">
        <Provider value={client}>
          <I18nProvider i18n={i18n}>
            <RouterProvider router={router} />,
          </I18nProvider>
        </Provider>
      </SpectrumProvider>
    </React.StrictMode>,
  )
}
