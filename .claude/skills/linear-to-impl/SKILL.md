---
name: linear-to-impl
description: Takes a Linear issue URL, fetches the issue, reads the project PRD, generates a task PRD and tech spec, then implements the feature end-to-end. Use when user provides a Linear issue URL and wants to go from task definition to working code.
user_invocable: true
---

# Linear Issue to Implementation

Automates the full workflow: Linear issue -> Task PRD -> Tech Spec -> Implementation -> Commit -> PR.

## Inputs

The user provides a Linear issue URL (e.g., `https://linear.app/team/issue/KAI-XX/...`).

Optional args:
- `--prd-only` — Stop after generating the task PRD
- `--spec-only` — Stop after generating the tech spec
- `--no-pr` — Skip creating PR at the end

## Workflow

### Step 1: Fetch Context

1. Extract the issue ID from the URL (e.g., `KAI-57`)
2. Use `mcp__plugin_linear_linear__get_issue` to fetch the issue details (title, description, project, milestone, labels)
3. Read the project PRD at `docs/PRD-sistema-clips-pregacoes-v2.md` to understand the full product context
4. Read the tech stack at `docs/TECH-STACK-sistema-clips-pregacoes.md`
5. Explore the current codebase to understand what already exists related to the issue

### Step 2: Generate Task PRD

Create `docs/specs/{ISSUE_ID}-{slug}-prd.md` with:
- Context (derived from the main PRD)
- Objective
- Scope (included / excluded for this task)
- Personas impacted
- User stories with acceptance criteria (AC-XX.X format)
- Non-functional requirements relevant to this task
- Success metrics
- Dependencies

**If `--prd-only` flag is set, stop here.**

### Step 3: Generate Tech Spec

Create `docs/specs/{ISSUE_ID}-{slug}-tech-spec.md` with:
- Current state inventory (what exists vs what needs to be built)
- Detailed implementation plan for each component
- API contracts (request/response JSON examples)
- Database changes (migrations needed)
- Frontend components to create/modify
- Implementation order (dependency graph)
- Test plan

**If `--spec-only` flag is set, stop here.**

### Step 4: Implement

Follow the tech spec's implementation order:
1. Create database migrations
2. Implement backend services (one service per use case, with `execute()` method)
3. Implement backend routes
4. Update app.py to register new routers
5. Install any new frontend dependencies (shadcn components, npm packages)
6. Implement frontend components
7. Update pages and layouts

**Key rules:**
- Run all Python commands inside Docker containers (`docker compose exec backend ...`)
- Follow the module pattern: routes -> services -> repositories -> models
- Each service file has a single class with an `execute()` method
- Modules never import from each other (cross-module via Temporal activities)
- Test endpoints with `curl` after implementation
- Never block user flow on errors — always provide manual fallback

### Step 5: Verify

- Run migrations inside the container
- Test all new API endpoints with curl
- Verify TypeScript compiles (`npx tsc --noEmit` from frontend dir)
- Verify role-based access where applicable

### Step 6: Commit & PR

**Unless `--no-pr` flag is set:**

1. Create branch: `feature/{LINEAR_BRANCH_NAME}` (use the `gitBranchName` from the Linear issue)
2. Stage only files related to this task
3. Commit with conventional commit format: `feat(scope): description (ISSUE_ID)`
4. Push and create PR with:
   - Summary of changes
   - `Closes {ISSUE_ID}` to auto-close the Linear issue
   - Test plan checklist

## Output

At the end, present a summary:
- Files created/modified
- Endpoints added
- PR URL (if created)
- Any manual steps needed (e.g., "run migrations", "update env vars")
