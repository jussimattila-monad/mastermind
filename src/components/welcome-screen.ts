import { resolve } from 'aurelia';
import { CLASSIC } from '../game';
import { GameSession } from '../session/game-session';

// The view for the setup state. Only the classic game for now; a config form will later
// build the GameConfig that play() starts.
export class WelcomeScreen {
  public readonly config = CLASSIC;
  private readonly session = resolve(GameSession);

  public play(): void {
    this.session.start(this.config);
  }
}
