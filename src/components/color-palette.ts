import { bindable } from 'aurelia';
import type { Color } from '../game';
import type { PaletteEntry } from '../play/board';

// The colors the player can pick, with the number key for each one that has a key.
export class ColorPalette {
  @bindable public entries: readonly PaletteEntry[] = [];
  @bindable public pick?: (color: Color) => void;
}
