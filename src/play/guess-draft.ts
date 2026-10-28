import type { Code, Color } from '../game';

export type Slot = Color | null;

// The row the player is filling in. The active slot is where the next picked color goes;
// after a pick it moves to the next empty slot. Arrays are replaced rather than mutated so
// that bindings observing `slots` see every change.
export class GuessDraft {
  private currentSlots: readonly Slot[];
  private activeSlot = 0;

  public constructor(public readonly size: number) {
    this.currentSlots = Array<Slot>(size).fill(null);
  }

  public get slots(): readonly Slot[] {
    return this.currentSlots;
  }

  public get active(): number {
    return this.activeSlot;
  }

  // The complete guess, or undefined while a slot is empty.
  public get code(): Code | undefined {
    const colors = this.currentSlots.filter((slot): slot is Color => slot !== null);
    return colors.length === this.size ? colors : undefined;
  }

  public pick(color: Color): void {
    this.setSlot(this.activeSlot, color);
    this.activeSlot = this.nextEmpty(this.activeSlot) ?? Math.min(this.activeSlot + 1, this.size - 1);
  }

  public select(index: number): void {
    if (this.isSlot(index)) {
      this.activeSlot = index;
    }
  }

  public clear(index: number = this.activeSlot): void {
    if (this.isSlot(index)) {
      this.setSlot(index, null);
      this.activeSlot = index;
    }
  }

  // Clears the active slot if it is filled, otherwise the one before it.
  public backspace(): void {
    if (this.currentSlots[this.activeSlot] === null && this.activeSlot > 0) {
      this.activeSlot--;
    }
    this.setSlot(this.activeSlot, null);
  }

  public move(delta: number): void {
    this.activeSlot = Math.max(0, Math.min(this.size - 1, this.activeSlot + delta));
  }

  public reset(): void {
    this.currentSlots = Array<Slot>(this.size).fill(null);
    this.activeSlot = 0;
  }

  private isSlot(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < this.size;
  }

  private setSlot(index: number, slot: Slot): void {
    this.currentSlots = this.currentSlots.map((current, i) => i === index ? slot : current);
  }

  // The first empty slot after `from`, wrapping around to the start.
  private nextEmpty(from: number): number | undefined {
    for (let step = 1; step < this.size; step++) {
      const index = (from + step) % this.size;
      if (this.currentSlots[index] === null) {
        return index;
      }
    }
    return undefined;
  }
}
