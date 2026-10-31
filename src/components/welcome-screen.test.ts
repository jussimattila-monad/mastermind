import { DI, Registration } from '@aurelia/kernel';
import { describe, expect, it } from 'vitest';
import { CLASSIC, DEFAULT_CUSTOM, type GameConfig } from '../game';
import { CustomRules } from '../session/custom-rules';
import { GameSession } from '../session/game-session';
import type { KeyValueStore } from '../session/storage';
import { WelcomeScreen } from './welcome-screen';

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

// The container resolves the screen's dependencies the way the app does.
function setup() {
  const storage = new MemoryStorage();
  const container = DI.createContainer();
  container.register(
    Registration.instance(GameSession, new GameSession(storage)),
    Registration.instance(CustomRules, new CustomRules(storage)),
  );
  return {
    screen: container.invoke(WelcomeScreen),
    session: container.get(GameSession),
    rules: container.get(CustomRules),
  };
}

function startedConfig(session: GameSession): GameConfig {
  const { state } = session;
  if (state.status === 'setup') {
    throw new Error('Expected a started game');
  }
  return state.config;
}

describe('WelcomeScreen', () => {
  it('starts classic rules', () => {
    const { screen, session } = setup();
    screen.play();
    expect(startedConfig(session)).toEqual(CLASSIC);
  });

  it('starts the saved custom rules, which are the defaults at first', () => {
    const { screen, session } = setup();
    screen.playCustom();
    expect(startedConfig(session)).toEqual(DEFAULT_CUSTOM);
  });

  it('edits a draft of the custom rules that changes nothing until saved', () => {
    const { screen, rules } = setup();
    screen.edit();
    expect(screen.draft?.pegs).toBe(DEFAULT_CUSTOM.pegs);
    if (screen.draft) {
      screen.draft.pegs = 2;
    }
    expect(rules.config).toEqual(DEFAULT_CUSTOM);
  });

  it('saves a valid draft, closes the form and plays the saved rules', () => {
    const { screen, session, rules } = setup();
    screen.edit();
    if (screen.draft) {
      screen.draft.pegs = SMALL.pegs;
      screen.draft.maxGuesses = SMALL.maxGuesses;
      screen.draft.allowDuplicates = SMALL.allowDuplicates;
      screen.draft.colors = SMALL.colors;
    }
    screen.save();
    expect(screen.draft).toBeUndefined();
    expect(rules.config).toEqual(SMALL);
    screen.playCustom();
    expect(startedConfig(session)).toEqual(SMALL);
  });

  it('keeps the form open and the saved rules when the draft has an error', () => {
    const { screen, rules } = setup();
    screen.edit();
    if (screen.draft) {
      screen.draft.colors = ['red'];
    }
    screen.save();
    expect(screen.draft).toBeDefined();
    expect(rules.config).toEqual(DEFAULT_CUSTOM);
  });

  it('discards the draft on cancel', () => {
    const { screen, rules } = setup();
    screen.edit();
    if (screen.draft) {
      screen.draft.pegs = 2;
    }
    screen.cancel();
    expect(screen.draft).toBeUndefined();
    expect(rules.config).toEqual(DEFAULT_CUSTOM);
  });
});
