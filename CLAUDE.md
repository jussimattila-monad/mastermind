# Mastermind

A Mastermind code-breaking game built with Aurelia 2 (`2.0.0-rc.2`), TypeScript 6 and Vite 7.
Deployed to GitHub Pages at https://jussimattila-monad.github.io/mastermind/.

## Commands

```bash
npm start           # dev server on http://localhost:9000
npm run lint        # ESLint (src/**/*.ts) + Stylelint (src/**/*.css)
npm run typecheck   # tsc, strict, no emit
npm test            # Vitest unit tests (src/**/*.test.ts)
npm run build       # production build into dist/
npm run preview     # serve dist/ under its base path on http://localhost:4173/mastermind/
npm run check       # lint, typecheck, test, build
```

A change is done only when `npm run check` passes.
Commit with `/commit`; the message format is defined in `.claude/commands/commit.md`.
CI runs the same steps before deploying, so a failure blocks the deploy.
Keep scripts free of hooks that repeat these steps (e.g. a `pretest` that lints).

## Structure

- `src/main.ts`: registers i18n with the detected language, loads `styles.css`, starts `MyApp`.
- `src/my-app.*`: root component; header with the language picker, then `welcome-screen` in
  setup and `game-board` otherwise. Views follow the game state; there is no router.
- `src/resource.d.ts`: module declarations for `.html` and `.css` imports.
- `vite.config.ts`: `base` is `/mastermind/` for builds and `vite preview` (GitHub Pages),
  `BASE_PATH` if set (PR previews), and `/` in dev.
- `.github/workflows/deploy.yml`: lint, typecheck, test, build, then push `dist/` to the
  `gh-pages` branch (which Pages serves) on push to `main`. Leaves `pr-preview/` untouched.
- `.github/workflows/pr-preview.yml`: same checks on each PR, then deploys a preview to
  `/mastermind/pr-preview/pr-<number>/` and comments the link; removes it when the PR closes.
  Previews don't work for PRs from forks.

## Layers

The UI is layered so a redesign changes only templates and CSS. Each layer may use only the
layers listed before it. `main.ts` wires everything up and sits outside the layers.

| Layer | Where | Job | Aurelia? |
|---|---|---|---|
| Rules | `src/game/` | Secret, scoring, transitions, save/restore | no |
| Translations | `src/i18n/` | Locale files, supported languages, `detectLanguage` | no |
| Session | `src/session/` | `GameSession`: current state, commands, saving | no |
| Play | `src/play/` | `GuessDraft` (input row), `keyToCommand`, `buildBoard` → `BoardView` | no |
| Containers | `my-app`, `welcome-screen`, `game-board`, `language-picker` | Connect services (session, play, i18n) to the view | yes |
| Presentational | other `src/components/` | Render bindables, report input via callbacks | yes |
| Theme | `src/styles.css` | Design tokens: colors, sizes, light and dark | — |

- `src/game/`: components import from `src/game/index.ts`. State is immutable: `newGame()`
  (setup) → `startGame()` (playing) → `makeGuess()` (won/lost). `Color` is a union of the
  supported colors in `ALL_COLORS`; `GameConfig.colors` picks the palette. `validateConfig`
  caps `pegs` at `MAX_PEGS` (10) and `maxGuesses` at `MAX_GUESSES` (20).
- Saved game: localStorage key `mastermind:game`, `SavedGame` version 1 (config, secret,
  guesses only). `restoreGame` replays the guesses, so anything invalid falls back to setup.
  Change the format by bumping the version. The language is saved under `mastermind:lang`.
- Decisions belong in `buildBoard` (unit tested), not in templates: what can be submitted,
  guesses left, row kinds, when the secret is shown (only after the game ends).
- Only containers use `resolve(...)`. Presentational components take `@bindable` data and
  callbacks (`pick.bind="color => pick(color)"`) and never touch the session or storage.
- Game configuration goes in the setup view: build a `GameConfig` and call `session.start(config)`.
- Components use only the tokens in `styles.css`; each color in `ALL_COLORS` has a
  `--color-<name>` token and a `peg-<name>` class in `code-peg.css`.

## Translations

- `@aurelia/i18n` (i18next) with bundled JSON in `src/i18n/` (`en`, `fi`, `sv`). Templates use
  `t="key"`, `t="[aria-label]key"`, `t.bind` and `t-params.bind`; there is no hard-coded UI text.
- The language is the saved choice, then the browser's languages, then English (`detectLanguage`).
- Plurals use i18next suffixes (`_one`, `_other`) with `count`. Nested keys can be built from
  params: `"Position {{n}}: $t(colors.{{color}})"`.
- To add a language: copy `en.json`, translate it, import it in `src/i18n/index.ts`, and add it
  to `LANGUAGES`, `LANGUAGE_NAMES` (in its own name) and `resources`. `locales.test.ts` fails if
  any language's keys or placeholders differ from English. A language whose plurals need other
  suffixes (`_few`, `_many`) needs that test to compare plural keys by base name instead.

## Aurelia conventions

- Components are convention-based: `foo-bar.ts` exporting `class FooBar` pairs automatically
  with `foo-bar.html` (and `foo-bar.css` if present). Don't add `@customElement` decorators
  unless a convention can't express the need.
- Use components from templates with `<import from="./foo-bar"></import>`, or register them
  globally in `main.ts` only if they're used everywhere.
- Templates use `${expr}` interpolation and `.bind` / `.trigger` bindings.
- Getters used in templates are observed through proxies and must not mutate anything, not even
  a freshly mapped array (`push`, `fill`); Aurelia throws AUR0227 and the view stays empty.
  Classes they read should replace arrays rather than mutate them (see `GuessDraft`).
- `if` / `else` cache their views: a component hidden and shown again is the same instance.
  Reset per-game state in `binding()`, not the constructor (see `GameBoard`).
- `repeat` matches items by identity, so repeating over objects that are rebuilt on every change
  (like `BoardView` rows) recreates the elements and loses keyboard focus. Repeat by index
  (`repeat.for="i of rows.length"`) when elements can have focus.
- CSS class names are kebab-case (Stylelint), e.g. `row-current`, not BEM `row--current`.
- The dev server notices a new `foo-bar.css` for an existing component only after a restart.
- Use Aurelia 2 APIs only (`aurelia`, `@aurelia/*`). Aurelia 1 examples (`aurelia-framework`,
  `@autoinject`, `PLATFORM.moduleName`) don't apply.

## Code guidelines

- Keep game rules (secret generation, scoring of black/white pegs, win/loss) in plain
  TypeScript modules with no Aurelia imports, so they're easy to test and reason about.
  Components handle presentation and user input only (see Layers).
- TypeScript is `strict`; don't weaken it with `any` or non-null assertions to silence errors.
- Asset and link URLs must work under the `/mastermind/` base path; don't hard-code `/`.
- Dependency versions are pinned on purpose: Aurelia packages exactly, `typescript` to `~6.0`
  (typescript-eslint supports `<6.1`). Don't bump them as a side effect of other work.
