import { describe, expect, it } from 'vitest';
import { ALL_COLORS } from '../game';
import { detectLanguage, LANGUAGES, resources } from './index';

// Flattens nested translations into 'a.b.c' → value.
function flatten(object: object, prefix = ''): Map<string, unknown> {
  const entries = new Map<string, unknown>();
  for (const [key, value] of Object.entries(object)) {
    const path = prefix + key;
    if (typeof value === 'object' && value !== null) {
      flatten(value, `${path}.`).forEach((v, k) => entries.set(k, v));
    } else {
      entries.set(path, value);
    }
  }
  return entries;
}

function placeholders(value: unknown): string[] {
  return [...String(value).matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1]).sort();
}

const english = flatten(resources.en.translation);

describe('locales', () => {
  it('names every supported color', () => {
    for (const color of ALL_COLORS) {
      expect(english.has(`colors.${color}`)).toBe(true);
    }
  });

  for (const language of LANGUAGES) {
    describe(language, () => {
      const translations = flatten(resources[language].translation);

      it('has the same keys as English', () => {
        expect([...translations.keys()].sort()).toEqual([...english.keys()].sort());
      });

      it('has a non-empty string for every key', () => {
        for (const [key, value] of translations) {
          expect(typeof value === 'string' && value.trim() !== '', key).toBe(true);
        }
      });

      it('uses the same placeholders as English', () => {
        for (const [key, value] of translations) {
          expect(placeholders(value), key).toEqual(placeholders(english.get(key)));
        }
      });
    });
  }
});

describe('detectLanguage', () => {
  it('prefers the stored language', () => {
    expect(detectLanguage('sv', ['fi-FI'])).toBe('sv');
  });

  it('ignores an unsupported stored language', () => {
    expect(detectLanguage('de', ['fi'])).toBe('fi');
  });

  it('matches browser languages by their primary subtag', () => {
    expect(detectLanguage(null, ['de-DE', 'sv-FI', 'en-US'])).toBe('sv');
    expect(detectLanguage(null, ['FI-fi'])).toBe('fi');
  });

  it('falls back to English', () => {
    expect(detectLanguage(null, [])).toBe('en');
    expect(detectLanguage(null, ['de', 'nb'])).toBe('en');
  });
});
