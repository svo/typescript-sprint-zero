---
name: test-driven-development
description: Use when implementing any feature or bugfix in this TypeScript project, before writing implementation code
---

# Test-Driven Development (TDD)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

**Violating the letter of the rules is violating the spirit of the rules.**

## When to Use

**Always:**

- New features
- Bug fixes
- Refactoring (with characterization tests first)
- Behaviour changes

**Exceptions (ask the user):**

- Throwaway prototypes
- Generated code
- Configuration files

Thinking "skip TDD just this once"? Stop. That's rationalization.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Wrote code before the test? Delete it. Start over.

**No exceptions:**

- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means delete

Implement fresh from tests. Period.

## Red-Green-Refactor

### RED — Write Failing Test

Write one minimal test showing what should happen.

**Good:**

```typescript
it('should retry failed operations 3 times', async () => {
  let attempts = 0;
  const operation = async (): Promise<string> => {
    attempts += 1;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };

  const result = await retryOperation(operation);

  expect(result).toBe('success');
});
```

Clear name, tests real behaviour, one assertion.

**Bad:**

```typescript
it('retry works', async () => {
  const mock = jest
    .fn()
    .mockRejectedValueOnce(new Error())
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce('success');
  await retryOperation(mock);
  expect(mock).toHaveBeenCalledTimes(3);
});
```

Vague name, tests mock not code.

**Requirements:**

- One behaviour
- One `expect` (the project rule)
- Clear name (`should ... when ...`)
- Real code (no mocks unless unavoidable)

### Verify RED — Watch It Fail

**MANDATORY. Never skip.**

```bash
npx jest path/to/your.test.ts
```

Confirm:

- Test fails (not errors)
- Failure message is the one you expect
- Failure is because the feature is missing (not a typo)

**Test passes?** You are testing existing behaviour. Fix the test.

**Test errors?** Fix the error and re-run until it fails for the right reason.

### GREEN — Minimal Code

Write the simplest code that passes the test.

**Good:**

```typescript
export async function retryOperation<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 3; i += 1) {
    try {
      return await fn();
    } catch (e) {
      if (i === 2) throw e;
    }
  }
  throw new Error('unreachable');
}
```

Just enough to pass.

**Bad:**

```typescript
export async function retryOperation<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    backoff?: 'linear' | 'exponential';
    onRetry?: (attempt: number) => void;
  }
): Promise<T> {
  // YAGNI — far beyond what the test demands
}
```

Over-engineered.

Don't add features, refactor other code, or "improve" beyond the test.

### Verify GREEN — Watch It Pass

**MANDATORY.**

```bash
npx jest path/to/your.test.ts
```

Confirm:

- Test passes
- Other tests still pass — `npm test`
- Output is clean (no warnings, no `console.error` noise)

**Test fails?** Fix the code, not the test.

**Other tests fail?** Fix now — you broke them.

### REFACTOR — Clean Up

Only after green:

- Remove duplication
- Improve names
- Extract helpers
- Bring code within the complexity budget (cyclomatic ≤ 5, max-statements ≤ 10)

Keep tests green throughout. Don't add behaviour.

### Repeat

Next failing test for the next slice of behaviour.

## Good Tests

| Quality           | Good                                    | Bad                                               |
| ----------------- | --------------------------------------- | ------------------------------------------------- |
| **Minimal**       | One thing. "and" in the name? Split it. | `it('validates email and domain and whitespace')` |
| **Clear**         | Name describes behaviour                | `it('test1')`                                     |
| **Shows intent**  | Demonstrates the desired API            | Obscures what the code should do                  |
| **One assertion** | Single `expect` per `it`                | Multiple `expect` calls in one block              |

## Why Order Matters

**"I'll write tests after to verify it works"**

Tests written after pass immediately. Passing immediately proves nothing:

- Might test the wrong thing
- Might test the implementation, not the behaviour
- Might miss edge cases you forgot
- You never saw it catch a bug

Test-first forces you to see the test fail, proving it actually tests something.

**"I already manually tested all the edge cases"**

Manual testing is ad hoc. You think you tested everything but:

