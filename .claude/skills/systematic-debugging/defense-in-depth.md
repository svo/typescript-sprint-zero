# Defense-in-Depth Validation

## Overview

When you fix a bug caused by invalid data, adding validation at one place feels sufficient. But that single check can be bypassed by different code paths, refactoring, or mocks.

**Core principle:** validate at EVERY layer the data passes through. Make the bug structurally impossible.

## Why Multiple Layers

- Single validation: "we fixed the bug"
- Multiple layers: "we made the bug impossible"

Different layers catch different cases:

- Entry validation catches most bugs
- Domain factories catch edge cases
- Environment guards prevent context-specific dangers
- Debug logging helps when the other layers fail

## The Four Layers

### Layer 1: HTTP Boundary Validation

Reject obviously invalid input before it reaches a use case.

```typescript
// src/interfaces/http/controllers/widget.controller.ts
private validateGetWidget(widgetId: string | undefined, res: Response): widgetId is string {
  if (!widgetId || widgetId.trim().length === 0) {
    res.status(400).json(createErrorResponseDto('ValidationError', 'Widget ID is required'));
    return false;
  }
  return true;
}
```

### Layer 2: Domain Factory Validation

The domain entity factory enforces invariants regardless of how the value got there.

```typescript
// src/domain/model/widget.ts
export const createWidgetId = (value: string): WidgetId => {
  if (!value || value.trim().length === 0) {
    throw new Error('Widget ID cannot be empty');
  }
  return { value: value.trim() };
};
```

### Layer 3: Repository Pre-conditions

Repositories assert on the values they're given:

```typescript
// src/infrastructure/persistence/memory/in-memory-widget-repository.ts
async findById(id: WidgetId): Promise<Widget | null> {
  if (!id || !id.value) {
    throw new Error('findById requires a non-empty WidgetId');
  }
  return this.widgets.get(id.value) ?? null;
}
```

This is rare — usually the type system handles it. But when working with values that come from JSON deserialization or external sources, these guards earn their keep.

### Layer 4: Environment Guards & Logging

Prevent dangerous operations in specific contexts, and capture enough context to debug if a case slips through.

```typescript
const performDestructiveOperation = (target: string): void => {
  if (process.env['NODE_ENV'] === 'test' && !target.startsWith('/tmp/')) {
    throw new Error(`Refusing destructive operation outside /tmp during tests: ${target}`);
  }
  // ...
};
```

## Applying the Pattern

When you find a bug:

1. **Trace the data flow** — where does the bad value originate? where is it used?
2. **Map all checkpoints** — list every layer the data passes through
3. **Add validation at each** — entry, domain, infrastructure, environment
4. **Test each layer** — try to bypass layer 1; verify layer 2 catches it

For this project, the natural map is:

```
HTTP request (Express)
  ↓ (controller)
DTO
  ↓ (use case)
Domain factory          ← ALWAYS validate here
  ↓
Repository
  ↓
Storage
```

## Example

Bug: empty `userId` reaching the use case.

**Data flow:**

1. HTTP request → `req.params['id']` → controller
2. Controller passes string to use case
3. Use case calls `createUserId(stringValue)` — should reject empty
4. If it does not, bad value reaches repository

**Four layers added:**

- Layer 1: `UserController.validateGetUserRequest` checks for empty/missing
- Layer 2: `createUserId` rejects empty/whitespace strings
- Layer 3: `InMemoryUserRepository.findById` is type-safe (`UserId` cannot be empty by construction once it passes layer 2)
- Layer 4: console.error logging in development with the trimmed input echoed back

**Result:** the bug is now structurally impossible — every path to the repository goes through a validating factory.

## Key Insight

All layers were necessary. During testing, each caught bugs the others missed:

- Different code paths bypassed the controller
- Mocks bypassed the domain factory
- Edge cases on different platforms needed environment guards
- Debug logging identified structural misuse

**Don't stop at one validation point.** Add checks at every layer.

## Anti-Pattern: "I'll just check at the boundary"

This is fine when "the boundary" really is the only entry point. But:

- New code paths get added
- Background jobs and admin tools call directly into use cases
- Mocks in tests bypass the boundary

The defense-in-depth view is: each layer should be safe **even when called incorrectly**. The factory guards `createUserId` mean every consumer downstream can rely on `UserId.value` being non-empty.
