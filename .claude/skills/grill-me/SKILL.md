---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me". Also accepts a Linear task ID to update the task description with decisions made.
---

# Grill Me — Design Interview & Decision Capture

## Arguments

Parse `$ARGUMENTS` for:
- **Linear task ID** (e.g., `HUB-1077`, `MAR-432`) — if present, the session's decisions will be used to update that task's description at the end
- **Topic or plan description** — the subject to grill about

## The Interview

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.

## Tracking Decisions

As the interview progresses, keep a mental log of every decision made and its rationale. Track:
- **Design decisions** — what approach was chosen and why
- **Constraints discovered** — technical limitations, business rules, edge cases
- **Open questions** — anything left unresolved
- **Scope** — what's in and what's out

## Updating the Linear Task

When the interview reaches a natural conclusion (all branches resolved, or the user says they're done), and a Linear task ID was provided:

1. Summarize the decisions into a structured description
2. Fetch the current task from Linear to see the existing description
3. Update the task description by **appending** a "## Design Decisions" section (do not overwrite existing content). Use this format:

```markdown
## Design Decisions

### Context
<1-2 sentences on what was discussed>

### Decisions
- **<topic>**: <decision made> — <rationale>
- **<topic>**: <decision made> — <rationale>

### Constraints
- <constraint discovered during discussion>

### Open Questions
- <anything left unresolved, if any>

### Scope
- **In scope**: <what will be done>
- **Out of scope**: <what was explicitly excluded>
```

4. Confirm with the user before saving: "I'm about to update <ISSUE_ID> with the decisions we made. Here's what I'll add: [show preview]. Should I go ahead?"
5. After the user confirms, update the task in Linear.

If no Linear task ID was provided, skip the update step — just conclude the interview normally.