---
description: Check and commit the current changes using the project's commit format
argument-hint: [optional context for the commit message]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git switch:*), Bash(npm run check)
---

Commit the current changes. Extra context from the user: $ARGUMENTS

## Workflow

1. Run `git status` and `git diff HEAD`, and read any new untracked files.
2. Group the changes into commits, one type per commit (see "Splitting").
3. Run `npm run check` once. If it fails, stop and report the failure; don't commit.
4. If on `main`, create a branch first: `git switch -c <short-kebab-case-name>`.
5. For each group: `git add <paths>`, then commit with a message in the format below.
6. Show `git log --oneline` for the new commits. Don't push, amend or rebase.

## Message format

```
<emoji> <type>(<scope>): <subject>

<Why: 1–3 sentences on the problem, need or decision behind the change.>

- <notable change>
- <notable change>

Co-Authored-By: Claude <model> <noreply@anthropic.com>
```

### Type (required)

| Emoji | Type       | Use for                                                     |
|-------|------------|-------------------------------------------------------------|
| ✨    | `feat`     | New behavior the player or a component can use              |
| 🐛    | `fix`      | Fixes wrong behavior                                        |
| ♻️    | `refactor` | Code changes that don't change behavior                     |
| ✅    | `test`     | Test-only changes                                           |
| 📝    | `docs`     | Documentation only (README, CLAUDE.md, comments)            |
| 🔧    | `chore`    | Tooling, dependencies, scripts, config, CI, `.claude/`      |

### Scope (optional, one)

| Scope    | Covers                                                        |
|----------|---------------------------------------------------------------|
| `game`   | Game rules in `src/game/`                                     |
| `play`   | Input and board view model in `src/play/`                     |
| `ui`     | Components, templates and CSS                                 |
| `config` | `package.json` scripts, Vite, TypeScript, ESLint, Stylelint   |
| `deps`   | Adding, removing or upgrading dependencies                    |
| `ci`     | `.github/workflows/`                                          |
| `claude` | `CLAUDE.md` and `.claude/`                                    |

Omit the scope when a change spans several of these.

### Subject (required)
- Imperative mood, lowercase first word, no trailing period: `add`, not `Added` or `Adds`.
- The whole first line is at most 72 characters, including emoji, type and scope.
- Name the outcome, not the files: `score guesses with black and white pegs`, not `update score.ts`.

### Body (required, except for trivial changes such as a typo fix)
- First paragraph: why. The problem, need or decision, not a restatement of the subject.
- Then `- ` bullets for the notable changes, at the level a reviewer needs.
  Skip the bullets when the change is a single thing the paragraph already covers.
- Always mention: behavior changes, added or upgraded dependencies with version and reason,
  CI or script changes, and known limitations or follow-ups.
- Don't list files, repeat the diff, or write "This commit".
- Wrap at 72 columns.

### Trailers
- `Fixes #N` or `Refs #N` when there's a related issue.
- `Co-Authored-By` as given in the session's attribution instructions.

## Splitting
- One type per commit. Changes needing two types are two commits.
- Tests and docs that belong to a change go in that change's commit, not in separate
  `test` or `docs` commits.
- If one file holds changes for two commits, commit it with the group it mostly belongs to.
- Order commits so each one passes `npm run check` on its own (e.g. tooling before code that needs it).

## Example

```
✨ feat(game): add Mastermind game rules

The UI needs tested rules to build on, kept in plain TypeScript with
no Aurelia imports.

- Color is a union of the supported colors; GameConfig picks the
  palette, so a colorblind-friendly set is just another selection
- Games go from setup to playing to won or lost; state is immutable
  and copies caller-owned arrays
- CLASSIC (4 pegs, 6 colors, duplicates, 10 guesses) is the default

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```
