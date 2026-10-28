# Mastermind

The classic code-breaking game, in the browser.

**Play it:** https://jussimattila-monad.github.io/mastermind/

## How to play

The computer picks a secret code of 4 pegs from 6 colors; a color can appear more than once.
You have 10 guesses to crack it. After each guess you get feedback dots:

- a **filled dot** for each peg with the right color in the right place,
- a **ring** for each peg with the right color in the wrong place.

The dots don't tell you which pegs they mean; that's the puzzle.

Play with the mouse or the keyboard: number keys pick colors, arrow keys move between positions,
Backspace and Delete erase, and Enter submits the guess.

The game is in English, Finnish and Swedish (it follows your browser, or pick one), follows your
system's light or dark theme, and remembers a game in progress if you close the tab.

## Development

Requires Node.js (current LTS).

```bash
npm install
npm start           # dev server on http://localhost:9000
npm run check       # lint, typecheck, unit tests and production build
npm run e2e         # browser tests against the dev server
```

`npm run e2e` drives Chromium with [Playwright](https://playwright.dev). The first time, install
the browser with `npx playwright install --with-deps chromium`. To test a deployed copy instead
of the dev server, set `E2E_BASE_URL`:

```bash
E2E_BASE_URL=https://jussimattila-monad.github.io/mastermind/ npm run e2e
```

To try the production build locally, `npm run build && npm run preview` serves it at
http://localhost:9001/mastermind/, the same path as on GitHub Pages.

The game rules (`src/game/`) are plain TypeScript with no framework code. The UI is built in
layers on top of them, so a redesign touches only templates and CSS. [CLAUDE.md](CLAUDE.md) has
the details: layers, conventions, translations and how to add a language.

## Deployment

The site is served by GitHub Pages from the `gh-pages` branch.

- **Deploy production** checks and builds every push to `main` and publishes it.
- **Deploy PR preview** does the same for each pull request under
  `/mastermind/pr-preview/pr-<number>/`, comments the link and runs the browser tests against it.
- **Remove PR preview** removes the preview when the PR closes.
- **Respond to @claude** runs Claude Code when an issue or PR mentions `@claude`.
- **pages-build-deployment** is GitHub's own workflow that publishes `gh-pages` after each push.

## Built with

[Aurelia 2](https://aurelia.io), TypeScript, Vite, Vitest, Playwright and i18next.
