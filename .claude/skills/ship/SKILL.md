---
name: ship
description: Full git workflow — stage, commit, push, and open a GitHub PR with conventional commit messages and a structured PR body
context: fork
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Ship — Git Commit, Push, and PR Workflow

You are a git workflow assistant for the Delta repository (Flutter mobile app). Your job is to take the current working changes, commit them following the project's commit conventions, push to the remote, and optionally open a GitHub pull request.

## Arguments

Parse `$ARGUMENTS` for:
- **Linear issue ID** (e.g., `HUB-1077`, `MAR-432`) — if present, embed a link in the PR body and append to commit message
- **PR title override** — a quoted string used as the PR title instead of auto-generating one
- **`--no-pr`** — commit and push only, skip PR creation
- **`--draft`** — create PR as a draft

If no arguments are given, proceed with the default workflow below.

---

## Step 1: Safety Checks

Before doing anything:

1. Run `git branch --show-current` to get the current branch name.
2. If the current branch is `main` or `master`, **stop and warn the user**:
   > "You are on the `main` branch. Committing directly to main is not recommended. Please create a feature branch first and re-run /ship."

   **Branch naming convention:** `<type>/<kebab-case-description>`

   Use the same types as commit messages (`feat`, `fix`, `refactor`, `chore`, `test`, `docs`). The description should be short and descriptive in kebab-case.

   **Examples from this repo:**
   ```
   feat/configure-drift-web-native
   fix/disabled-student-fk-constraint
   refact/grade-sync
   chore/add-claude-setup
   ```

   Suggest: `git checkout -b <suggested-branch-name>`

   Do not proceed unless the user explicitly confirms they want to continue on `main`.

3. Check if there is a tracking remote:
   ```bash
   git remote -v
   ```
   Note whether `origin` exists. If it does not, warn the user that pushing will require setting up a remote first.

---

## Step 2: Assess Staged Changes

Run both commands:
```bash
git status --short
git diff --cached --stat
```

**Decision logic:**
- If there are **already staged files** (`git diff --cached` has output): use them as-is. Inform the user which files are staged.
- If there are **no staged files** but there are **unstaged changes**: show the user the list of unstaged changes from `git status --short` and ask:
  > "Nothing is staged. Do you want to stage all changes (`git add -A`) or specific files? List the files you want to stage, or say 'all'."
  Wait for the user's response before proceeding.
- If there is **nothing to commit** (clean working tree): tell the user there is nothing to commit and stop.

---

## Step 3: Generate the Commit Message

1. Run `git diff --cached` to read the full staged diff.
2. Analyze the diff to determine the type and scope of the change.

### Commit Message Format

Follow the project's established commit style:

```
<type>: <short imperative description> (<ISSUE_ID>)
```

If no Linear issue ID was provided, omit the parenthetical:
```
<type>: <short imperative description>
```

**Types:**
| Type | When to use |
|------|------------|
| `feat` | New screens, widgets, features, providers |
| `fix` | Bug fixes, corrections |
| `chore` | Config, deps, build, non-functional changes |
| `refact` | Code restructure without behavior change |
| `test` | Adding or fixing tests |
| `docs` | Documentation only |

**Rules:**
- All lowercase after the type prefix
- Imperative mood: "add offline sync screen", not "added" or "adds"
- Under 72 characters on the first line
- No period at the end
- No emoji

**Co-author footer** (always append):
```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Examples from this repo:**
```
feat: configure Drift database for web and native platforms (HUB-2131)
feat: implement update detection and version management (HUB-2123)
fix: fix disabled student FK constraint on assessment
chore: regenerate web icons from app launcher icon (HUB-2131)
docs: add web setup instructions to README (HUB-2131)
```

Present the proposed commit message to the user and ask for confirmation or edits before committing.

---

## Step 4: Commit

Once the user confirms (or approves the auto-generated message), run:

```bash
git commit -m "$(cat <<'EOF'
<type>: <description>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

If the commit fails due to a pre-commit hook:
- Show the hook output to the user
- Fix the reported issues (e.g., run `dart analyze` and `dart format .` for linting failures)
- Re-stage the fixed files
- Create a **new** commit — never amend

---

## Step 5: Push to Remote

Run:
```bash
git push
```

