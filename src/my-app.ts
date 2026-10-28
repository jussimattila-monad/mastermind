import { resolve } from 'aurelia';
import { GameSession } from './session/game-session';

export class MyApp {
  public readonly session = resolve(GameSession);
}
