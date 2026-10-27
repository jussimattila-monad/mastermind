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
```

A change is done only when `npm run lint && npm run typecheck && npm test && npm run build` passes.
CI runs the same steps before deploying, so a failure blocks the deploy.

## Structure

- `src/main.ts`: bootstraps Aurelia with the root component `MyApp`.
- `src/my-app.ts` + `src/my-app.html`: root component.
- `src/resource.d.ts`: module declarations for `.html` and `.css` imports.
- `src/game/`: game rules, no Aurelia imports; components import from `src/game/index.ts`.
  State is immutable: `newGame()` (setup) → `startGame()` (playing) → `makeGuess()` (won/lost).
  `Color` is a union of the supported colors in `ALL_COLORS`; `GameConfig.colors` picks the palette.
- `vite.config.ts`: `base` is `/mastermind/` for builds (GitHub Pages) and `/` in dev.
- `.github/workflows/deploy.yml`: lint, typecheck, test, build, deploy to Pages on push to `main`.

## Aurelia conventions

- Components are convention-based: `foo-bar.ts` exporting `class FooBar` pairs automatically
  with `foo-bar.html` (and `foo-bar.css` if present). Don't add `@customElement` decorators
  unless a convention can't express the need.
- Use components from templates with `<import from="./foo-bar"></import>`, or register them
  globally in `main.ts` only if they're used everywhere.
- Templates use `${expr}` interpolation and `.bind` / `.trigger` bindings.
- Use Aurelia 2 APIs only (`aurelia`, `@aurelia/*`). Aurelia 1 examples (`aurelia-framework`,
  `@autoinject`, `PLATFORM.moduleName`) don't apply.

## Code guidelines

- Keep game rules (secret generation, scoring of black/white pegs, win/loss) in plain
  TypeScript modules with no Aurelia imports, so they're easy to test and reason about.
  Components handle presentation and user input only.
- TypeScript is `strict`; don't weaken it with `any` or non-null assertions to silence errors.
- Asset and link URLs must work under the `/mastermind/` base path; don't hard-code `/`.
- Dependency versions are pinned on purpose: Aurelia packages exactly, `typescript` to `~6.0`
  (typescript-eslint supports `<6.1`). Don't bump them as a side effect of other work.
