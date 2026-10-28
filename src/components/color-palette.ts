import { bindable } from 'aurelia';
import type { Color } from '../game';

// The colors the player can pick. Number hints match the keyboard shortcuts (1–9).
export class ColorPalette {
  @bindable public colors: readonly Color[] = [];
  @bindable public pick?: (color: Color) => void;
}
