# Root Cause Tracing

## Overview

Bugs often manifest deep in the call stack (a query hits the wrong table, a file is created in the wrong directory, a config arrives undefined). Your instinct is to fix where the error appears, but that's treating a symptom.

**Core principle:** trace backward through the call chain until you find the original trigger, then fix at the source.

## When to Use

- Error happens deep in execution (not at the entry point)
- Stack trace shows a long call chain
- Unclear where invalid data originated
- Need to find which test/code triggers the problem

## The Tracing Process

### 1. Observe the Symptom

```
Error: User with ID  not found
```

(Note the suspicious empty string in the error message.)

### 2. Find Immediate Cause

What code directly produces this?

```typescript
const user = await this.queryRepository.findById(userId);
if (!user) {
  throw new Error(`User with ID ${userId.value} not found`);
}
```

### 3. Ask: What Called This?

```
GetUserUseCase.execute({ userId: '...' })
  ← UserController.getUser(req, res)
    ← Express request handler
      ← test that called supertest.get(`/users/${id}`)
```

### 4. Keep Tracing Up

What value was passed at each step?

- `userId.value` was `''` — empty string
- `createUserId('')` should have thrown — why didn't it?
- ... or did `req.params['id']` come back undefined and we fell through validation?

### 5. Find Original Trigger

Often the trigger is:

- An optional query/route parameter that was assumed required
- A test fixture that wasn't fully populated
- A type assertion (`as`) that bypassed `noUncheckedIndexedAccess`
- A schema mismatch between request DTO and what Express delivered

## Adding Stack Traces

When manual tracing isn't enough, instrument:

```typescript
const findById = async (id: UserId): Promise<User | null> => {
  const stack = new Error().stack;
  console.error('[debug] findById', {
    idValue: id.value,
    cwd: process.cwd(),
    nodeEnv: process.env['NODE_ENV'],
    stack,
  });
  return this.users.get(id.value) ?? null;
};
```

**Critical:** use `console.error` in tests — Jest captures `console.error` reliably; loggers may be suppressed.

**Run and capture:**

```bash
npx jest path/to/test.test.ts 2>&1 | grep '\[debug\]'
```

**Analyze:**

- Look for test file names in the stack
- Find the line triggering the call
- Identify the pattern (same test? same parameter?)

## Finding Which Test Causes Pollution

If something appears across tests but you don't know which one creates it, use the bisection script `find-polluter.sh` in this directory:

```bash
./.claude/skills/systematic-debugging/find-polluter.sh '.tmp-output' 'test/**/*.test.ts'
```

It runs tests one-by-one and stops at the first one that creates the pollution.

## Real Example: Empty `userId.value`

**Symptom:** `User with ID  not found` errors in HTTP integration tests.

**Trace chain:**

1. Error thrown in `GetUserUseCase.execute` — `userId.value === ''`
2. `createUserId` was supposed to reject empty input — but it received `' '` (a single space)
3. `' '` passed `!value` (truthy) and `value.trim().length === 0` ... wait, that should reject it
4. Actual value: `'​'` (zero-width space) — `.trim()` does not strip it
5. Source: a test fixture used a copy-pasted ID with an invisible character

**Root cause:** the trim-based validation didn't cover all whitespace-like Unicode codepoints.

**Fix:** stricter validation in `createUserId` (use a regex). Plus a property-based test (`fast-check`) to catch similar inputs in the future.

**Defense-in-depth additions:** validation at each layer that handles user-provided IDs.

## Key Principle

**NEVER fix just where the error appears.** Trace back to find the original trigger.

The fix at the symptom point usually:

- Patches one path, leaves others
- Hides the real bug for the next person to discover
- Builds up a layer of compensating logic that nobody understands

## Stack Trace Tips

- **In tests:** use `console.error`, not your logger
- **Before the operation:** log before the dangerous operation, not after the failure
- **Include context:** parameters, environment, paths, timestamps
- **Capture stack:** `new Error().stack` shows the complete call chain

## TypeScript-Specific Hints

- `noUncheckedIndexedAccess` (enabled in this project) requires you to handle `undefined` from arrays/records — bypassing this with `!` is a common bug source
- `exactOptionalPropertyTypes` means `{ x?: T }` is different from `{ x: T | undefined }` — mismatched assumptions across boundaries cause runtime surprises
- `as` casts bypass type checking — search for `as` in the suspect path: `rg ' as ' src/`
- Decorators (`reflect-metadata`) require imports at process entry; missing imports cause confusing failures in tsyringe resolution
