> **Historical record, not maintained.** This is the plan as it was approved, kept unchanged as a
> record of how the work was planned. It describes the code as it was then, so follow
> [CLAUDE.md](../../CLAUDE.md) and the code where they differ. What was actually done, including
> changes to the plan, is in [Outcome](#outcome) at the end.
>
> - **Planned:** 2026-10-28
> - **Carried out:** 2026-10-28, in [PR #11](https://github.com/jussimattila-monad/mastermind/pull/11)

# Fit the game on a phone screen

## Context
On a Google Pixel (Chrome, ~412×775 CSS px visible below the toolbar) the game doesn't fit
vertically: while playing, the Quit link is cut off; after the game ends, the result panel's
buttons and bottom edge are cut off. Measured with headless Chromium at 412 px wide, both views
are ~810 px tall (rows 509 px: 10 rows of ~46 px, the current row 54 px). Width is fine.
Goal: the whole board plus controls (playing) or plus result panel (finished) fit in ~775 px
with margin, and also on shorter phones, without changing any logic. CSS only (Theme +
component CSS layers).

## Changes

1. **Current row same height as the others** — `src/components/guess-row.css`
   `.slot` adds `padding: 0.15rem` + `2px` border around each peg, making the current row 9 px
   taller and its pegs spaced wider than other rows (visible in the screenshot). Make `.slot`
   take no extra space (`padding: 0; border: none`) and draw the active ring without layout
   impact, e.g. `.slot-active { box-shadow: 0 0 0 2px var(--bg-or-surface), 0 0 0 4px var(--accent) }`
   (or `outline` with offset — but `:focus-visible` already uses outline, so use box-shadow and
   keep focus visible separately). Keep `border-radius: 50%`.
2. **Tighter rows** — `guess-row.css`: `.row` padding `0.3rem 0.6rem` → `0.15rem 0.6rem`
   (saves ~30 px over 10 rows; current row's highlight still has room).
3. **Tighter vertical spacing** — `my-app.css` header `margin-block-end: 1rem` → `0.5rem`;
   `game-board.css` `.game` gap `1rem` → `0.75rem`; `result-panel.css` padding/gap a little
   smaller (`0.75rem` / `0.5rem`). Together with 1–2 this brings 412 px-wide views to ~740 px.
4. **Shorter screens** — `src/styles.css` (tokens only): a height media query, e.g.
   `@media (max-height: 44rem) { :root { --peg-size: 1.85rem; } }`, so phones with ~640–700 px
   visible also fit. Pegs stay ≥ ~30 px; the slot/palette buttons remain tappable.

Final values are tuned by measuring (below), not guessed; keep to existing tokens.

## Tests
- New e2e test (e.g. `e2e/layout.e2e.ts`, or in `app.e2e.ts`): with viewport `412×775`
  (Pixel, Chrome toolbar shown) and a smaller one (`360×640`):
  - new game (via `seedGame` with no guesses): the Quit button is
    `toBeInViewport({ ratio: 1 })`, and `document.documentElement.scrollHeight <= innerHeight`;
  - finished game (`seedGame(savedGame([...wrong guesses, SECRET]))` with 9 guesses, as in the
    screenshot): the "Play again" / "Main menu" buttons are fully in the viewport.
  Uses role/label locators and `page.goto('./')` per CLAUDE.md.

## Verification
- Re-run the scratchpad measurement scripts (`measure.cjs`, `won.cjs`) at 412×775 and 360×640
  and check document height ≤ viewport; look at screenshots for both themes.
- `npm run check`, then `npm run e2e`.
- After merge, user re-checks on the Pixel (or a PR preview link).
- Add this plan with its outcome to `docs/plans/` per `docs/plans/README.md`; commit with `/commit`.

## Outcome

*Added afterwards, on 2026-10-28, at the end of the session that carried out the plan.*

### Planning

The user reported that the game didn't quite fit on their Google Pixel in Chrome. Their
screenshots showed vertical overflow: the Quit link cut off while playing, and the result panel's
buttons cut off after a game. Headless Chromium measured both views at about 810 px against about
775 px visible. The plan was approved without changes.

### Changes from the plan

- **Ring around the active slot:** it is a box shadow 1–3 px outside the peg, inside the row's
  padding. Its gap is `--surface`.
- **Row padding:** the first commit cut it to 0.2rem as planned. On the Pixel the rows then
  looked cramped, while the screen had about 70 px to spare. The user asked for more space, so
  the original 0.3rem came back. The page's top and bottom padding went down to 0.75rem instead.
- **Short screens:** the breakpoint is `height <= 48rem` (Stylelint requires the range syntax).
  Pegs there are 1.8rem rather than 1.85rem, so 412×700 and 360×740 fit. 360×640 still scrolls:
  fitting it would make pegs too small to tap.
- **Test sizes:** the e2e tests use 412×775 and 360×740. The plan's 360×640 was dropped, because
  that size scrolls.

### Reviewer findings

The project's reviewer agent ran on the branch. The user chose which findings to fix.
- **Fixed: focus and the active slot looked alike.** Without slot padding, the focus outline and
  the active ring were both accent-colored rings 2 px apart. A focused slot now has a `--text`
  outline.
- **Fixed: Finnish results scrolled.** The heading wrapped onto two lines and the buttons
  stacked. The result buttons now stay on one row and wrap their text instead, and the result
  heading is 1.25rem. The layout test checks the finished view in Finnish too.
- **Fixed: forced-colors mode.** Box shadows aren't drawn in that mode, so the active slot gets an
  outline in the `Highlight` system color there.
- **Kept: 5 px of slack at 412×775.** Raising the breakpoint to 50rem would have given the
  user's Pixel smaller pegs. The phone has about 70 px to spare, and the tight test is meant to
  catch growth.

### Beyond the plan

- **Red and orange:** the user found them too similar on the phone. Red is now `#cc1f2b` and orange
  `#fb8212`. Their OKLab distance went from 9.8 to 21.0, so they are no longer the classic
  palette's closest pair; blue and purple (12.5) are. Red to pink went from 7.9 to 12.4.

### Left open

- The PR's "This branch has not been deployed" panel: the preview is pushed to `gh-pages`, so
  GitHub records deployments only for `gh-pages` in the `github-pages` environment. An
  `environment` with the preview URL on the preview job would record one per PR; it is a separate
  CI change.
