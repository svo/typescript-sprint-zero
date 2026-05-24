# Generating Property-Based Tests (TypeScript / fast-check)

How to create complete, runnable property-based tests with `fast-check`.

## Process

### 1. Analyze the Target Function

- Read the signature, parameter types, return type
- Understand input constraints (TypeScript types are a head start)
- Identify the expected behaviour
- Note preconditions or invariants
- Look at existing example-based tests for hints

### 2. Design Input Arbitraries

Create generator arbitraries for each input parameter.

**Principles:**

- Build constraints **into** the arbitrary, not via `.filter(...)` rejection
- Use realistic size limits to keep tests fast
- Match real-world constraints (e.g., user ages 0–150, not all integers)

### 3. Identify Applicable Properties

| Property             | When to Use            | Pattern                                      |
| -------------------- | ---------------------- | -------------------------------------------- |
| Roundtrip            | encode/decode pairs    | `decode(encode(x)) === x`                    |
| Idempotence          | normalization, sorting | `f(f(x)) === f(x)`                           |
| Invariant            | any transformation     | `invariant(f(x))` holds                      |
| No exception         | all functions (weak)   | function completes without throwing          |
| Type preservation    | typed functions        | output is the expected type                  |
| Length preservation  | collections            | `f(xs).length === xs.length`                 |
| Element preservation | sorting                | `sortedArr` and `arr` have the same elements |
| Ordering             | sorting                | adjacent pairs are ordered                   |
| Oracle               | reference impl exists  | `f(x) === referenceImpl(x)`                  |
| Commutativity        | binary ops             | `f(a, b) === f(b, a)`                        |

### 4. Write the Test

Each property goes in its own `it` block (one assertion per test rule applies — see SKILL.md).

### 5. Cover Edge Cases Explicitly

Use `fc.pre`/`fc.examples` or pass explicit values as the second argument to `fc.assert`:

```typescript
fc.assert(
  fc.property(fc.array(fc.integer()), arr => {
    expect([...arr].sort().length).toBe(arr.length);
  }),
  { examples: [[[]], [[0]], [[1, 1, 1]]] }
);
```

## Settings Recommendations

```typescript
// Default — fast-check uses 100 runs by default
fc.assert(fc.property(...));

// Increase for thorough CI
fc.assert(fc.property(...), { numRuns: 1000 });

// Reproducible failures with a fixed seed
fc.assert(fc.property(...), { seed: 4242 });

// With @fast-check/jest
test.prop([fc.nat()], { numRuns: 1000, seed: 4242 })('property name', ...);
```

## Example Test Patterns

### Roundtrip (Encode/Decode)

```typescript
import fc from 'fast-check';
import { encodeMessage, decodeMessage } from '../../../src/domain/codec';

describe('messageCodec', () => {
  it('should roundtrip any valid message', () => {
    fc.assert(
      fc.property(messages, msg => {
        expect(decodeMessage(encodeMessage(msg))).toEqual(msg);
      })
    );
  });
});

const messages = fc.record({
  id: fc.uuid(),
  content: fc.string({ maxLength: 1000 }),
  priority: fc.integer({ min: 1, max: 10 }),
  tags: fc.array(fc.string({ maxLength: 50 }), { maxLength: 20 }),
});
```

### Idempotence (Normalization)

```typescript
import fc from 'fast-check';
import { normalizeEmail } from '../../../src/domain/email';

describe('normalizeEmail', () => {
  it('should be idempotent', () => {
    fc.assert(
      fc.property(fc.emailAddress(), email => {
        expect(normalizeEmail(normalizeEmail(email))).toBe(normalizeEmail(email));
      })
    );
  });
});
```

### Sorting Properties

```typescript
import fc from 'fast-check';

describe('sortAscending', () => {
  it('should preserve length', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), arr => {
        expect(sortAscending(arr).length).toBe(arr.length);
      })
    );
  });

  it('should preserve elements', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), arr => {
        const sorted = sortAscending(arr);
        expect([...sorted].sort((a, b) => a - b)).toEqual([...arr].sort((a, b) => a - b));
      })
    );
  });

  it('should produce a non-decreasing sequence', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), arr => {
        const sorted = sortAscending(arr);
        for (let i = 1; i < sorted.length; i += 1) {
          expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1]!);
        }
      })
    );
  });

  it('should be idempotent', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), arr => {
        expect(sortAscending(sortAscending(arr))).toEqual(sortAscending(arr));
      })
    );
  });
});
```

Note: each `it` has a single property — the one-assertion rule applies at the `it` level. If a property body needs multiple `expect` calls (as in the "non-decreasing sequence" test above, which iterates), that is acceptable when each `expect` is asserting the **same** property over the iteration.

### Domain Factory Validation

`createUserId` rejects empty strings. As a property:

```typescript
import fc from 'fast-check';
import { createUserId } from '../../../src/domain/model/user';

describe('createUserId', () => {
  it('should accept any non-empty trimmed string', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        value => {
          expect(createUserId(value).value).toBe(value.trim());
        }
      )
    );
  });

  it('should reject any whitespace-only string', () => {
    fc.assert(
      fc.property(fc.constantFrom('', ' ', '\t', '\n', '   '), value => {
        expect(() => createUserId(value)).toThrow('cannot be empty');
      })
    );
  });
});
```

## Custom Arbitraries

For domain types, build a reusable arbitrary in module scope:

```typescript
import fc from 'fast-check';
import { createUser, createUserId } from '../../../src/domain/model/user';

const validUsers = fc
  .record({
    id: fc
      .string({ minLength: 1 })
      .filter(s => s.trim().length > 0)
      .map(createUserId),
    email: fc.emailAddress(),
    name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  })
  .map(({ id, email, name }) => createUser(id, email, name));
```

Reuse across tests in the same file. If used across files, extract to a `test/.../fixtures/` module.

## Running

```bash
# All tests
npm test

# Just the file
npx jest path/to/your.test.ts

# With coverage
npm run test:coverage

# Full quality gate
npm run test:all
```

## Checklist Before Finishing

- [ ] Each `it` exercises **one** property
- [ ] At least one **strong** property (not just "no crash")
- [ ] Edge cases covered via `examples` or explicit `it` blocks
- [ ] Arbitraries match real-world constraints (no over-filtering)
- [ ] Custom arbitraries declared at module scope, not inline in the test
- [ ] No `any` types (ESLint will reject)
- [ ] No comments
- [ ] Verified with `npm run test:all`

## Red Flags

- **Reimplementing the function**: `expect(add(a, b)).toBe(a + b)` tests nothing if `add` IS `a + b`
- **Only "no crash"**: weakest property — always look for stronger ones first
- **Over-filtering with `.filter(...)`**: redesign the arbitrary instead
- **Missing edge cases**: empty arrays, single-element arrays, boundary numbers
- **Inline arbitraries that exceed function-length budget**: extract to module scope
