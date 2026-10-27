import { describe, expect, it } from 'vitest';
import { generateSecret } from './secret';
import { CLASSIC, type GameConfig } from './types';

// Deterministic pseudo-random generator (mulberry32) for repeatable tests.
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('generateSecret', () => {
  it('generates a code of the configured length from the palette', () => {
    const random = seeded(1);
    for (let i = 0; i < 100; i++) {
      const secret = generateSecret(CLASSIC, random);
      expect(secret).toHaveLength(CLASSIC.pegs);
      for (const color of secret) {
        expect(CLASSIC.colors).toContain(color);
      }
    }
  });

  it('never repeats a color when duplicates are not allowed', () => {
    const config: GameConfig = { ...CLASSIC, pegs: 6, allowDuplicates: false };
    const random = seeded(2);
    for (let i = 0; i < 100; i++) {
      expect(new Set(generateSecret(config, random)).size).toBe(6);
    }
  });

  it('is deterministic for a given random source', () => {
    expect(generateSecret(CLASSIC, seeded(42))).toEqual(generateSecret(CLASSIC, seeded(42)));
  });

  it('uses only the colors of a custom palette', () => {
    const config: GameConfig = { ...CLASSIC, colors: ['blue', 'orange', 'white', 'black'] };
    const random = seeded(3);
    for (let i = 0; i < 100; i++) {
      for (const color of generateSecret(config, random)) {
        expect(config.colors).toContain(color);
      }
    }
  });

  it('handles random() values close to 1', () => {
    const secret = generateSecret(CLASSIC, () => 0.999999);
    expect(secret).toEqual(['purple', 'purple', 'purple', 'purple']);
  });
});
