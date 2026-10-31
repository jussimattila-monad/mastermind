import { DEFAULT_CUSTOM, parseConfig, validateConfig, type GameConfig } from '../game';
import { browserStorage, STORAGE_KEYS, type KeyValueStore } from './storage';

// The rules for "Play custom Mastermind". They outlive any one game and are saved when the
// player saves them, so a return visit starts from the last rules. Components get it with
// resolve(CustomRules).
export class CustomRules {
  private current: GameConfig;

  public constructor(private readonly storage: KeyValueStore = browserStorage) {
    this.current = this.load() ?? DEFAULT_CUSTOM;
  }

  public get config(): GameConfig {
    return this.current;
  }

  // Throws if the config breaks a rule; the saved rules stay as they were.
  public save(config: GameConfig): void {
    validateConfig(config);
    this.current = { ...config, colors: [...config.colors] };
    this.storage.set(STORAGE_KEYS.customRules, JSON.stringify(this.current));
  }

  private load(): GameConfig | undefined {
    const saved = this.storage.get(STORAGE_KEYS.customRules);
    if (saved === null) {
      return undefined;
    }
    let config: GameConfig | undefined;
    try {
      config = parseConfig(JSON.parse(saved));
    } catch {
      config = undefined;
    }
    if (!config) {
      this.storage.remove(STORAGE_KEYS.customRules);
    }
    return config;
  }
}
