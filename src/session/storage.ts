export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export const STORAGE_KEYS = {
  game: 'mastermind:game',
  language: 'mastermind:lang',
} as const;

// localStorage can be unavailable (private mode, blocked site data) or full; the app then
// works as before, it just doesn't remember anything.
export const browserStorage: KeyValueStore = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Not saved; see above.
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Not removed; see above.
    }
  },
};
