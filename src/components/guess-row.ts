import { bindable } from 'aurelia';
import type { RowView } from '../play/board';

// One row of the board. Only the current row is interactive: its slots are buttons
// that report which slot the player selected.
export class GuessRow {
  @bindable public row?: RowView;
  @bindable public select?: (index: number) => void;
}
