---
name: Self-Documenting Code Refactorer
description: This skill should be used when the user asks to "remove comments", "make code self-documenting", "refactor to eliminate comments", "improve code clarity", "make this clearer without comments", or mentions the no-comments rule. This skill helps refactor TypeScript code to be self-explanatory through expressive naming instead of comments.
version: 1.0.0
---

# Self-Documenting Code Refactorer

## Overview

This project has a **strict NO COMMENTS policy**. All TypeScript code must be self-documenting through expressive naming, small focused functions, and well-typed shapes. This skill guides you through identifying comments and refactoring code to eliminate the need for them.

## Core Principle

> Code should be so clear that comments are unnecessary. If you need a comment, refactor the code to be clearer instead.

## When to Use

- You find comments in `src/` or `test/`
- You're tempted to add a comment because the code "needs explanation"
- Reviewing a PR for the no-comments policy
- Refactoring an unclear code block

## The NO COMMENTS Rule

### Forbidden

- `// implementation comment`
- `/* block comment */`
- TSDoc/JSDoc (`/** ... */`)
- `// TODO`, `// FIXME`, `// HACK`, `// XXX`
- Inline explanations
- Commented-out code

### The Only Tolerated Exception

- `// eslint-disable-...` directives are tolerated **only** when there is a documented architectural reason. Do not use them to silence the complexity budget — refactor instead.

## Refactoring Strategies

### Strategy 1: Extract to a Well-Named Function

**Before (with comment):**

```typescript
async function processOrder(order: Order): Promise<number> {
  // Calculate total with tax
  const subtotal = order.items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.08;
  return subtotal + tax;
}
```

**After (self-documenting):**

```typescript
const TAX_RATE = 0.08;

const calculateSubtotal = (order: Order): number =>
  order.items.reduce((sum, item) => sum + item.price, 0);

const calculateTax = (subtotal: number): number => subtotal * TAX_RATE;

async function calculateOrderTotalWithTax(order: Order): Promise<number> {
  const subtotal = calculateSubtotal(order);
  const tax = calculateTax(subtotal);
  return subtotal + tax;
}
```

The function name carries the information that was in the comment.

### Strategy 2: Expressive Variable Names

**Before:**

```typescript
function getUsers(db: Database): Promise<User[]> {
  // Only active users in last 30 days
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return db.users.where(u => u.lastLogin > cutoff && u.active);
}
```

**After:**

```typescript
const DAYS_OF_RECENT_ACTIVITY = 30;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function getRecentlyActiveUsers(db: Database): Promise<User[]> {
  const recentActivityThreshold = new Date(
    Date.now() - DAYS_OF_RECENT_ACTIVITY * MILLISECONDS_PER_DAY
  );
  return db.users.where(user => user.lastLogin > recentActivityThreshold && user.active);
}
```

### Strategy 3: Boolean Variables for Complex Conditions

**Before:**

```typescript
function canProcess(order: Order): boolean {
  // Check if order is valid, paid, and in stock
  if (
    order.items.length > 0 &&
    order.paymentStatus === 'paid' &&
    order.items.every(item => item.inStock)
  ) {
    return true;
  }
  return false;
}
```

**After:**

```typescript
function canProcess(order: Order): boolean {
  const orderHasItems = order.items.length > 0;
  const paymentIsComplete = order.paymentStatus === 'paid';
  const allItemsInStock = order.items.every(item => item.inStock);

  return orderHasItems && paymentIsComplete && allItemsInStock;
}
```

Each predicate is named, and the final expression reads like prose.

### Strategy 4: Named Constants Instead of Magic Numbers

**Before:**

```typescript
function calculateDiscount(amount: number): number {
  // 15% discount for premium customers
  return amount * 0.85;
}
```

**After:**

```typescript
const PREMIUM_DISCOUNT_RATE = 0.15;

function applyPremiumCustomerDiscount(amount: number): number {
  const discountMultiplier = 1 - PREMIUM_DISCOUNT_RATE;
  return amount * discountMultiplier;
}
```

### Strategy 5: Small Single-Purpose Functions

**Before:**

```typescript
async function handleUserRequest(user: User, request: ApiRequest): Promise<ApiResult> {
  // Validate user permissions
  if (!user.hasPermission('admin')) {
    throw new Error('Admin permission required');
  }
  // Log the request
  logger.info(`User ${user.id} made request`);
  // Process the request
  const result = await process(request);
  // Update metrics
  metrics.increment('requests_processed');
  return result;
}
```