- No record of what you tested
- Can't re-run when code changes
- Easy to forget cases under pressure

Automated tests are systematic.

**"Deleting X hours of work is wasteful"**

Sunk cost fallacy. Your choice now:

- Delete and rewrite with TDD (X hours, high confidence)
- Keep and add tests after (30 min, low confidence, likely bugs)

Working code without real tests is technical debt.

**"TDD is dogmatic, being pragmatic means adapting"**

TDD IS pragmatic:

- Finds bugs before commit
- Prevents regressions
- Documents behaviour
- Enables refactoring

"Pragmatic" shortcuts = debugging in production = slower.

## Common Rationalizations

| Excuse                           | Reality                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| "Too simple to test"             | Simple code breaks. Test takes 30 seconds.                                         |
| "I'll test after"                | Tests passing immediately prove nothing.                                           |
| "Tests after achieve same goals" | Tests-after answer "what does this do?". Tests-first answer "what should this do?" |
| "Already manually tested"        | Ad hoc ≠ systematic. No record, can't re-run.                                      |
| "Deleting X hours is wasteful"   | Sunk cost fallacy. Keeping unverified code is debt.                                |
| "Keep as reference"              | You'll adapt it. Delete means delete.                                              |
| "Need to explore first"          | Fine. Throw away the exploration. Start with TDD.                                  |
| "Test hard = design unclear"     | Listen to the test. Hard to test = hard to use.                                    |
| "TDD will slow me down"          | TDD is faster than debugging.                                                      |

## Red Flags — STOP and Start Over

- Code before test
- Test after implementation
- Test passes immediately
- Can't explain why test failed
- Tests added "later"
- Rationalizing "just this once"
- "I already manually tested it"
- "Tests after achieve the same purpose"
- "Keep as reference" or "adapt existing code"
- "TDD is dogmatic, I'm being pragmatic"

**All of these mean: Delete the code. Start over with TDD.**

## Example: Bug Fix

**Bug:** Empty email accepted by `submitForm`.

**RED**

```typescript
it('should reject empty email', async () => {
  const result = await submitForm({ email: '' });

  expect(result.error).toBe('Email required');
});
```

**Verify RED**

```
$ npx jest submit-form.test.ts
FAIL: expected 'Email required', got undefined
```

**GREEN**

```typescript
export function submitForm(data: FormData): SubmitResult {
  if (!data.email?.trim()) {
    return { error: 'Email required' };
  }
  // ...
}
```

**Verify GREEN**

```
$ npx jest submit-form.test.ts
PASS
```

**REFACTOR**
Extract a `requireField` helper if multiple fields need the same guard.

## Verification Checklist

Before marking work complete:

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for the expected reason
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass — verified with `npm run test:all`, NOT just `npx jest`
- [ ] Output is clean (no warnings)
- [ ] Tests use real code (mocks only when unavoidable)
- [ ] Edge cases and errors covered
- [ ] One `expect` per `it`
- [ ] No `any` types introduced

Can't check all boxes? You skipped TDD. Start over.

**Always run `npm run test:all`** for final verification — it runs typecheck → lint → format:check → test:coverage → arch:validate. Running `jest` alone bypasses six quality gates.

## When Stuck

| Problem                | Solution                                                              |
| ---------------------- | --------------------------------------------------------------------- |
| Don't know how to test | Write the wished-for API. Write the assertion first. Ask the user.    |
| Test too complicated   | Design too complicated. Simplify the interface.                       |
| Must mock everything   | Code too coupled. Use dependency injection — tsyringe is right there. |
| Test setup huge        | Extract helpers. Still complex? Simplify the design.                  |

## Debugging Integration

Bug found? Write a failing test reproducing it. Follow the TDD cycle. The test proves the fix and prevents regression.

Never fix a bug without a test.

## Testing Anti-Patterns

When adding mocks or test utilities, see `testing-anti-patterns.md` to avoid:

- Testing mock behaviour instead of real behaviour
- Adding test-only methods to production classes
- Mocking without understanding dependencies

## Final Rule

```
Production code → test exists and failed first
Otherwise → not TDD
```

No exceptions without the user's explicit permission.
