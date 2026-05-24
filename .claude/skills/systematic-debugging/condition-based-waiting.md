# Condition-Based Waiting

## Overview

Flaky tests often guess at timing with arbitrary delays. This creates race conditions where tests pass on fast machines but fail under load or in CI.

**Core principle:** wait for the actual condition you care about, not a guess about how long it takes.

## When to Use

- Tests use `setTimeout` / `setInterval` for synchronization
- Tests are flaky (pass sometimes, fail under load)
- Tests timeout in CI but pass locally
- Waiting for async operations to complete

**Don't use when:**

- Testing actual timing behaviour (debounce, throttle intervals) — but document **why**

## Core Pattern

```typescript
// ❌ BEFORE — guessing at timing
await new Promise(r => setTimeout(r, 50));
const result = getResult();
expect(result).toBeDefined();

// ✅ AFTER — waiting for condition
await waitFor(() => getResult() !== undefined);
const result = getResult();
expect(result).toBeDefined();
```

## Quick Patterns

| Scenario          | Pattern                                              |
| ----------------- | ---------------------------------------------------- |
| Wait for event    | `waitFor(() => events.find(e => e.type === 'DONE'))` |
| Wait for state    | `waitFor(() => machine.state === 'ready')`           |
| Wait for count    | `waitFor(() => items.length >= 5)`                   |
| Wait for file     | `waitFor(() => fs.existsSync(path))`                 |
| Complex condition | `waitFor(() => obj.ready && obj.value > 10)`         |

## Implementation

A generic polling helper:

```typescript
export const waitFor = async <T>(
  condition: () => T | undefined | null | false,
  description: string,
  timeoutMs = 5000
): Promise<T> => {
  const startTime = Date.now();

  while (true) {
    const result = condition();
    if (result) return result;

    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Timeout waiting for ${description} after ${timeoutMs}ms`);
    }

    await new Promise(resolve => setTimeout(resolve, 10));
  }
};
```

Place it in `test/test-utils/wait-for.ts` and import where needed.

## Example: Domain-Specific Helpers

Building on `waitFor`, create helpers for common cases. Below is a reference shape (adapt to actual project types):

```typescript
// test/test-utils/wait-for-event.ts
import { waitFor } from './wait-for';

export interface EventLike {
  readonly type: string;
}

export const waitForEvent = async <E extends EventLike>(
  getEvents: () => readonly E[],
  type: E['type'],
  timeoutMs = 5000
): Promise<E> =>
  waitFor(() => getEvents().find(event => event.type === type), `${type} event`, timeoutMs);

export const waitForEventCount = async <E extends EventLike>(
  getEvents: () => readonly E[],
  type: E['type'],
  count: number,
  timeoutMs = 5000
): Promise<readonly E[]> =>
  waitFor(
    () => {
      const matching = getEvents().filter(event => event.type === type);
      return matching.length >= count ? matching : undefined;
    },
    `${count} ${type} events`,
    timeoutMs
  );

export const waitForEventMatch = async <E extends EventLike>(
  getEvents: () => readonly E[],
  predicate: (event: E) => boolean,
  description: string,
  timeoutMs = 5000
): Promise<E> => waitFor(() => getEvents().find(predicate), description, timeoutMs);
```

## Common Mistakes

**Polling too fast:** `setTimeout(check, 1)` — wastes CPU.
Fix: poll every 10 ms.

**No timeout:** loops forever if the condition is never met.
Fix: always include a timeout with a clear error message.

**Stale data:** caching state outside the loop.
Fix: call the getter inside the loop for fresh values.

## When Arbitrary Timeouts Are Correct

```typescript
// Tool ticks every 100 ms — need 2 ticks to verify partial output
await waitForEvent(getEvents, 'TOOL_STARTED'); // first wait for the trigger
await new Promise(r => setTimeout(r, 200)); // then wait for two ticks
// 200 ms is documented and justified
```

Requirements when using an arbitrary delay:

1. First wait for a triggering condition
2. Base the delay on known timing (not a guess)
3. Comment explaining why — even though the project has a no-comments rule, the **commit message** or PR description should explain this; in code, prefer extracting to a named constant whose name explains it (`TWO_TICKS_AT_100MS = 200`).

## Real-World Impact

Replacing arbitrary timeouts with condition-based waiting typically:

- Eliminates flakiness (60% pass → 100% pass)
- Speeds up tests (waits are now exactly as long as needed)
- Removes race conditions
