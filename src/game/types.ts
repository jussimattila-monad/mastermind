// All colors the game supports. The UI maps each one to its CSS value and label.
export const ALL_COLORS = [
  'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'cyan', 'white', 'black',
] as const;

export type Color = typeof ALL_COLORS[number];

export type Code = readonly Color[];

export interface GameConfig {
  readonly pegs: number;
  // The palette for this game; the secret and guesses are drawn from it.
  readonly colors: readonly Color[];
  readonly maxGuesses: number;
  readonly allowDuplicates: boolean;
}

export const CLASSIC: GameConfig = Object.freeze({
  pegs: 4,
  colors: Object.freeze(['red', 'green', 'blue', 'yellow', 'orange', 'purple'] as const),
  maxGuesses: 10,
  allowDuplicates: true,
});

// The rules a player's custom game starts from, until they change them.
export const DEFAULT_CUSTOM: GameConfig = Object.freeze({
  pegs: 6,
  colors: CLASSIC.colors,
  maxGuesses: 10,
  allowDuplicates: true,
});

// The classic black (correctColorAndPosition) and white (correctColorWrongPosition) pegs.
export interface Feedback {
  readonly correctColorAndPosition: number;
  readonly correctColorWrongPosition: number;
}

export interface GuessResult {
  readonly guess: Code;
  readonly feedback: Feedback;
}

export interface SetupState {
  readonly status: 'setup';
}

export interface StartedState {
  readonly status: 'playing' | 'won' | 'lost';
  readonly config: GameConfig;
  readonly secret: Code;
  readonly guesses: readonly GuessResult[];
}

export type GameState = SetupState | StartedState;
