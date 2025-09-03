import React from "react";
import { dynamicActivate, locales } from "./i18n.ts";

function LocaleSwitcher() {
  return (
    <div>
      <button type="button" onClick={async () => dynamicActivate("en")}>
        English
      </button>
      <button type="button" onClick={async () => dynamicActivate("fr")}>
        Français
      </button>
    </div>
  );
}

export default LocaleSwitcher;
