import { i18n } from '@lingui/core';
 
export const defaultLocale = 'en';
 
export async function dynamicActivate(locale) {
  const { messages } = await import(`./locales/${locale}/messages`);
  i18n.load(locale, messages);
  i18n.activate(locale);
  return i18n;
}
