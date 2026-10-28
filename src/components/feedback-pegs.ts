import { bindable } from 'aurelia';
import type { Feedback } from '../game';

export type Dot = 'exact' | 'misplaced' | 'none';

// The feedback for one guess: a dot per peg, exact matches first. Without feedback
// (rows not guessed yet) every dot is empty.
export class FeedbackPegs {
  @bindable public feedback?: Feedback;
  @bindable public pegs = 4;

  public get dots(): Dot[] {
    const exact = this.feedback?.correctColorAndPosition ?? 0;
    const misplaced = this.feedback?.correctColorWrongPosition ?? 0;
    return Array.from({ length: this.pegs }, (_, i): Dot =>
      i < exact ? 'exact' : i < exact + misplaced ? 'misplaced' : 'none');
  }

  // Two rows of dots, like the physical board.
  public get columns(): number {
    return Math.ceil(this.pegs / 2);
  }
}