If the push fails because there is no upstream tracking branch:
```bash
git push -u origin <current-branch>
```

If the push fails for any other reason (e.g., non-fast-forward), show the error to the user and **do not force push**. Suggest:
> "The push was rejected. This usually means the remote has commits you don't have locally. Run `git pull --rebase` and then re-run /ship."

**Never run `git push --force` or `git push --force-with-lease` unless the user explicitly requests it and the branch is not `main` or `master`.**

If the user passed `--no-pr`, stop here and report success.

---

## Step 6: Create the Pull Request

### Linear Issue Handling

If a Linear issue ID was passed as an argument (e.g., `HUB-1077`):
- Construct the Linear URL: `https://linear.app/issue/<ISSUE_ID>`
- Embed it in the PR body under a "Linked issue" section

If no issue ID was passed:
- Ask the user: "Is there a Linear issue linked to this change? (e.g., HUB-1077, or 'none')"
- If they provide one, use it. If they say 'none' or skip, omit the section.

### PR Title

- If the user passed a quoted title override in arguments, use it verbatim.
- Otherwise, derive the title from the commit message: strip the type prefix and capitalize the first letter.
  - Commit: `feat: implement offline sync for assessments` → PR title: `Implement offline sync for assessments`
  - Keep it under 70 characters.

### Reviewer Handling

Ask the user: "Do you want to add reviewers? (GitHub usernames, comma-separated, or 'skip')"
- If they provide usernames, pass them via `--reviewer <username>` flags.
- If they skip, omit reviewers.

### Draft Mode

If `--draft` was passed in arguments, add `--draft` to `gh pr create`.

### PR Base Branch

Always default to `main`. Verify with:
```bash
git remote show origin | grep 'HEAD branch'
```
Use whatever the default branch is on the remote.

### All Commits in the PR

Before creating the PR, run:
```bash
git log origin/main..HEAD --oneline
```
If there are multiple commits, include all of them in the PR summary — not just the most recent one.

### Build and Run the PR Creation Command

```bash
gh pr create \
  --title "<PR title>" \
  --base main \
  [--draft] \
  [--reviewer <username>] \
  --body "$(cat <<'EOF'
## Summary

- <bullet 1: what was added or changed>
- <bullet 2: why or related context>
- <bullet 3: any notable decisions or caveats>

## Test plan

- [ ] App builds without errors (`flutter build apk --debug`)
- [ ] `dart analyze` reports no issues
- [ ] Affected screens render correctly on Android emulator
- [ ] New/modified widgets respect AppColors and AppLocalizations
- [ ] Offline behavior works as expected (if applicable)
- [ ] No hardcoded strings — all text uses l10n

## Linked issue

[<ISSUE_ID>](https://linear.app/issue/<ISSUE_ID>)

---

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Generate the Summary bullets by analyzing the diff — describe the actual changes concisely. Do not use generic filler text.

Adapt the Test plan checklist based on what was changed:
- If it is a new screen/widget, include rendering and Atomic Design compliance checks.
- If it is a ViewModel change, include state management and loading state checks.
- If it is a Drift schema change, include migration and build_runner verification.
- If it is l10n-related, include ARB file and `flutter gen-l10n` verification.

After the PR is created, output the PR URL so the user can open it directly.

---

## Edge Cases

### No remote exists
If `git remote -v` returns nothing:
> "No remote is configured. Add one with `git remote add origin <url>` and re-run /ship."
Stop.

### PR already exists for this branch
If `gh pr create` fails because a PR already exists:
```bash
gh pr view --web
```
Tell the user the PR already exists and open it in the browser.

### Merge conflicts with base
If `git push` reports conflicts, do not attempt to resolve them automatically. Show the error and stop.

---

## Argument Parsing Reference

| Input | Behavior |
|-------|----------|
| `/ship` | Full workflow, ask about Linear issue and reviewers |
| `/ship HUB-1077` | Embed Linear issue HUB-1077, skip issue prompt |
| `/ship --no-pr` | Stage, commit, push only — no PR |
| `/ship --draft` | Create PR as draft |
| `/ship HUB-1077 --draft` | Draft PR with Linear issue embedded |
| `/ship "my custom title"` | Use provided string as PR title verbatim |
