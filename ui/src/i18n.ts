import { i18n } from "@lingui/core";

export const defaultLocale = "en";

type Locale = "en" | "fr";

export async function dynamicActivate(locale: Locale) {
  const { messages } = await import(`./locales/${locale}/messages`);
  i18n.load(locale, messages);
  i18n.activate(locale);
  return i18n;
}