**After:**

```typescript
const ensureUserHasAdminPermission = (user: User): void => {
  if (!user.hasPermission('admin')) {
    throw new Error('Admin permission required');
  }
};

const logUserRequest = (user: User): void => {
  logger.info(`User ${user.id} made request`);
};

const incrementRequestMetrics = (): void => {
  metrics.increment('requests_processed');
};

async function handleUserRequest(user: User, request: ApiRequest): Promise<ApiResult> {
  ensureUserHasAdminPermission(user);
  logUserRequest(user);
  const result = await process(request);
  incrementRequestMetrics();
  return result;
}
```

This also keeps each function within the project's complexity budget (cyclomatic ≤ 5, max-statements ≤ 10).

### Strategy 6: Use TypeScript Types as Documentation

A well-typed signature replaces dozens of comments:

**Before:**

```typescript
// Returns user object or null if not found
// id must be a valid UUID
function findUser(id: string): unknown {
  // ...
}
```

**After:**

```typescript
const findUser = async (id: UserId): Promise<User | null> => {
  // ...
};
```

`UserId` is a value object with its own validator (`createUserId`), so the type system enforces what the comment was trying to say.

## Refactoring Process

### Step 1: Find Comments

Use the helper script:

```bash
./.claude/skills/self-documenting-refactor/scripts/find-comments.sh src
```

Or use `grep`/`rg`:

```bash
rg --type ts -n '//|/\*' src/
```

### Step 2: Understand the Comment's Purpose

Ask:

- **What does it explain?** (the behaviour or the reason)
- **Why does the code need explanation?** (unclear naming? complex logic?)
- **What information is the comment carrying?** (business rule, edge case, magic value)

### Step 3: Pick a Strategy

| Comment Type             | Refactor To                                 |
| ------------------------ | ------------------------------------------- |
| Explains what code does  | Extract to well-named function              |
| Describes complex logic  | Break into smaller named functions          |
| Clarifies a variable     | Rename the variable                         |
| Explains a magic number  | Extract to named constant                   |
| Describes a condition    | Extract boolean variable                    |
| Explains an algorithm    | Use the algorithm name in the function name |
| Explains a business rule | Encode the rule in the function name        |
| Workaround note          | Wrap in a `workaroundFor...` function       |

### Step 4: Refactor and Verify

After each refactor:

- Run `npm run lint` (catches dead code, complexity violations introduced by the split)
- Run `npm run typecheck`
- Run the relevant tests

### Step 5: Verify Self-Documentation

Ask:

- Can a new reader understand the code without comments?
- Are function names verb phrases?
- Are variable names descriptive nouns?
- Are complex conditions decomposed into named booleans?
- Are magic numbers extracted to named constants?

## Naming Conventions

### Functions

- Use verb phrases: `calculateTotal`, `validateUser`, `sendEmail`
- Be specific: `getActiveUsersFromLastMonth` over `getUsers`
- Include business context: `applyPremiumDiscount` over `applyDiscount`

### Variables

- Use descriptive nouns: `activeUserCount` over `count`
- Include units: `timeoutMs` over `timeout`
- Express purpose: `usersEligibleForDiscount` over `users`

### Constants

- `UPPER_SNAKE_CASE`: `MAX_RETRY_ATTEMPTS = 3`
- Be explicit: `DEFAULT_PAGE_SIZE = 20` over `DEFAULT = 20`
- Include context: `PREMIUM_DISCOUNT_PERCENTAGE = 15`

### Booleans

- Use predicates: `isValid`, `hasPermission`, `canProcess`
- Be affirmative: `isActive` over `isNotInactive`

### Types and Interfaces

- `PascalCase`, no `I` prefix
- Use the entity name: `User`, not `IUser` or `UserType`
- Suffix DTOs: `CreateUserRequestDto`, `GetUserResponseDto`
- Suffix repositories: `UserQueryRepository`, `UserCommandRepository`

## Common Refactoring Patterns

### Pattern 1: Comment Explaining "Why"

**Before:**

```typescript
// We wait 5 seconds because the external API has rate limiting
await new Promise(r => setTimeout(r, 5000));
```

**After:**

