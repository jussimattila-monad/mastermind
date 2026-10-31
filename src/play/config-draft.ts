import { ALL_COLORS, MAX_GUESSES, MAX_PEGS, MIN_COLORS, type Color, type GameConfig } from '../game';

// Why a draft can't be saved: a key under `custom.errors` in the translations, and its params.
export interface DraftError {
  readonly key: 'pegs' | 'guesses' | 'colors' | 'duplicates';
  readonly params: Readonly<Record<string, number>>;
}

// The custom rules form while the player edits them. Nothing is saved until the player saves
// a draft that has no error. Arrays are replaced rather than mutated so that bindings
// observing `colors` see every change.
export class ConfigDraft {
  public pegs: number;
  public maxGuesses: number;
  public allowDuplicates: boolean;
  public colors: readonly Color[];

  public constructor(config: GameConfig) {
    this.pegs = config.pegs;
    this.maxGuesses = config.maxGuesses;
    this.allowDuplicates = config.allowDuplicates;
    this.colors = ALL_COLORS.filter(color => config.colors.includes(color));
  }

  // The first problem, or undefined when the draft is a valid config.
  public get error(): DraftError | undefined {
    if (!Number.isInteger(this.pegs) || this.pegs < 1 || this.pegs > MAX_PEGS) {
      return { key: 'pegs', params: { max: MAX_PEGS } };
    }
    if (!Number.isInteger(this.maxGuesses) || this.maxGuesses < 1 || this.maxGuesses > MAX_GUESSES) {
      return { key: 'guesses', params: { max: MAX_GUESSES } };
    }
    if (this.colors.length < MIN_COLORS) {
      return { key: 'colors', params: { min: MIN_COLORS } };
    }
    if (!this.allowDuplicates && this.pegs > this.colors.length) {
      return { key: 'duplicates', params: { pegs: this.pegs, colors: this.colors.length } };
    }
    return undefined;
  }

  public get canSave(): boolean {
    return this.error === undefined;
  }

  // The config this draft describes, or undefined while it has an error.
  public toConfig(): GameConfig | undefined {
    if (this.error) {
      return undefined;
    }
    return {
      pegs: this.pegs,
      colors: this.colors,
      maxGuesses: this.maxGuesses,
      allowDuplicates: this.allowDuplicates,
    };
  }

  // Adds the color to the palette, or removes it; the palette keeps the order of ALL_COLORS.
  public toggleColor(color: Color): void {
    this.colors = ALL_COLORS.filter(c => c === color ? !this.colors.includes(c) : this.colors.includes(c));
  }
}
