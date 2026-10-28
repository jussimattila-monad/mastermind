> **Historical record, not maintained.** This is the plan as it was approved, kept unchanged as a
> record of how the work was planned. It describes the code as it was then, so follow
> [CLAUDE.md](../../CLAUDE.md) and the code where they differ. What was actually done, including
> changes to the plan, is in [Outcome](#outcome) at the end.
>
> - **Planned:** 2026-10-27 (plan approved 10:03 EET)
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

*Added afterwards, on 2026-10-28, from the planning session's transcript, its commits and the PR #3
description.*

### Planning

The first draft asked which rule set to target and whether to add a test runner. Instead of
answering, the user asked for `Color` to be a union of preset colors that the game supports. The
plan was updated and approved at 10:03 EET.

### As planned

The rules were built as planned: `types.ts`, `config.ts`, `secret.ts`, `score.ts`, `game.ts` and
`index.ts` in `src/game/`. Vitest 5.0.5 works with the existing Vite config, so the fallback
`vitest.config.ts` wasn't needed.

### Changes from the plan

- **Reviewer findings:** the `reviewer` agent ran as planned and found no scoring or win/loss bugs.
  It found two ways saved state could change afterwards:
  - `makeGuess` stored the caller's array, so a UI that reused its input row would have changed
    earlier guesses. It now stores a copy.
  - Every game shared the mutable `CLASSIC` object. `CLASSIC` is now frozen, `startGame` copies the
    config, and the state and config types are read-only.
  - Also from the review: `score` and `generateSecret` don't validate their input, so they're no
    longer exported. More tests took the total from 31 to 36.
- **No `pretest` hook:** the plan kept the hook that linted before `npm test`. The user had it
  removed: "we never want to do unnecessary repeated work". CI then ran plain `npm test`.

### Added beyond the plan, at the user's request

- **`npm run check`:** one command for lint, typecheck, test and build. It became the
  done-criterion in CLAUDE.md. CI kept separate steps, so its log shows which step failed.
- **`/commit` command** (`.claude/commands/commit.md`):
  - The first proposal had no type prefixes.
  - The user asked for structure like the
    [commit command reference](https://nikiforovall.blog/claude-code-rules/component-reference/commands/commit/),
    simplified for this project.
  - The result: an emoji, a type and a scope; six types; scopes for the project's areas.
  - It made the PR's first three commits.
- **PR previews:** after opening PR #3, the user asked for previews with
  [Deploy PR Preview](https://github.com/marketplace/actions/deploy-pr-preview).
  - `pr-preview.yml` deploys each PR to `/mastermind/pr-preview/pr-<number>/`.
  - Production moved to a `gh-pages` branch (JamesIves/github-pages-deploy-action).
  - The build base became configurable with `BASE_PATH`, and `public/.nojekyll` was added.
  - The user chose to commit this into PR #3 rather than a PR of its own.
  - After merging, the Pages source was switched to the `gh-pages` branch.

### Later changes to this code

- PR #4 capped configs at `MAX_PEGS` (10) and `MAX_GUESSES` (20) after a review found that an
  oversized saved config could freeze the app.
- The free game configuration the setup phase was designed for hasn't been built yet.
