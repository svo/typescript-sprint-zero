# Refactoring TypeScript for Property-Based Testing

Identify code that can be refactored to enable or improve property-based testing.

## Quick Reference

| Pattern               | Problem                     | Solution                      | Properties Enabled    |
| --------------------- | --------------------------- | ----------------------------- | --------------------- |
| I/O mixed with logic  | Can't test without mocks    | Extract pure core             | Multiple              |
| Encode without decode | No roundtrip possible       | Add inverse                   | Roundtrip             |
| Hardcoded config      | Can't test edge cases       | Inject dependencies           | Full coverage         |
| In-place mutation     | Hard to verify before/after | Return new value              | Comparison properties |
| String building       | Can't verify structure      | Structured + render           | Roundtrip             |
| Implicit invariants   | Can't test constraints      | Make explicit with validation | Invariant             |

## Refactoring Patterns

### 1. Extract Pure Core (High Impact)

**Pattern:** Functions that mix I/O with logic.

```typescript
// BEFORE — hard to test
async function processOrder(orderId: string): Promise<void> {
  const order = await db.fetch(orderId); // I/O
  const discount = calculateDiscount(order); // pure
  const total = applyDiscount(order, discount); // pure
  await db.save(orderId, total); // I/O
}

// AFTER — pure core extracted
export const calculateOrderTotal = (order: Order, rules: DiscountRules): number => {
  const discount = calculateDiscount(order, rules);
  return applyDiscount(order, discount);
};

export async function processOrder(orderId: string): Promise<void> {
  const order = await db.fetch(orderId);
  const total = calculateOrderTotal(order, getDiscountRules());
  await db.save(orderId, total);
}
```

`calculateOrderTotal` is now property-testable. The thin I/O wrapper is integration-tested separately.

**Detection:** functions that both `await db.*` and contain non-trivial branching.

### 2. Add Missing Inverse Operations (High Impact)

**Pattern:** One-way operations that should have pairs.

```typescript
// BEFORE — only encode
export const encodeMessage = (msg: Message): Buffer => {
  return Buffer.from(JSON.stringify(msg), 'utf-8');
};

// AFTER — added decode for roundtrip testing
export const encodeMessage = (msg: Message): Buffer => {
  return Buffer.from(JSON.stringify(msg), 'utf-8');
};

export const decodeMessage = (data: Buffer): Message => {
  return JSON.parse(data.toString('utf-8')) as Message;
};
```

**Detection:** find `encode*`, `serialize*`, `pack*`, `format*` functions without corresponding `decode*`, `deserialize*`, `unpack*`, `parse*` peers.

### 3. Replace Hardcoded Dependencies (Medium Impact)

**Pattern:** Functions reading globals or hardcoded config.

```typescript
// BEFORE
function validateInput(data: string): boolean {
  return data.length <= CONFIG.maxLength;
}

// AFTER — dependencies injected
function validateInput(data: string, maxLength: number): boolean {
  return data.length <= maxLength;
}
```

**Detection:** `rg "(CONFIG\.|process\.env)"` inside `src/domain/` or `src/application/`.

### 4. Return Values Instead of Mutating (Medium Impact)

**Pattern:** Methods that mutate in place.

```typescript
// BEFORE
function sortTasks(tasks: Task[]): void {
  tasks.sort((a, b) => a.priority - b.priority);
}

// AFTER — returns new array
function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.priority - b.priority);
}
```

Pure return values enable comparison properties: input is unchanged, output is sorted.

**Detection:** functions returning `void` whose body calls `.sort`, `.reverse`, `.push`, etc. on a parameter.

### 5. Convert String Building to Structured + Render (Medium Impact)

**Pattern:** Manual string concatenation for structured output.

```typescript
// BEFORE
function buildQuery(table: string, filters: Filters): string {
  let q = `SELECT * FROM ${table}`;
  if (Object.keys(filters).length > 0) {
    q +=
      ' WHERE ' +
      Object.entries(filters)
        .map(([k, v]) => `${k} = '${v}'`)
        .join(' AND ');
  }
  return q;
}

// AFTER — structured representation
export interface Query {
  readonly table: string;
  readonly filters: Filters;
}

export const renderQuery = (q: Query): string => {
  /* ... */
};
export const parseQuery = (sql: string): Query => {
  /* ... */
};
```

Now `parseQuery(renderQuery(q)) === q` becomes a property.

### 6. Add Generators for Predicates (Lower Impact)

**Pattern:** `isValid` exists but no way to generate valid inputs.

```typescript
// BEFORE
export const isValidEmail = (s: string): boolean => /^.+@.+\..+$/.test(s);

// AFTER — pair with a fast-check arbitrary
export const isValidEmail = (s: string): boolean => /^.+@.+\..+$/.test(s);

// In test fixtures (test/.../fixtures/email-arbitrary.ts):
export const validEmails = fc.emailAddress();
```

### 7. Make Implicit Invariants Explicit (Lower Impact)

**Pattern:** Constraints described in comments but not enforced.

```typescript
// BEFORE — only documented in name, not enforced
export function allocateBuffer(size: number): Buffer {
  return Buffer.alloc(size);
}

// AFTER — enforced
const MAX_BUFFER_SIZE = 1024 * 1024;

export function allocateBuffer(size: number): Buffer {
  if (size <= 0 || size > MAX_BUFFER_SIZE) {
    throw new Error(`size must be in (0, ${MAX_BUFFER_SIZE}]`);
  }
  return Buffer.alloc(size);
}
```

Now an "always within range" property has something to check against.

## Evaluation Criteria

| Factor                  | Questions                                                      |
| ----------------------- | -------------------------------------------------------------- |
| Properties enabled      | What tests become possible? Roundtrip > Idempotence > No crash |
| Effort                  | Low/Medium/High — how much code change?                        |
| Risk                    | Breaking changes? API impact?                                  |
| Backwards compatibility | Can old callers still work?                                    |

## Prioritization

1. Strength of properties enabled (roundtrip > idempotence > no crash)
2. Effort required (prefer low-effort wins)
3. Risk level (prefer safe changes)

## Red Flags

- **Breaking the API without warning**: flag breaking changes clearly; offer backwards-compatible alternatives
- **Over-engineering**: not every function needs to be perfectly testable — prioritize high-value code
- **Ignoring existing tests**: run `npm run test:all` after refactoring to verify behaviour unchanged
- **Missing the forest for the trees**: if a module needs wholesale restructuring, say so rather than suggesting 20 small changes
- **Not considering effort vs value**: a complex refactor enabling only "no crash" isn't worth it
