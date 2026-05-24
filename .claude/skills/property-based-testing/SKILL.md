---
name: property-based-testing
description: Provides guidance for property-based testing in TypeScript using fast-check. Use when writing tests, reviewing code with serialization/validation/parsing/normalization patterns, or when property-based testing would provide stronger coverage than example-based tests.
---

# Property-Based Testing Guide (TypeScript)

Use this skill proactively when you encounter patterns where property-based testing (PBT) provides stronger coverage than example-based tests. The recommended library for this codebase is `fast-check` (with optional `@fast-check/jest` integration).

## When to Invoke (Automatic Detection)

**Invoke this skill when you detect:**

- **Serialization pairs**: `encode`/`decode`, `serialize`/`deserialize`, `toJSON`/`fromJSON`, `pack`/`unpack`
- **Parsers**: URL parsing, config parsing, protocol parsing, string-to-structured-data
- **Normalization**: `normalize`, `sanitize`, `clean`, `canonicalize`, `format`
- **Validators**: `isValid`, `validate`, `check*` (especially when paired with normalizers)
- **Data structures**: Custom collections with `add`/`remove`/`get` operations
- **Pure functions**: Sorting, ordering, comparators, mathematical/algorithmic logic
- **Domain factories**: `createX(...)` functions whose validation rules can be expressed as properties (e.g., normalization is idempotent, valid input always produces a value)

**Priority by pattern:**

| Pattern            | Property               | Priority |
| ------------------ | ---------------------- | -------- |
| encode/decode pair | Roundtrip              | HIGH     |
| Pure function      | Multiple               | HIGH     |
| Validator          | Valid after normalize  | MEDIUM   |
| Sorting/ordering   | Idempotence + ordering | MEDIUM   |
| Normalization      | Idempotence            | MEDIUM   |
| Builder/factory    | Output invariants      | LOW      |

## When NOT to Use

- Simple CRUD without transformation logic
- One-off scripts or throwaway code
- Code with side effects that cannot be isolated (network, DB writes)
- Where specific example cases are sufficient and edge cases are well-understood
- Integration or end-to-end testing — PBT is best for unit/component testing

## Property Catalog (Quick Reference)

| Property           | Formula                           | When to Use                          |
| ------------------ | --------------------------------- | ------------------------------------ |
| **Roundtrip**      | `decode(encode(x)) === x`         | Serialization, conversion pairs      |
| **Idempotence**    | `f(f(x)) === f(x)`                | Normalization, formatting, sorting   |
| **Invariant**      | property holds before/after       | Any transformation                   |
| **Commutativity**  | `f(a, b) === f(b, a)`             | Binary/set operations                |
| **Associativity**  | `f(f(a, b), c) === f(a, f(b, c))` | Combining operations                 |
| **Identity**       | `f(x, identity) === x`            | Operations with neutral element      |
| **Inverse**        | `f(g(x)) === x`                   | encrypt/decrypt, compress/decompress |
| **Oracle**         | `newImpl(x) === reference(x)`     | Optimization, refactoring            |
| **Easy to Verify** | `isSorted(sort(x))`               | Complex algorithms                   |
| **No Exception**   | no crash on valid input           | Baseline property                    |

**Strength hierarchy** (weakest → strongest):
No Exception → Type Preservation → Invariant → Idempotence → Roundtrip

## Decision Tree

| TASK                                               | READ                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Writing new tests                                  | `references/generating.md`, then `references/strategies.md` if input generation is complex |
| Designing a new feature                            | `references/design.md` (Property-Driven Development)                                       |
| Code is hard to test (mixed I/O, missing inverses) | `references/refactoring.md`                                                                |
| Reviewing existing PBT tests                       | `references/reviewing.md` (quality checklist)                                              |
| Need library reference                             | `references/libraries.md`                                                                  |

## Getting Started in This Project

`fast-check` is not currently a dependency of this project. To add it:

```bash
npm install --save-dev fast-check
# Optional Jest integration that exposes test.prop:
npm install --save-dev @fast-check/jest
```

### Vanilla `fc.assert`/`fc.property` (no extra setup)

```typescript
import fc from 'fast-check';

describe('substring', () => {
  it('should detect b inside a + b + c', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
        const text = a + b + c;
        expect(text.includes(b)).toBe(true);
      })
    );
  });
});
```

### `@fast-check/jest` (`test.prop`)

```typescript
import { test, fc } from '@fast-check/jest';

test.prop([fc.string(), fc.string(), fc.string()])(
  'should detect b inside a + b + c',
  (a, b, c) => {
    return (a + b + c).includes(b);
  }
);
```

The vanilla approach plays well with the existing Jest test layout and respects the one-assertion-per-test rule (one `fc.assert` invocation per `it`).

## How to Suggest PBT

When you detect a high-value pattern while writing tests, **offer PBT as an option**:

> "I notice `encodeMessage`/`decodeMessage` is a serialization pair. Property-based testing with a roundtrip property would provide stronger coverage than example tests. Want me to use that approach?"

**If `fast-check` is already installed**, be direct:

> "Since this codebase uses fast-check, I'll write a roundtrip property test for this serialization pair."

**If the user declines**, write good example-based tests without further prompting.

## One-Assertion Rule for PBT

This codebase requires one `expect(...)` per `it` block. For PBT:

- Wrap the property body in an `fc.assert(fc.property(...))` call inside an `it`
- Inside the property body, use **at most one** `expect(...)`. If you need more, split into multiple `it` blocks with separate properties.
- Returning a boolean from the property body counts as the assertion (`fc.assert` will throw on `false`) — choose between the boolean form and the `expect` form per test, not both.

```typescript
// One expect inside the property — fine
it('should preserve length when sorting', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), arr => {
      expect([...arr].sort().length).toBe(arr.length);
    })
  );
});

// Boolean form — also fine, no expect
it('should preserve length when sorting', () => {
  fc.assert(fc.property(fc.array(fc.integer()), arr => [...arr].sort().length === arr.length));
});
```

## Red Flags

- Recommending PBT for trivial getters/setters
- Missing paired operations (encode without decode)
- Ignoring TypeScript types (well-typed code is easier to test with PBT)
- Overwhelming the user with candidates (limit to top 5–10)
- Being pushy after the user declines
