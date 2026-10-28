import { bindable } from 'aurelia';
import type { ResultView } from '../play/board';

// Shown when the game is over: the outcome, the revealed secret and what to do next.
export class ResultPanel {
  @bindable public result?: ResultView;
  @bindable public playAgain?: () => void;
  @bindable public mainMenu?: () => void;
  public heading?: HTMLElement;

  public attached(): void {
    this.heading?.focus();
  }
}
