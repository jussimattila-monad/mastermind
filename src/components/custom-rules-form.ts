import { bindable } from 'aurelia';
import { ALL_COLORS, MAX_GUESSES, MAX_PEGS } from '../game';
import type { ConfigDraft } from '../play/config-draft';

// The form for editing the custom rules. It changes the draft it is given and reports
// save and cancel through callbacks.
export class CustomRulesForm {
  @bindable public draft?: ConfigDraft;
  @bindable public save?: () => void;
  @bindable public cancel?: () => void;

  public readonly colors = ALL_COLORS;
  public readonly maxPegs = MAX_PEGS;
  public readonly maxGuesses = MAX_GUESSES;
}
