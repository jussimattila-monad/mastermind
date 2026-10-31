import { describe, expect, it } from 'vitest';
import { DEFAULT_CUSTOM, type GameConfig } from '../game';
import { CustomRules } from './custom-rules';
import { STORAGE_KEYS, type KeyValueStore } from './storage';

class MemoryStorage implements KeyValueStore {
  public readonly items = new Map<string, string>();
  public get(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  public set(key: string, value: string): void {
    this.items.set(key, value);
  }
  public remove(key: string): void {
    this.items.delete(key);
  }
}

const SMALL: GameConfig = { pegs: 3, colors: ['red', 'blue', 'black'], maxGuesses: 5, allowDuplicates: false };

describe('CustomRules', () => {
  it('starts from the default rules without saving anything', () => {
    const storage = new MemoryStorage();
    expect(new CustomRules(storage).config).toEqual(DEFAULT_CUSTOM);
    expect(storage.items.size).toBe(0);
  });

  it('keeps saved rules after a reload', () => {
    const storage = new MemoryStorage();
    new CustomRules(storage).save(SMALL);
    expect(new CustomRules(storage).config).toEqual(SMALL);
  });

  it('rejects invalid rules and keeps the saved ones', () => {
    const storage = new MemoryStorage();
    const rules = new CustomRules(storage);
    rules.save(SMALL);
    expect(() => rules.save({ ...SMALL, colors: ['red'] })).toThrow(/colors/);
    expect(rules.config).toEqual(SMALL);
    expect(new CustomRules(storage).config).toEqual(SMALL);
  });

  it('falls back to the defaults and clears storage when the saved rules are corrupt', () => {
    const corrupt = ['not json', '{}', '{"pegs":3}', JSON.stringify({ ...SMALL, colors: ['red'] })];
    for (const saved of corrupt) {
      const storage = new MemoryStorage();
      storage.set(STORAGE_KEYS.customRules, saved);
      expect(new CustomRules(storage).config).toEqual(DEFAULT_CUSTOM);
      expect(storage.items.has(STORAGE_KEYS.customRules)).toBe(false);
    }
  });
});
