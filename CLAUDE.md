# Mastermind

A Mastermind code-breaking game built with Aurelia 2 (`2.0.0-rc.2`), TypeScript 6 and Vite 7.
Deployed to GitHub Pages at https://jussimattila-monad.github.io/mastermind/.

## Commands

```bash
npm start           # dev server on http://localhost:9000
npm run lint        # ESLint (src/, e2e/, playwright.config.ts) + Stylelint (src/**/*.css)
npm run typecheck   # tsc, strict, no emit
npm test            # Vitest unit tests (src/**/*.test.ts)
npm run build       # production build into dist/
npm run preview     # serve dist/ under its base path on http://localhost:9001/mastermind/
npm run check       # lint, typecheck, test, build
npm run e2e         # Playwright browser tests (e2e/*.e2e.ts) against the dev server
E2E_BASE_URL=https://jussimattila-monad.github.io/mastermind/ npm run e2e  # or any deployed URL
```

A change is done only when `npm run check` passes; run `npm run e2e` too when it changes what
the browser shows. `e2e` stays out of `check` because it needs a browser. Locally, Playwright
uses the Chromium in `~/.cache/ms-playwright`; `@playwright/test` is pinned to match it.
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
- `e2e/`: Playwright tests; `helpers.ts` seeds a saved game with a known secret.
  `playwright.config.ts` starts the dev server unless `E2E_BASE_URL` is set.

## GitHub Actions

Pages serves the `gh-pages` branch: production at its root, PR previews under `pr-preview/`.

| Workflow | File | Runs on | Does |
|---|---|---|---|
| Deploy production | `deploy-production.yml` | push to `main`, manual | `npm run check`, push `dist/` to `gh-pages` (keeps `pr-preview/`) |
| Deploy PR preview | `deploy-pr-preview.yml` | PR opened/updated/closed | `npm run check`, deploy to `/mastermind/pr-preview/pr-<number>/`, comment the link, `npm run e2e` against it; removes it on close |
| Respond to @claude | `claude.yml` | `@claude` in issues, PRs, reviews | Runs Claude Code on the request |
| pages-build-deployment | GitHub built-in | push to `gh-pages` | Publishes the branch; it can't be renamed and goes away only if Pages stops serving a branch, which would end PR previews |

PRs from forks (and Dependabot) get no preview: their read-only token can't push to `gh-pages`, so both preview jobs are skipped.

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
- Behavior that only the browser shows (rendering, focus, keyboard, storage, translations) gets an
  e2e test. Use role and label locators, and navigate with `page.goto('./')` so the base path holds.
- Dependency versions are pinned on purpose: Aurelia packages exactly, `typescript` to `~6.0`
  (typescript-eslint supports `<6.1`). Don't bump them as a side effect of other work.
