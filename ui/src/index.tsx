import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { I18nProvider } from "@lingui/react";
import { defaultLocale, dynamicActivate } from "./i18n.ts";

const i18n = await dynamicActivate(defaultLocale);

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <I18nProvider i18n={i18n}>
        <App />
      </I18nProvider>
    </React.StrictMode>,
  );
}
