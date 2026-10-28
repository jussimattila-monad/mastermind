import Aurelia from 'aurelia';
import { I18nConfiguration } from '@aurelia/i18n';
import { detectLanguage, resources } from './i18n';
import { MyApp } from './my-app';
import { browserStorage, STORAGE_KEYS } from './session/storage';

const language = detectLanguage(browserStorage.get(STORAGE_KEYS.language), navigator.languages);
document.documentElement.lang = language;

Aurelia
  .register(I18nConfiguration.customize(options => {
    options.initOptions = {
      resources,
      lng: language,
      fallbackLng: 'en',
      // Aurelia sets translations as text, not HTML, so i18next doesn't need to escape them.
      interpolation: { escapeValue: false },
    };
  }))
  .app(MyApp)
  .start();
