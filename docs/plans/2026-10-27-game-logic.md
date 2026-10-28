> **Historical record, not maintained.** This is the plan as it was approved, kept unchanged as a
> record of how the work was planned. It describes the code as it was then, so follow
> [CLAUDE.md](../../CLAUDE.md) and the code where they differ. What was actually done, including
> changes to the plan, is in [Outcome](#outcome) at the end.
>
> - **Planned:** 2026-10-27 (plan last edited 10:00 EET)
> - **Carried out:** 2026-10-27, in [PR #3](https://github.com/jussimattila-monad/mastermind/pull/3) (merged 15:14 EET)

# Plan: Mastermind game logic

## Context
The app is still the Aurelia "Hello, world!" scaffold. Before building UI, we need the game rules
(setup, secret generation, scoring, win/loss) as plain TypeScript with no Aurelia imports, per
CLAUDE.md. Decided with user: classic rules as the default but fully configurable, including
*which* colors are used (e.g. a colorblind-friendly palette); a `setup` phase before play so a UI
can later offer config choices; descriptive feedback names; Vitest for unit tests.

## Files (all new unless noted)

### `src/game/types.ts`
- `Color` is a union of string literals for the colors the game supports, derived from one
  constant so the type and the runtime list can't drift apart:
  ```ts
  export const ALL_COLORS = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'cyan', 'white', 'black'] as const;
  export type Color = typeof ALL_COLORS[number]; // 'red' | 'green' | ...
  ```
  An unsupported color is a compile error, and `switch` over `Color` is exhaustiveness-checked.
  The logic only compares colors for equality; the UI maps each `Color` to its CSS value and label.
- `type Code = readonly Color[]`
- `interface GameConfig { pegs: number; colors: readonly Color[]; maxGuesses: number; allowDuplicates: boolean }`
  - `colors` is the palette for this game, a subset of `ALL_COLORS`; the secret and guesses are
    drawn from it, so a colorblind-friendly set is just a different selection of supported colors.
- `const CLASSIC: GameConfig = { pegs: 4, colors: ['red', 'green', 'blue', 'yellow', 'orange', 'purple'], maxGuesses: 10, allowDuplicates: true }`
- `interface Feedback { correctColorAndPosition: number; correctColorWrongPosition: number }`
  (the classic black / white pegs).
- `interface GuessResult { guess: Code; feedback: Feedback }`
- Game state as a discriminated union on `status`:
  ```ts
  type GameState =
    | { status: 'setup' }
    | { status: 'playing' | 'won' | 'lost'; config: GameConfig; secret: Code; guesses: readonly GuessResult[] };
  ```
  Setup carries no secret, so the type system prevents guessing before the game starts.

### `src/game/config.ts`
- `validateConfig(config)`: `pegs`, `maxGuesses` positive integers; `colors` non-empty and unique (membership in `ALL_COLORS` is enforced by the type);
  `pegs <= colors.length` when duplicates are disallowed. Throws with a clear message.

### `src/game/secret.ts`
- `generateSecret(config, random: () => number = Math.random): Code` — picks from `config.colors`.
  Injectable RNG keeps tests deterministic. Without duplicates: partial Fisher–Yates over the palette.

### `src/game/score.ts`
- `score(secret, guess): Feedback`
  1. `correctColorAndPosition` = positions where equal.
  2. Count colors in remaining (unmatched) positions of each;
     `correctColorWrongPosition` = Σ min(secretCount[c], guessCount[c]) (use a `Map<Color, number>`).
- `isValidGuess(guess, config)`: right length, every color in `config.colors`, duplicates rule respected.

### `src/game/game.ts`
Pure transitions over immutable state, so a component just holds the current `GameState`:
- `newGame(): GameState` → `{ status: 'setup' }`
- `startGame(state, config = CLASSIC, random?)`: requires `setup`; validates config,
  generates secret → `playing`.
- `makeGuess(state, guess)`: requires `playing`, rejects invalid guesses; appends result;
  → `won` when `correctColorAndPosition === pegs`, `lost` when guesses reach `maxGuesses`.
- `guessesLeft(state)`: only for started games.
- Back to setup for a new round is simply `newGame()`.

### `src/game/index.ts`
- Re-exports the public API for components.

### Tests: `src/game/*.test.ts`
- `score.test.ts`: all exact, all wrong-position, none, duplicate edge cases (secret
  `[red,red,blue,blue]` vs guess `[red,blue,red,red]` → 1 exact, 2 wrong-position; guess with more of a color than the secret).
- `secret.test.ts`: length, only palette colors, no duplicates when disallowed, seeded determinism,
  custom palette (e.g. colorblind set) is respected.
- `config.test.ts`: invalid configs throw (duplicate palette entries, `pegs > colors` without duplicates, zero values).
- `game.test.ts`: setup → playing; guessing in setup or after game over throws; win on exact guess;
  loss after `maxGuesses`; invalid guess rejected.

## Tooling changes
- `package.json`: add `vitest` devDependency (version compatible with Vite 7; don't touch other
  versions); script `"test": "vitest run"` (existing `pretest` lint hook stays).
- If the Aurelia Vite plugin interferes with tests, add a minimal `vitest.config.ts` without it
  (`environment: 'node'`, `include: ['src/**/*.test.ts']`).
- Import `describe/it/expect` from `vitest` explicitly — no globals, no tsconfig changes.
- `.github/workflows/deploy.yml`: add `npm test` step after typecheck.
- `CLAUDE.md`: add `npm test` to Commands and done-criteria; add `src/game/` to Structure.

## Out of scope (next step)
UI. The first setup screen will be a single "Start with classic rules" button calling
`startGame(state, CLASSIC)`; the setup state is designed so free configuration can be added later.

## Verification
`npm run lint && npm run typecheck && npm test && npm run build` all pass; then run the
`reviewer` subagent over the diff.

---

## Outcome

*Added afterwards, on 2026-10-28. Reconstructed from the commits and the PR #3 description; the
planning session itself isn't available.*

The rules were built as planned: `types.ts`, `config.ts`, `secret.ts`, `score.ts`, `game.ts` and
`index.ts` in `src/game/`, with 36 unit tests covering the cases the plan lists. Vitest 5.0.5 runs
with the existing Vite config; the fallback `vitest.config.ts` wasn't needed.

### Changes from the plan

- **Immutability is stricter than planned:** transitions copy the config and guess arrays the
  caller passes in, so the UI can reuse its input row without changing the guess history.
  `CLASSIC` is frozen.
- **The `pretest` lint hook was removed** instead of kept: it made lint run twice. `npm run check`
  (lint, typecheck, test, build) was added and became the done-criterion in CLAUDE.md.

### Added beyond the plan (same PR)

- **`/commit` command** (`.claude/commands/commit.md`): one commit message format for the project,
  used for every commit since.
- **PR previews:** `pr-preview.yml` deploys each PR to `/mastermind/pr-preview/pr-<number>/`. This
  moved production to a `gh-pages` branch (JamesIves/github-pages-deploy-action), made the build
  base configurable with `BASE_PATH`, and added `public/.nojekyll`.

### Not recorded

The plan's verification asked for a `reviewer` agent run. PR #3 doesn't say whether one ran.

### Later changes to this code

- PR #4 capped configs at `MAX_PEGS` (10) and `MAX_GUESSES` (20) after a review found that an
  oversized saved config could freeze the app.
- The free game configuration the plan prepared for (the setup phase) hasn't been built yet.
