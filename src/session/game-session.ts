import {
  CLASSIC, makeGuess, newGame, restoreGame, serializeGame, startGame,
  type Code, type GameConfig, type GameState, type StartedState,
} from '../game';
import { browserStorage, STORAGE_KEYS, type KeyValueStore } from './storage';

// The current game, shared by the components that show it. Every change is saved, so a reload
// continues where the player left off. Components get it with resolve(GameSession).
export class GameSession {
  private current: GameState;

  public constructor(private readonly storage: KeyValueStore = browserStorage) {
    this.current = this.load() ?? newGame();
  }

  public get state(): GameState {
    return this.current;
  }

  public start(config: GameConfig = CLASSIC): void {
    this.update(startGame(this.current, config));
  }

  public guess(code: Code): void {
    this.update(makeGuess(this.current, code));
  }

  // A new game with the same config as the current one.
  public playAgain(): void {
    if (this.current.status === 'setup') {
      throw new Error("Can't play again before a game has started");
    }
    this.update(startGame(newGame(), this.current.config));
  }

  public quit(): void {
    this.update(newGame());
  }

  private update(state: GameState): void {
    this.current = state;
    if (state.status === 'setup') {
      this.storage.remove(STORAGE_KEYS.game);
    } else {
      this.storage.set(STORAGE_KEYS.game, JSON.stringify(serializeGame(state)));
    }
  }

  private load(): StartedState | undefined {
    const saved = this.storage.get(STORAGE_KEYS.game);
    if (saved === null) {
      return undefined;
    }
    let state: StartedState | undefined;
    try {
      state = restoreGame(JSON.parse(saved));
    } catch {
      state = undefined;
    }
    if (!state) {
      this.storage.remove(STORAGE_KEYS.game);
    }
    return state;
  }
}
