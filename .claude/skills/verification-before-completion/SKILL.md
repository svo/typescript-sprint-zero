---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing in this TypeScript project, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
---

# Verification Before Completion

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this session, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN:      Execute the FULL command (fresh, complete)
3. READ:     Full output, check exit code, count failures
4. VERIFY:   Does the output confirm the claim?
   - If NO: state actual status with evidence
   - If YES: state the claim WITH evidence
5. ONLY THEN: make the claim

Skip any step = lying, not verifying.
```

## Common Failures

| Claim                 | Requires                                                       | Not Sufficient                            |
| --------------------- | -------------------------------------------------------------- | ----------------------------------------- |
| Tests pass            | `npm run test:all` exit 0, all gates pass                      | "Should pass", `npx jest` only            |
| Type-clean            | `npm run typecheck` exit 0                                     | "Looks correct", IDE squiggles cleared    |
| Lint clean            | `npm run lint` exit 0                                          | Partial check, "I fixed the obvious ones" |
| Format clean          | `npm run format:check` exit 0                                  | Editor format-on-save (may differ)        |
| Architecture clean    | `npm run arch:validate` AND `npm run test:architecture` exit 0 | One of the two                            |
| Coverage 100%         | `npm run test:coverage` shows 100% across all dimensions       | "Tests pass" (coverage gate is separate)  |
| Build succeeds        | `npm run build` exit 0                                         | Linter passing, logs look good            |
| Bug fixed             | Original symptom test passes (was failing before fix)          | Code changed, "should be fixed"           |
| Regression test works | Red-green cycle verified                                       | Test passes once                          |
| Agent completed       | `git status` / `git diff` shows the changes                    | Agent reports "success"                   |
| Requirements met      | Line-by-line checklist                                         | Tests passing                             |

## Project-Specific Gate

For TypeScript Sprint Zero, the all-in-one gate is:

```bash
npm run test:all
```

This runs:

1. `tsc --noEmit` (typecheck)
2. `eslint . --max-warnings 0` (lint, complexity, layer boundaries)
3. `prettier --check .` (formatting)
4. `jest --coverage` (tests + 100% coverage)
5. `depcruise --validate` (architecture)

If `npm run test:all` exits 0, you have evidence for: type-clean, lint-clean, format-clean, tests-pass, coverage-100, architecture-clean. That covers most completion claims in one command.

For commits, the husky pre-commit hook runs the same gates (without coverage, for speed). If it fails, fix the underlying issue — never use `--no-verify`.

## Red Flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!")
- About to commit/push/PR without running the gate
- Trusting agent success reports
- Relying on partial verification
- Thinking "just this once"
- Tired and wanting work over
- ANY wording implying success without having run verification

## Rationalization Prevention

| Excuse                                      | Reality                                 |
| ------------------------------------------- | --------------------------------------- |
| "Should work now"                           | RUN the verification                    |
| "I'm confident"                             | Confidence ≠ evidence                   |
| "Just this once"                            | No exceptions                           |
| "Linter passed"                             | Linter ≠ typechecker ≠ tests ≠ coverage |
| "Agent said success"                        | Verify independently with `git diff`    |
| "I'm tired"                                 | Exhaustion ≠ excuse                     |
| "Partial check is enough"                   | Partial proves nothing                  |
| "Different words so the rule doesn't apply" | Spirit over letter                      |

## Key Patterns

**Tests:**

```
✅ [Run npm run test:all] [See: 0 failures, all gates pass] "All gates pass"
❌ "Should pass now" / "Looks correct"
❌ [Run npx jest] (bypasses 5 quality gates)
```

**Regression test (TDD red-green):**

```
✅ Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
❌ "I've written a regression test" (without red-green verification)
```

**Build:**

```
✅ [Run npm run build] [See: exit 0] "Build passes"
❌ "Linter passed" — linter doesn't compile
```

**Requirements:**

```
✅ Re-read plan → checklist → verify each → report gaps or completion
❌ "Tests pass, phase complete"
```

**Agent delegation:**

```
✅ Agent reports success → check git diff → verify changes → report actual state
❌ Trust the agent's report
```

## Why This Matters

A single false completion claim:

- Erodes trust ("I don't believe you")
- Ships broken code (the type-checker would have caught the typo, but you didn't run it)
- Wastes time on a redirect → rework loop
- Violates honesty as a core value

## When To Apply

ALWAYS before:

- Any variation of success/completion claims
- Any expression of satisfaction
- Any positive statement about work state
- Committing, PR creation, task completion
- Moving to the next task
- Delegating to agents

The rule applies to:

- Exact phrases
- Paraphrases and synonyms
- Implications of success
- ANY communication suggesting completion

## The Bottom Line

**No shortcuts for verification.**

Run `npm run test:all`. Read the output. THEN claim the result.

This is non-negotiable.
