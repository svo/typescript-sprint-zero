---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior in this TypeScript project, before proposing fixes
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find the root cause before attempting fixes. Symptom fixes are failure.

**Violating the letter of this process is violating the spirit of debugging.**

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Any technical issue:

- Test failures (`npm test` red)
- Type errors (`npm run typecheck` red)
- Lint or complexity violations
- Architecture test violations (`npm run test:architecture` red)
- Coverage drops below 100%
- Runtime errors in dev (`npm run dev`)
- Unexpected behaviour
- CI/build failures

**Use this ESPECIALLY when:**

- Under time pressure
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- A previous fix didn't work
- You don't fully understand the issue

**Don't skip when:**

- Issue seems simple (simple bugs have root causes too)
- You're in a hurry (rushing guarantees rework)

## The Four Phases

You MUST complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation

**Before attempting ANY fix:**

1. **Read error messages carefully**
   - Don't skip past errors or warnings
   - Stack traces often contain the exact answer
   - Note line numbers, file paths, error codes
   - For TypeScript errors, read the **whole** error chain — `tsc` errors often have sub-messages

2. **Reproduce consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
   - Does `npm run test:all` reproduce it?
   - Does it happen every time, or only sometimes (timing/order issues)?

3. **Check recent changes**
   - `git log --oneline -10`
   - `git diff HEAD~1`
   - Were dependencies updated? `package.json`/`package-lock.json` diffs
   - Were architecture rules tightened in `.eslintrc.js` or `.dependency-cruiser.js`?

4. **Gather evidence in multi-component systems**

   For systems crossing component boundaries (HTTP → controller → use case → repository), instrument the boundaries:

   ```typescript
   console.error('[boundary] inputs:', {
     /* ... */
   });
   console.error('[boundary] outputs:', {
     /* ... */
   });
   ```

   Run once to gather evidence showing **where** it breaks. Then investigate that specific component.

5. **Trace data flow**

   See `root-cause-tracing.md` in this directory for the full backward-tracing technique.

   **Quick version:**
   - Where does the bad value originate?
   - What called this with the bad value?
   - Keep tracing up until you find the source
   - Fix at the source, not the symptom

### Phase 2: Pattern Analysis

**Find the pattern before fixing:**

1. **Find working examples**
   - Locate similar working code in the same codebase
   - For this project, the `User` feature is the canonical reference

2. **Compare against references**
   - If you're following a pattern, read the reference completely (every line)
   - Don't skim — small differences matter

3. **Identify differences**
   - List every difference between working and broken
   - Don't assume "that can't matter"

4. **Understand dependencies**
   - What other components does this touch?
   - What environment / config does it need?
   - What architecture rules apply (ESLint boundaries, dep-cruiser, arch tests)?

### Phase 3: Hypothesis and Testing

**Scientific method:**

1. **Form a single hypothesis**
   - "I think X is the root cause because Y"
   - Be specific, not vague

2. **Test minimally**
   - Smallest possible change to test the hypothesis
   - One variable at a time

3. **Verify before continuing**
   - Worked? → Phase 4
   - Didn't work? → form a NEW hypothesis (don't pile fixes)

4. **When you don't know**
   - Say "I don't understand X"
   - Don't pretend
   - Ask for help

### Phase 4: Implementation

**Fix the root cause, not the symptom:**

1. **Create a failing test**
   - Simplest possible reproduction
   - For this project: a Jest test in the appropriate `test/` subdirectory
   - The test MUST fail before the fix

2. **Implement single fix**
   - Address the identified root cause
   - ONE change at a time
   - No "while I'm here" improvements

3. **Verify**
   - The new test passes
   - All other tests still pass — `npm run test:all`
   - No new lint or architecture violations
   - Coverage still 100%

4. **If the fix doesn't work**
   - STOP
   - Count: how many fixes have you tried?
   - If < 3: return to Phase 1 with new information
   - **If ≥ 3: STOP and question the architecture (step 5)**
   - DON'T attempt fix #4 without a discussion

5. **If 3+ fixes failed: question the architecture**

   Patterns indicating an architectural problem:
   - Each fix reveals a new shared-state/coupling problem elsewhere
   - Fixes require "massive refactoring"
   - Each fix creates new symptoms

   STOP and question fundamentals:
   - Is this pattern fundamentally sound?
   - Are we sticking with it through inertia?
   - Should we refactor architecture vs. continue fixing symptoms?

   Discuss with the user before attempting more fixes.

## Red Flags — STOP and Follow Process

If you catch yourself thinking:

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Pattern says X but I'll adapt it differently"
- "Here are the main problems: [lists fixes without investigation]"
- Proposing solutions before tracing data flow
- "One more fix attempt" (when already tried 2+)
- Each fix reveals a new problem in a different place

**ALL of these mean: STOP. Return to Phase 1.**

## User Signals You're Doing It Wrong

- "Is that not happening?" — you assumed without verifying
- "Will it show us...?" — you should have added evidence gathering
- "Stop guessing" — you're proposing fixes without understanding
- "Ultrathink this" — question fundamentals, not just symptoms
- "We're stuck?" (frustrated) — your approach isn't working

When you see these: **STOP. Return to Phase 1.**

## Common Rationalizations

| Excuse                                       | Reality                                                              |
| -------------------------------------------- | -------------------------------------------------------------------- |
| "Issue is simple, don't need process"        | Simple issues have root causes too. Process is fast for simple bugs. |
| "Emergency, no time for process"             | Systematic debugging is FASTER than guess-and-check.                 |
| "Just try this first, then investigate"      | The first fix sets the pattern. Do it right from the start.          |
| "I'll write the test after confirming"       | Untested fixes don't stick. Test first proves it.                    |
| "Multiple fixes at once saves time"          | Can't isolate what worked. Causes new bugs.                          |
| "Reference too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely.           |
| "I see the problem, let me fix it"           | Seeing symptoms ≠ understanding root cause.                          |
| "One more fix attempt" (after 2+ failures)   | 3+ failures = architectural problem.                                 |

## Quick Reference

| Phase             | Activities                                             | Success Criteria            |
| ----------------- | ------------------------------------------------------ | --------------------------- |
| 1. Root Cause     | Read errors, reproduce, check changes, gather evidence | Understand WHAT and WHY     |
| 2. Pattern        | Find working examples, compare                         | Identify differences        |
| 3. Hypothesis     | Form theory, test minimally                            | Confirmed or new hypothesis |
| 4. Implementation | Failing test, fix, verify                              | Bug resolved, tests green   |

## When Process Reveals "No Root Cause"

If systematic investigation reveals the issue is truly environmental, timing-dependent, or external:

1. You've completed the process
2. Document what you investigated (in the PR description, not in code comments)
3. Implement appropriate handling (retry, timeout, error message)
4. Add monitoring/logging for future investigation

But: 95% of "no root cause" cases are incomplete investigation.

## Supporting Techniques

- **`root-cause-tracing.md`** — backward tracing through call stack
- **`defense-in-depth.md`** — adding validation at multiple layers after finding root cause
- **`condition-based-waiting.md`** — replace arbitrary timeouts with condition polling

**Related skills:**

- **test-driven-development** — for writing the failing test in Phase 4
- **verification-before-completion** — verify the fix before claiming success

## Real-World Impact

- Systematic approach: 15–30 minutes to fix
- Random fixes approach: 2–3 hours of thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: near zero vs common
