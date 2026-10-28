import { bindable } from 'aurelia';
import type { Color } from '../game';

// One peg of a code; null is an empty hole.
export class CodePeg {
  @bindable public color: Color | null = null;
}
