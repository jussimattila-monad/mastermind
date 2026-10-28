import { describe, expect, it } from 'vitest';
import { CLASSIC, type Code, type GameConfig, type StartedState } from '../game';
import { GameSession } from './game-session';
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

function started(session: GameSession): StartedState {
  const state = session.state;
  if (state.status === 'setup') {
    throw new Error('Expected a started game');
  }
  return state;
}

// A guess guaranteed to differ from the secret in the first peg.
function wrongGuess(secret: Code, config: GameConfig = CLASSIC): Code {
  const other = config.colors.find(color => color !== secret[0]) ?? secret[0];
  return [other, ...secret.slice(1)];
}

describe('GameSession', () => {
  it('starts in setup when nothing is saved', () => {
    const storage = new MemoryStorage();
    expect(new GameSession(storage).state).toEqual({ status: 'setup' });
    expect(storage.items.size).toBe(0);
  });

  it('starts a classic game by default and saves it', () => {
    const storage = new MemoryStorage();
    const session = new GameSession(storage);
    session.start();
    expect(started(session).status).toBe('playing');
    expect(started(session).config).toEqual(CLASSIC);
    expect(storage.items.has(STORAGE_KEYS.game)).toBe(true);
  });

  it('continues a saved game after a reload', () => {
    const storage = new MemoryStorage();
    const session = new GameSession(storage);
    session.start();
    session.guess(wrongGuess(started(session).secret));

    const reloaded = new GameSession(storage);
    expect(reloaded.state).toEqual(session.state);
  });

  it('keeps a finished game after a reload', () => {
    const storage = new MemoryStorage();
    const session = new GameSession(storage);
    session.start();
    session.guess(started(session).secret);
    expect(new GameSession(storage).state.status).toBe('won');
  });

  it('plays again with the same config and a fresh game', () => {
    const session = new GameSession(new MemoryStorage());
    const config: GameConfig = { ...CLASSIC, maxGuesses: 1 };
    session.start(config);
    session.guess(wrongGuess(started(session).secret));
    expect(started(session).status).toBe('lost');

    session.playAgain();
    expect(started(session).status).toBe('playing');
    expect(started(session).config).toEqual(config);
    expect(started(session).guesses).toEqual([]);
  });

  it('cannot play again before a game has started', () => {
    expect(() => new GameSession(new MemoryStorage()).playAgain()).toThrow(/started/);
  });

  it('forgets the saved game when quitting', () => {
    const storage = new MemoryStorage();
    const session = new GameSession(storage);
    session.start();
    session.quit();
    expect(session.state).toEqual({ status: 'setup' });
    expect(storage.items.has(STORAGE_KEYS.game)).toBe(false);
  });

  it('starts over and clears storage when the saved game is corrupt', () => {
    for (const saved of ['not json', '{}', '{"version":1}']) {
      const storage = new MemoryStorage();
      storage.set(STORAGE_KEYS.game, saved);
      expect(new GameSession(storage).state).toEqual({ status: 'setup' });
      expect(storage.items.has(STORAGE_KEYS.game)).toBe(false);
    }
  });

  it('leaves the state unchanged when a rule is broken', () => {
    const session = new GameSession(new MemoryStorage());
    session.start();
    const before = session.state;
    expect(() => session.start()).toThrow(/playing/);
    expect(() => session.guess(['red'])).toThrow(/Invalid guess/);
    expect(session.state).toBe(before);
  });
});
