import { I18N } from '@aurelia/i18n';
import { observable, resolve } from 'aurelia';
import { isLanguage, LANGUAGE_NAMES, LANGUAGES } from '../i18n';
import { browserStorage, STORAGE_KEYS } from '../session/storage';

export class LanguagePicker {
  public readonly languages = LANGUAGES.map(code => ({ code, name: LANGUAGE_NAMES[code] }));
  private readonly i18n = resolve(I18N);

  @observable public language: string = this.i18n.getLocale();

  public languageChanged(language: string): void {
    if (!isLanguage(language)) {
      return;
    }
    void this.i18n.setLocale(language);
    browserStorage.set(STORAGE_KEYS.language, language);
    document.documentElement.lang = language;
  }
}
