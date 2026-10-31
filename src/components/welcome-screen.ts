import { resolve } from 'aurelia';
import { CLASSIC } from '../game';
import { ConfigDraft } from '../play/config-draft';
import { CustomRules } from '../session/custom-rules';
import { GameSession } from '../session/game-session';

// The view for the setup state: play classic rules, or the custom rules the player has saved.
// Custom rules are edited in a draft and only change once saved, so the summary always shows
// what "Play custom Mastermind" will use.
export class WelcomeScreen {
  public readonly config = CLASSIC;
  public readonly rules = resolve(CustomRules);
  // Set while the player is editing the custom rules.
  public draft?: ConfigDraft;
  private readonly session = resolve(GameSession);

  public play(): void {
    this.session.start(this.config);
  }

  public playCustom(): void {
    this.session.start(this.rules.config);
  }

  public edit(): void {
    this.draft = new ConfigDraft(this.rules.config);
  }

  public save(): void {
    const config = this.draft?.toConfig();
    if (config) {
      this.rules.save(config);
      this.draft = undefined;
    }
  }

  public cancel(): void {
    this.draft = undefined;
  }
}
