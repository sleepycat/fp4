import { useLingui } from "@lingui/react";
import { dynamicActivate } from "./i18n.ts";

function LocaleSwitcher() {
  const { i18n } = useLingui();
  return (
    <div>
      {i18n.locale === "en"
        ? (
          <button
            type="button"
            onClick={async () => await dynamicActivate("fr")}
          >
            Français
          </button>
        )
        : (
          <button
            type="button"
            onClick={async () => await dynamicActivate("en")}
          >
            English
          </button>
        )}
    </div>
  );
}

export default LocaleSwitcher;
