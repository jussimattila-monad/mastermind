import type { Code, Color, GameConfig } from './types';

export function generateSecret(config: GameConfig, random: () => number = Math.random): Code {
  const pick = (max: number) => Math.floor(random() * max);

  if (config.allowDuplicates) {
    return Array.from({ length: config.pegs }, () => config.colors[pick(config.colors.length)]);
  }

  // Partial Fisher–Yates: shuffle only the first `pegs` positions.
  const pool: Color[] = [...config.colors];
  for (let i = 0; i < config.pegs; i++) {
    const j = i + pick(pool.length - i);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, config.pegs);
}
