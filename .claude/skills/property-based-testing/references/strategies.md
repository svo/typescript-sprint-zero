# fast-check Arbitrary Reference

Arbitraries (called "strategies" elsewhere) are the input generators in `fast-check`.

## Primitives

| Type                    | Arbitrary                                    |
| ----------------------- | -------------------------------------------- |
| `number` (integer)      | `fc.integer()`                               |
| Constrained `number`    | `fc.integer({ min: 0, max: 100 })`           |
| `number` (float)        | `fc.float()` / `fc.double()`                 |
| `bigint`                | `fc.bigInt()`                                |
| `string`                | `fc.string()`                                |
| Constrained `string`    | `fc.string({ minLength: 5, maxLength: 10 })` |
| `boolean`               | `fc.boolean()`                               |
| Special: NaN-free float | `fc.float({ noNaN: true })`                  |

## Collections

| Shape                | Arbitrary                                                             |
| -------------------- | --------------------------------------------------------------------- |
| `T[]`                | `fc.array(arbT)`                                                      |
| `T[]` with size      | `fc.array(arbT, { minLength: 1, maxLength: 100 })`                    |
| `Set<T>` (via array) | `fc.uniqueArray(arbT).map(xs => new Set(xs))`                         |
| `Map<K, V>`          | `fc.array(fc.tuple(keyArb, valArb)).map(entries => new Map(entries))` |
| `Record<string, T>`  | `fc.dictionary(fc.string(), arbT)`                                    |
| `[A, B, C]`          | `fc.tuple(arbA, arbB, arbC)`                                          |
| `T \| undefined`     | `fc.option(arbT)`                                                     |
| `A \| B`             | `fc.oneof(arbA, arbB)`                                                |
| Sampled from set     | `fc.constantFrom('red', 'green', 'blue')`                             |
| Constant             | `fc.constant(42)`                                                     |

## Web / IDs

| Type   | Arbitrary           |
| ------ | ------------------- |
| UUID   | `fc.uuid()`         |
| Email  | `fc.emailAddress()` |
| URL    | `fc.webUrl()`       |
| IPv4   | `fc.ipV4()`         |
| IPv6   | `fc.ipV6()`         |
| Domain | `fc.domain()`       |

## Dates and Time

| Type          | Arbitrary                                                           |
| ------------- | ------------------------------------------------------------------- |
| `Date`        | `fc.date()`                                                         |
| Date in range | `fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 0, 1) })` |

## Building Object Arbitraries

### `fc.record` for fixed-shape objects

```typescript
const user = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  age: fc.integer({ min: 0, max: 150 }),
  email: fc.emailAddress(),
});
```

### Mapping arbitraries through factories

The cleanest way to generate domain entities is to map a record through the factory:

```typescript
import fc from 'fast-check';
import { createUser, createUserId } from '../../src/domain/model/user';

const userIdValues = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
const userIds = userIdValues.map(createUserId);

const validUsers = fc
  .record({
    id: userIds,
    email: fc.emailAddress(),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  })
  .map(({ id, email, name }) => createUser(id, email, name));
```

The factory enforces the same invariants the domain enforces, so any `User` produced by `validUsers` is guaranteed to be a real, valid domain object.

### Optional fields

```typescript
const partialUser = fc.record(
  {
    id: fc.string(),
    name: fc.string(),
    email: fc.emailAddress(),
  },
  { requiredKeys: ['id'] }
);
// id is required; name and email may be missing.
```

## Composite Arbitraries

For arbitraries that depend on previously drawn values, use `fc.constantFrom`/`fc.tuple`/`fc.oneof` rather than imperative control flow. If you genuinely need stateful generation, use `fc.letrec` (recursive structures).

## Best Practices

### 1. Constrain Early

```typescript
// ✅ constraint in arbitrary
fc.integer({ min: 1, max: 100 });

// ❌ rejection sampling — slow and noisy
fc.integer().filter(x => x >= 1 && x <= 100);
```

### 2. Set Size Limits

```typescript
fc.array(fc.integer(), { maxLength: 100 });
fc.string({ maxLength: 1000 });
```

Without limits, fast-check may explore very long inputs that slow tests without adding signal.

### 3. Match Real-World Constraints

```typescript
// User ages — not arbitrary integers
fc.integer({ min: 0, max: 150 });

// Email — use the dedicated arbitrary
fc.emailAddress();
```

### 4. Reuse Arbitraries

Define once at module scope, use across `it` blocks:

```typescript
const validUsers = fc.record({ ... });

it('should ...', () => {
  fc.assert(fc.property(validUsers, user => { ... }));
});

it('should ...', () => {
  fc.assert(fc.property(validUsers, user => { ... }));
});
```

### 5. Sample to Debug

```typescript
import fc from 'fast-check';

console.log(fc.sample(validUsers, 10));
// Prints 10 sample users — useful when designing the arbitrary.
```

## Smaller Cheatsheet

| Need             | Arbitrary                                          |
| ---------------- | -------------------------------------------------- |
| Any integer      | `fc.integer()`                                     |
| Positive integer | `fc.nat()` (0..2^31-1) or `fc.integer({ min: 1 })` |
| Any string       | `fc.string()`                                      |
| Non-empty string | `fc.string({ minLength: 1 })`                      |
| Email            | `fc.emailAddress()`                                |
| UUID             | `fc.uuid()`                                        |
| Array of T       | `fc.array(arbT)`                                   |
| Optional T       | `fc.option(arbT)`                                  |
| One of A or B    | `fc.oneof(arbA, arbB)`                             |
| Pick from set    | `fc.constantFrom(...)`                             |
| Object           | `fc.record({...})`                                 |
| Tuple            | `fc.tuple(...)`                                    |

## Common Mistakes

- **Using `.filter` for narrow constraints** — redesign the arbitrary
- **Generating objects via constructors that throw** — wrap with a `.filter` only if rare; otherwise extract validation into the arbitrary
- **Inline arbitraries that violate the function-length budget** — extract to module scope
- **No size limits** — tests become slow and the failure messages become unreadable
