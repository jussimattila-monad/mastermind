import en from './en.json';
import fi from './fi.json';
import sv from './sv.json';

export const LANGUAGES = ['en', 'fi', 'sv'] as const;

export type Language = typeof LANGUAGES[number];

// Each language is listed by its own name, so these aren't translated.
export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = {
  en: 'English',
  fi: 'Suomi',
  sv: 'Svenska',
};

// Bundled rather than fetched, so translations load with the app under any base path.
export const resources: Record<Language, { translation: object }> = {
  en: { translation: en },
  fi: { translation: fi },
  sv: { translation: sv },
};

export function isLanguage(value: unknown): value is Language {
  return (LANGUAGES as readonly unknown[]).includes(value);
}

// The stored choice wins, then the browser's preferred languages (`fi-FI` matches `fi`), then English.
export function detectLanguage(stored: string | null, preferred: readonly string[]): Language {
  for (const candidate of [stored, ...preferred]) {
    const language = candidate?.toLowerCase().split('-')[0];
    if (isLanguage(language)) {
      return language;
    }
  }
  return 'en';
}
