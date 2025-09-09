import React from "react";
import ReactDOM from "react-dom/client";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/macro";
import Layout from "./Layout.tsx";
import { I18nProvider } from "@lingui/react";
import { defaultLocale, dynamicActivate } from "./i18n.ts";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

const i18n = await dynamicActivate(defaultLocale);

const Login = () => (
  <>
    <h1>
      <Trans>Login</Trans>
    </h1>
    <p>
      <Trans>
        Please log in.
      </Trans>
    </p>
  </>
);

const DrugSeizures = () => (
  <>
    <h1>
      <Trans>Drug Seizures</Trans>
    </h1>
    <p>
      <Trans>
        Drug Seizures
      </Trans>
    </p>
  </>
);

const Home = () => (
  <>
    <h1>
      <Trans>Home</Trans>
    </h1>
    <p>
      <Trans>
        Federal Policing protects Canada, its people, and its interests against
        the greatest domestic and international criminal threats, including
        risks to national security, transnational and serious organized crime,
        and cybercrime.
      </Trans>
    </p>
  </>
);
const About = () => (
  <>
    <h1>
      <Trans>About</Trans>
    </h1>
    <p>
      <Trans>
        Federal Policing is a core responsibility of the RCMP that is carried
        out in every province and territory in Canada, as well as
        internationally.
      </Trans>
    </p>
  </>
);

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      { path: "login", Component: Login },
      { path: "drug-seizures", Component: DrugSeizures },
      { path: t`drug-seizures`, Component: DrugSeizures },
    ],
  },
]);

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <I18nProvider i18n={i18n}>
        <RouterProvider router={router} />,
      </I18nProvider>
    </React.StrictMode>,
  );
}
