import { I18N } from '@aurelia/i18n';
import { resolve } from 'aurelia';
import { CLASSIC, type Color } from '../game';
import { buildBoard, type BoardView } from '../play/board';
import { GuessDraft } from '../play/guess-draft';
import { keyToCommand, type Command } from '../play/keyboard';
import { GameSession } from '../session/game-session';

// Connects the session and the input row to the presentational board components.
export class GameBoard {
  public rowsElement?: HTMLElement;
  private readonly session = resolve(GameSession);
  private readonly i18n = resolve(I18N);
  // Replaced in binding(): `if` caches this component, so the same instance shows every game.
  private draft = new GuessDraft(CLASSIC.pegs);

  // Undefined only for a moment after quitting, before this component is removed.
  public get board(): BoardView | undefined {
    const state = this.session.state;
    return state.status === 'setup' ? undefined : buildBoard(state, this.draft);
  }

  public binding(): void {
    const state = this.session.state;
    if (state.status !== 'setup') {
      this.draft = new GuessDraft(state.config.pegs);
    }
  }

  public pick(color: Color): void {
    if (this.board?.playing) {
      this.draft.pick(color);
    }
  }

  public select(index: number): void {
    this.draft.select(index);
  }

  public clear(): void {
    this.draft.reset();
  }

  public submit(): void {
    const code = this.draft.code;
    if (!this.board?.canSubmit || !code) {
      return;
    }
    // A focused slot turns into a plain peg once its row is submitted; keep focus in the board.
    const focusWasInRow = document.activeElement?.closest('.row-current') != null;
    this.session.guess(code);
    this.draft.reset();
    if (focusWasInRow) {
      // The new current row is rendered after this handler returns.
      queueMicrotask(() => this.rowsElement?.querySelector<HTMLElement>('.row-current .slot-active')?.focus());
    }
  }

  public playAgain(): void {
    this.session.playAgain();
    this.draft.reset();
  }

  public mainMenu(): void {
    this.session.quit();
  }

  public quit(): void {
    if (window.confirm(this.i18n.tr('game.confirmQuit'))) {
      this.session.quit();
    }
  }

  public run(command: Command): void {
    switch (command.type) {
      case 'pick': {
        const entry = this.board?.palette[command.index];
        if (entry) {
          this.pick(entry.color);
        }
        break;
      }
      case 'move':
        this.draft.move(command.delta);
        break;
      case 'backspace':
        this.draft.backspace();
        break;
      case 'clear':
        this.draft.clear();
        break;
      case 'submit':
        this.submit();
        break;
    }
  }

  public attached(): void {
    window.addEventListener('keydown', this.onKeyDown);
  }

  public detaching(): void {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const board = this.board;
    const command = board?.playing ? keyToCommand(event, board.palette.length) : undefined;
    if (!command || !this.handlesKey(event, command)) {
      return;
    }
    event.preventDefault();
    this.run(command);
  };

  // Form fields (e.g. the language picker) keep their keys. Enter on a button activates that
  // button, except on the board's own slot and palette buttons, where it submits the guess.
  private handlesKey(event: KeyboardEvent, command: Command): boolean {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('input, select, textarea')) {
      return false;
    }
    if (command.type === 'submit' && target?.closest('button, a')) {
      return target.closest('[data-board-input]') !== null;
    }
    return true;
  }
}
