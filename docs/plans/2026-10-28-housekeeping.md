> **Historical record, not maintained.** This is the plan as it was approved, kept unchanged as a
> record of how the work was planned. It describes the code as it was then, so follow
> [CLAUDE.md](../../CLAUDE.md) and the code where they differ. What was actually done, including
> changes to the plan, is in [Outcome](#outcome) at the end.
>
> - **Planned:** 2026-10-28 (plan last edited 12:14 EET)
> - **Carried out:** 2026-10-28, in [PR #5](https://github.com/jussimattila-monad/mastermind/pull/5)
>   (merged 12:58 EET), [PR #6](https://github.com/jussimattila-monad/mastermind/pull/6) (13:09) and
>   [PR #7](https://github.com/jussimattila-monad/mastermind/pull/7) (13:21)

# Housekeeping: workflows, browser tests, README, leftovers

## Context

The game UI shipped in PR #4. The repo still has bootstrap leftovers and some inconsistent
tooling:

- **GitHub Actions**: four workflows show in the Actions tab, named in different styles:
  `Claude Code` (claude.yml), `Deploy to GitHub Pages` (deploy.yml), `Deploy PR preview`
  (pr-preview.yml), and GitHub's built-in `pages-build-deployment`. That last one runs on every
  push to `gh-pages` because Pages serves that branch (`build_type: legacy`). It can't be renamed,
  and we're keeping it because the PR previews need the gh-pages branch. Also:
  - deploy.yml and pr-preview.yml repeat the same four check steps instead of using `npm run check`.
  - pr-preview.yml puts `if: github.event.action != 'closed'` on six separate steps.
  - claude.yml uses `checkout@v6` and the other two use `@v5`.
  - claude.yml doesn't let Claude run `npm test` or `npm run check`, but CLAUDE.md says a change
    is done only when `npm run check` passes.
- **Browser tests**: none in the repo. The 33 ad-hoc checks lived in a lost scratchpad, and
  nothing can test a chosen target (dev server, production or a PR preview).
- **README**: still the aurelia/new template, with the title `mastermind-tmp`.
- **Leftovers**:
  - Unused dependencies: `@aurelia/router`, `@aurelia/testing`, `vite-plugin-node-polyfills`.
    Nothing in `src/` imports them.
  - Stale branches: local and remote `add-claude-workflow` (PR #1, merged), and the remote
    `add-claude-github-actions-1792767584570`. That one is the auto-generated install branch;
    it was never merged and PR #1 superseded it.
  - The reviewer agent's checks skip `npm test`.

Decisions made: keep gh-pages and document `pages-build-deployment`; name workflows with verb
phrases; run e2e in CI against each PR preview; remove the three unused dependencies.

Work on a branch `housekeeping`, with commits split as in `.claude/commands/commit.md`, then open one PR.

## 1. Remove unused dependencies (`🔧 chore(deps)`)

- `npm uninstall @aurelia/router @aurelia/testing vite-plugin-node-polyfills`.
- `vite.config.ts`: drop the `nodePolyfills` import and plugin.
- Keep the change only if `npm run check` passes **and** the e2e suite from step 3 passes against
  the dev server and a production build (`npm run build && npx vite preview`). If the polyfills
  turn out to be needed (i18next shouldn't need them), restore that package and say so.
- Update the remaining pinned versions in CLAUDE.md only if they mention removed packages (they don't today).

## 2. Rename and harmonize workflows (`🔧 chore(ci)`)

| Old file / name | New file / name | Trigger |
|---|---|---|
| `deploy.yml` / Deploy to GitHub Pages | `deploy-production.yml` / **Deploy production** | push to main, manual |
| `pr-preview.yml` / Deploy PR preview | `deploy-pr-preview.yml` / **Deploy PR preview** | PR opened/updated/closed |
| `claude.yml` / Claude Code | `claude.yml` / **Respond to @claude** | `@claude` in issues/PRs |
| (built-in) pages-build-deployment | unchanged, documented | push to gh-pages |

Changes:
- `git mv` the files and set `name:`. Give each a top comment of one or two lines saying what it
  does and how it relates to the others. For example, deploy-production.yml pushes to gh-pages,
  and GitHub's pages-build-deployment then publishes it.
- **deploy-production.yml**: replace the four check steps with `run: npm run check`. Job id `deploy`.
- **deploy-pr-preview.yml**: split into two jobs instead of repeating per-step `if`s:
  - `deploy` (`if: github.event.action != 'closed'`): checkout, setup-node, `npm ci`,
    `npm run check` with `BASE_PATH` env (only `vite build` reads it), rossjrw/pr-preview-action,
    then the e2e steps from step 3.
  - `remove` (`if: github.event.action == 'closed'`): checkout + rossjrw/pr-preview-action (it
    removes the preview on `closed`).
- All workflows use `actions/checkout@v6` and `actions/setup-node@v5`.
- **claude.yml**: add `Bash(npm test)` and `Bash(npm run check)` to `--allowedTools`.
- Concurrency groups: keep `pages` for production and `preview-${{ github.ref }}` for previews.
- Note in the PR: renamed files start new entries in the Actions tab. The old entries keep their
  run history and disappear from the sidebar once their runs age out or are deleted.
- **CLAUDE.md** (Structure section): update the workflow file names and describe all four,
  including `pages-build-deployment`, so it's clear why there are four.

## 3. Playwright browser tests (`✅ test` + CI in the step-2 or its own `🔧 chore(ci)` commit)

Setup:
- Dev dependency `@playwright/test` pinned exactly to `1.64.1`, matching the Chromium build
  already installed locally (`~/.cache/ms-playwright/chromium_headless_shell-1248`, see memory
  `playwright-browser-testing`). This is a deliberate addition, so mention it in the commit body.
- `playwright.config.ts` at the root:
  - `testDir: 'e2e'`, `testMatch: '*.e2e.ts'`. This suffix keeps Vitest's default
    `*.spec.ts`/`*.test.ts` globs away from these files.
  - `use.baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:9000/'`.
  - `webServer` (`npm start`, `CI=1`, port 9000, `reuseExistingServer: true`) only when
    `E2E_BASE_URL` is unset. A URL starts nothing locally.
  - Chromium project only.
- Tests navigate with `page.goto('./')` so the base path is kept (`/mastermind/`,
  `/mastermind/pr-preview/pr-N/`). This means the base URL must end in `/`; the config adds one
  if it's missing.
- `package.json`: `"e2e": "playwright test"`. It stays out of `check`, which must keep working
  without a browser.
- `tsconfig.json` `include`: add `e2e` and `playwright.config.ts`. `lint:js`: lint `e2e/**/*.ts`
  as well.
- `.gitignore`: `/test-results`, `/playwright-report`.

Usage:
```
npm run e2e                                                          # dev server
E2E_BASE_URL=https://jussimattila-monad.github.io/mastermind/ npm run e2e   # production
E2E_BASE_URL=https://jussimattila-monad.github.io/mastermind/pr-preview/pr-5/ npm run e2e
```

Tests (`e2e/*.e2e.ts`) rewrite the lost checks. For a known secret, seed `mastermind:game` (a
`SavedGame` v1 from `src/game/save.ts`) with `page.addInitScript` before load. `restoreGame`
replays it.
- `app.e2e.ts`: the page loads under its base path with no failed requests and no console
  errors; the favicon and assets resolve; the welcome screen shows.
- `play.e2e.ts`:
  - start a game from the welcome screen
  - pick colors by clicking and by keyboard, and clear them
  - submit stays disabled until the row is full
  - a submitted guess shows black and white feedback (seeded secret)
  - win with the seeded secret: the result panel and secret are revealed
  - lose after `maxGuesses` wrong guesses
  - keyboard focus stays on the board after a guess (the PR #4 regression)
- `persistence.e2e.ts`: reload restores the game in progress; invalid saved data falls back to setup.
- `i18n.e2e.ts`: switching the language translates the UI and persists across a reload
  (`mastermind:lang`); the browser language (`locale: 'fi-FI'`) is detected.
- Use role- and label-based locators (`getByRole`, `getByLabel`). Read the component templates
  for the exact accessible names and translation keys (`src/components/*.html`, `src/i18n/en.json`).

CI, in deploy-pr-preview.yml `deploy` after the preview action:
1. `npx playwright install --with-deps chromium`.
2. Wait for the preview to go live. pages-build-deployment has to finish first, which takes about
   45 s. Poll the action's `preview-url` output until its HTML references the same
   `assets/index-*.js` as `dist/index.html`. Fail after ~5 min.
3. `npm run e2e` with `E2E_BASE_URL` set to that URL. If it fails, upload `playwright-report` as an artifact.

CLAUDE.md: add `npm run e2e` and `E2E_BASE_URL` to Commands. In the Code guidelines, say that
behavior visible only in the browser gets an e2e test.

## 4. README rewrite (`📝 docs`)

Written for visitors and contributors:
- What it is:
  - Mastermind in the browser: guess the hidden code; black pegs mean right color and position,
    white pegs mean right color in the wrong position.
  - Features: configurable pegs, colors, duplicates and guesses; keyboard play; English, Finnish
    and Swedish; light and dark themes; the game in progress is saved in the browser.
- Link to the live game and a short "How to play".
- Development: requirements (Node LTS), the npm commands including `check` and `e2e`, and where
  the code lives. Give the layer table in one line and point to CLAUDE.md for details rather than
  duplicating it.
- Deployment: main goes to production, each PR gets a preview, and what the four workflows are.
- Built with Aurelia 2, TypeScript, Vite, Vitest and Playwright.
- `package.json` `description`: "Mastermind code-breaking game in the browser, built with Aurelia 2."

## 5. Small fixes (`🔧 chore`, grouped by scope)

- `.claude/agents/reviewer.md`: step 2 runs `npm run check` (that also covers `npm test`). Use
  "colors" for consistent spelling.
- `.vscode/launch.json`: the deprecated `"type": "pwa-chrome"` becomes `"chrome"`.
- `.gitignore`: drop the template comments and `/.nyc_output`.
- `eslint.config.mjs`: `ecmaVersion: 2022` to match tsconfig's target.

## 6. Branch cleanup (after the PR merges; confirm with the user before running each command)

- `git branch -d add-claude-workflow`
- `git push origin --delete add-claude-workflow add-claude-github-actions-1792767584570`
- Update the memory file `housekeeping-backlog`: remove the done items, or delete the memory if
  nothing is left.

## Verification

- `npm run check` passes after each commit.
- `npm run e2e` passes locally against the dev server.
- It also passes against `npx vite preview` of a `BASE_PATH=/mastermind/` build, which proves the
  base path works and that removing the polyfills is safe.
- `E2E_BASE_URL=https://jussimattila-monad.github.io/mastermind/ npm run e2e` passes against
  current production. This confirms custom-target support.
- Push the branch and open the PR:
  - "Deploy PR preview" runs `deploy`, the preview comment appears, and e2e passes against the
    preview URL.
  - The Actions tab shows the new names.
- After merging: "Deploy production" runs, closing the PR runs the `remove` job, and the live site works.

---

## Outcome

*Added afterwards, on 2026-10-28, at the end of the session that carried out the plan.*

All six sections were carried out in PR #5, mostly as planned. Several issues came up along the
way. Two follow-up PRs fixed what showed up after merging, and upgraded everything to the latest
supported versions.

### Changes from the plan

- **`vite preview` served the wrong path:** it ran with the dev base `/` while the build loads its
  assets from `/mastermind/`, so every asset returned 404. It now uses the build's base.
  - Added `npm run preview`.
  - At the user's request, the preview runs on the fixed port 9001.
  - Both servers fail instead of moving when their port is taken. That way e2e can't test another
    app that happens to hold port 9000.
- **Testing a disabled Guess button:** Playwright won't click an `aria-disabled` button, so the
  "full row only" test presses Enter and force-clicks instead.
- **Node types:** TypeScript 6 no longer includes `@types/node` automatically, so
  `playwright.config.ts` references it explicitly.
- **Commit grouping:** the first commit also contains the two workflow file renames, with their
  content unchanged. Commits weren't amended, so it was left that way.

### Reviewer findings

The plan didn't include a reviewer run. It ran after the user asked about it. Its findings and the
fixes:
- The partial-row test passed whatever Enter did. It now checks that the row stays unchanged.
- The wait for a live preview now lasts up to 10 minutes and follows redirects.
- PRs from forks skip the preview jobs.
- Tests found the revealed secret by CSS class. It now has a screen reader label ("The secret
  code"), and the tests use that label.
- Doc mismatches were corrected.
- The dev server port is strict.

### After PR #5 was merged (PR #6)

- **Leftover files:** removing a preview kept its empty `.nojekyll`. The leftovers were deleted from
  `gh-pages` by hand, and the preview job now deletes `dist/.nojekyll` before deploying.
- **Skipped checks:** the PR checks showed a skipped job (a grey circle) next to the deploy job.
  Removing previews became its own workflow, **Remove PR preview**, so open PRs show only green
  ticks.
- **Branches:** the stale branches were deleted. The user turned on "Automatically delete head
  branches" in the repository settings.

### Beyond the plan: version upgrades (PR #7)

The plan deliberately kept the action versions. Afterwards, the user asked for everything on the
latest supported versions:
- Vite 8: the deprecated `esbuild` option was dropped, because Vite 8's default transform handles
  the decorators.
- ESLint 10, with `@eslint/js` as a direct dependency, and globals 17.
- Stylelint 17, with stylelint-config-standard 40.
- `@types/node` 24.
- `actions/checkout` and `actions/setup-node` v7.

TypeScript stays on 6.0, because typescript-eslint doesn't support 7 yet. CLAUDE.md now states the
policy and its exceptions.

### Left open

- The Node.js 20 warning comes from inside `rossjrw/pr-preview-action`. It goes away when that
  action releases its Node 24 update (upstream issue #135).
- Upgrade TypeScript to 7 once typescript-eslint supports it.
- Move `@types/node` to 26 when Node 26 becomes the LTS that CI runs.
