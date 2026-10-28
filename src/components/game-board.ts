import { I18N } from '@aurelia/i18n';
import { resolve } from 'aurelia';
import type { Color } from '../game';
import { buildBoard, type BoardView } from '../play/board';
import { GuessDraft } from '../play/guess-draft';
import { keyToCommand, type Command } from '../play/keyboard';
import { GameSession } from '../session/game-session';

// Connects the session and the input row to the presentational board components.
export class GameBoard {
  private readonly session = resolve(GameSession);
  private readonly i18n = resolve(I18N);
  private readonly draft: GuessDraft;

  public constructor() {
    const state = this.session.state;
    this.draft = new GuessDraft(state.status === 'setup' ? 0 : state.config.pegs);
  }

  // Undefined only for a moment after quitting, before this component is removed.
  public get board(): BoardView | undefined {
    const state = this.session.state;
    return state.status === 'setup' ? undefined : buildBoard(state, this.draft);
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
    if (this.board?.canSubmit && code) {
      this.session.guess(code);
      this.draft.reset();
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
        const color = this.board?.palette[command.index];
        if (color) {
          this.pick(color);
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