```typescript
const EXTERNAL_API_RATE_LIMIT_DELAY_MS = 5000;

const waitForApiRateLimit = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, EXTERNAL_API_RATE_LIMIT_DELAY_MS));

await waitForApiRateLimit();
```

### Pattern 2: Comment Listing Steps

**Before:**

```typescript
async function checkout(cart: Cart): Promise<void> {
  // 1. Validate cart
  // 2. Calculate total
  // 3. Process payment
  // 4. Send confirmation
  // ...
}
```

**After:**

```typescript
async function checkout(cart: Cart): Promise<void> {
  validateCart(cart);
  const total = calculateCartTotal(cart);
  await processPayment(total);
  await sendOrderConfirmation();
}
```

### Pattern 3: Complex Condition

**Before:**

```typescript
// User can edit if they're the owner or an admin and the document isn't locked
if ((user.id === doc.ownerId || user.role === 'admin') && !doc.isLocked) {
  allowEdit();
}
```

**After:**

```typescript
const userIsOwner = user.id === doc.ownerId;
const userIsAdmin = user.role === 'admin';
const documentIsUnlocked = !doc.isLocked;
const userCanEditDocument = (userIsOwner || userIsAdmin) && documentIsUnlocked;

if (userCanEditDocument) {
  allowEdit();
}
```

## Code Review Checklist

When reviewing TypeScript code for the no-comments policy:

- [ ] Zero comments in the change
- [ ] No TSDoc/JSDoc (`/** */`) blocks
- [ ] No commented-out code
- [ ] Function names describe what they do
- [ ] Variable names describe what they contain
- [ ] Magic numbers extracted to named constants
- [ ] Complex conditions broken into named booleans
- [ ] Each function does one thing
- [ ] Types and DTOs document shapes that comments would otherwise

## Examples from This Project

### Good: Domain Model

```typescript
// src/domain/model/user.ts
export const createUser = (id: UserId, email: string, name: string): User => {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }
  if (!name || name.trim().length === 0) {
    throw new Error('Name cannot be empty');
  }

  return {
    id,
    email: email.trim().toLowerCase(),
    name: name.trim(),
  };
};
```

The function name, parameter types, and error messages document everything. No comments needed.

### Good: Use Case

```typescript
// src/application/use-case/get-user.use-case.ts
export class GetUserUseCase {
  constructor(private readonly queryRepository: UserQueryRepository) {}

  async execute(request: GetUserRequest): Promise<GetUserResponse> {
    const userId = createUserId(request.userId);
    const user = await this.queryRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId.value} not found`);
    }
    return { user };
  }
}
```

Class name, method name, types, and a descriptive error message tell the whole story.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Obvious Comments

```typescript
counter += 1; // Increment counter
return result; // Return the result
```

Just delete them.

### Anti-Pattern 2: Commented-Out Code

```typescript
function process(): void {
  doSomething();
  // oldMethod();           ❌ never leave commented code
  // alternativeApproach(); ❌ use git for history
}
```

Use git for history. Delete commented code.

### Anti-Pattern 3: TODO Comments

```typescript
// TODO: Add error handling
function riskyOperation(): void {}
```

Either implement it now or open a ticket. Don't leave TODOs in the codebase.

### Anti-Pattern 4: TSDoc That Repeats the Signature

```typescript
/**
 * Gets a user by id.
 * @param id the user id
 * @returns the user
 */
const getUser = (id: UserId): User => { ... };
```

The signature already says all of that. Delete the TSDoc.

## Tools for Detection

```bash
# Find single-line and block comments in src/ and test/
rg --type ts -n '^\s*(//|/\*)' src/ test/

# Find TSDoc/JSDoc blocks
rg --type ts -n '^\s*\*' src/ test/

# Find TODO/FIXME markers
rg --type ts -in 'TODO|FIXME|HACK|XXX' src/ test/

# Use the helper script
./.claude/skills/self-documenting-refactor/scripts/find-comments.sh src
```

Expected output: **zero comments** in `src/` and `test/`.

## Remember

> Any fool can write code that a computer can understand. Good programmers write code that humans can understand. — Martin Fowler

In this project, take it further: write code so clear that comments become redundant.

## References

- `references/refactoring-examples-from-codebase.md` — before/after examples drawn from this project
- `scripts/find-comments.sh` — scanner script
