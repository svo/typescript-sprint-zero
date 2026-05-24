# Testing Anti-Patterns (TypeScript / Jest)

**Load this reference when:** writing or changing tests, adding mocks, or tempted to add test-only methods to production code.

## Overview

Tests must verify real behaviour, not mock behaviour. Mocks are a means to isolate, not the thing being tested.

**Core principle:** Test what the code does, not what the mocks do.

**Following strict TDD prevents these anti-patterns.**

## The Iron Laws

```
1. NEVER test mock behaviour
2. NEVER add test-only methods to production classes
3. NEVER mock without understanding dependencies
```

## Anti-Pattern 1: Testing Mock Behaviour

**The violation:**

```typescript
// ❌ BAD — testing that the mock exists
it('should render sidebar', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

**Why this is wrong:**

- You verify the mock works, not that the component works
- Test passes when mock is present, fails when it's not
- Tells you nothing about real behaviour

**The fix:**

```typescript
// ✅ GOOD — test real behaviour
it('should render sidebar', () => {
  render(<Page />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});
```

### Gate

```
BEFORE asserting on any mock element:
  Ask: "Am I testing real behaviour or just mock existence?"
  IF testing mock existence:
    STOP — delete the assertion or unmock the component
```

## Anti-Pattern 2: Test-Only Methods in Production

**The violation:**

```typescript
// ❌ BAD — destroy() only used in tests
class Session {
  async destroy(): Promise<void> {
    await this.workspaceManager?.destroyWorkspace(this.id);
  }
}

// In tests
afterEach(() => session.destroy());
```

**Why this is wrong:**

- Production class polluted with test-only code
- Dangerous if accidentally called in production
- Violates YAGNI and separation of concerns

**The fix:**

```typescript
// ✅ GOOD — test utilities handle test cleanup
// Session has no destroy() in production

// In test/test-utils/cleanup-session.ts:
export const cleanupSession = async (session: Session): Promise<void> => {
  const workspace = session.getWorkspaceInfo();
  if (workspace) {
    await workspaceManager.destroyWorkspace(workspace.id);
  }
};

// In tests
afterEach(() => cleanupSession(session));
```

### Gate

```
BEFORE adding any method to a production class:
  Ask: "Is this only used by tests?"
  IF yes:
    STOP — put it in a test utility instead
```

## Anti-Pattern 3: Mocking Without Understanding

**The violation:**

```typescript
// ❌ BAD — mock breaks test logic
it('should detect duplicate server', async () => {
  jest.mock('../../src/tool-catalog', () => ({
    discoverAndCacheTools: jest.fn().mockResolvedValue(undefined),
  }));

  await addServer(config);
  await addServer(config); // should throw — but won't!
});
```

**Why this is wrong:**

- The mocked method had a side effect the test depended on
- Over-mocking "to be safe" breaks actual behaviour
- Test passes for the wrong reason or fails mysteriously

**The fix:**

```typescript
// ✅ GOOD — mock at the correct level
it('should detect duplicate server', async () => {
  // Just mock the slow part (server startup), preserve config writes
  jest.mock('../../src/mcp-server-manager');

  await addServer(config); // config written
  await expect(addServer(config)).rejects.toThrow('duplicate');
});
```

### Gate

```
BEFORE mocking any method:
  STOP — don't mock yet.

  1. What side effects does the real method have?
  2. Does the test depend on any of those side effects?
  3. Do I fully understand what the test needs?

  IF the test depends on side effects:
    Mock at a lower level (the actual slow/external operation)
    OR use test doubles that preserve necessary behaviour
    NOT the high-level method the test depends on.

  IF unsure:
    Run the test with real implementation FIRST
    Observe what actually needs to happen
    THEN add minimal mocking at the right level.
```

## Anti-Pattern 4: Incomplete Mocks

**The violation:**

```typescript
// ❌ BAD — partial mock — only fields you think you need
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' },
  // Missing: metadata that downstream code uses
};
```

**Why this is wrong:**

- Hides structural assumptions
- Downstream code may depend on fields not included
- Tests pass while integration fails

**The Iron Rule:** mock the COMPLETE data structure as it exists in reality.

**The fix:**

```typescript
// ✅ GOOD — mirror real API completeness
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' },
  metadata: { requestId: 'req-789', timestamp: 1234567890 },
};
```

### Gate

```
BEFORE creating mock responses:
  Check: "What fields does the real API response contain?"

  Actions:
    1. Examine actual API response from docs/examples
    2. Include ALL fields downstream code might consume
    3. Verify mock matches the real schema completely

  If uncertain: include all documented fields.
```

## Anti-Pattern 5: Tests as Afterthought

**The violation:**

```
✅ Implementation complete
❌ No tests written
"Ready for testing"
```

**Why this is wrong:**

- Testing is part of implementation, not optional follow-up
- TDD would have caught this
- Cannot claim complete without tests

**The fix:** TDD cycle — RED, GREEN, REFACTOR. THEN claim complete.

## When Mocks Become Too Complex

Warning signs:

- Mock setup longer than test logic
- Mocking everything to make the test pass
- Mocks missing methods real components have
- Test breaks when the mock changes

Consider integration tests with real components — often simpler than complex mocks. The project already has `test/interfaces/http/integration/api.integration.test.ts` as a pattern.

## TDD Prevents These Anti-Patterns

1. **Write test first** → forces thinking about what's actually being tested
2. **Watch it fail** → confirms it tests real behaviour
3. **Minimal implementation** → no test-only methods creep in
4. **Real dependencies first** → mocks added only when proven necessary

If you're testing mock behaviour, you violated TDD — you added mocks without watching the test fail against real code first.

## Quick Reference

| Anti-Pattern                    | Fix                                           |
| ------------------------------- | --------------------------------------------- |
| Assert on mock elements         | Test real component or unmock it              |
| Test-only methods in production | Move to `test/test-utils/`                    |
| Mock without understanding      | Understand dependencies first, mock minimally |
| Incomplete mocks                | Mirror the real API completely                |
| Tests as afterthought           | TDD — tests first                             |
| Over-complex mocks              | Consider integration tests                    |

## Red Flags

- Assertion checks for `*-mock` test IDs
- Methods only called in test files
- Mock setup is >50% of the test
- Test fails when you remove a mock
- Can't explain why a mock is needed
- Mocking "just to be safe"

## The Bottom Line

**Mocks are tools to isolate, not things to test.**

If TDD reveals you're testing mock behaviour, you've gone wrong.

Fix: test real behaviour, or question why you're mocking at all.
