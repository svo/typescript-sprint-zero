# Reviewing Property-Based Tests (TypeScript / fast-check)

Evaluate quality of existing PBT tests and suggest improvements.

## Quick Reference

| Issue               | Severity | Detection                                             | Fix                            |
| ------------------- | -------- | ----------------------------------------------------- | ------------------------------ |
| Tautological        | CRITICAL | Assertion compares same expression                    | Rewrite with actual property   |
| Vacuous             | CRITICAL | Heavy `.filter` rejection                             | Remove or fix filter           |
| Weak (no assertion) | HIGH     | Property body has no `expect` and returns `undefined` | Add meaningful assertion       |
| Reimplementation    | HIGH     | Assertion mirrors function logic                      | Use algebraic property instead |
| Over-filtered       | MEDIUM   | Many `.filter` calls                                  | Redesign arbitrary             |
| Missing edge cases  | MEDIUM   | No `examples` option                                  | Add explicit examples          |
| Poor settings       | LOW      | Default `numRuns` for slow code                       | Tune `numRuns`/`timeout`       |

## Quality Issues

### Tautological Properties (CRITICAL)

Properties that are always true regardless of implementation.

```typescript
// BAD — compares function to itself
fc.assert(
  fc.property(fc.array(fc.integer()), arr => {
    expect([...arr].sort()).toEqual([...arr].sort());
  })
);

// BAD — tests nothing about the function
fc.assert(
  fc.property(fc.integer(), x => {
    const result = compute(x);
    expect(result).toBe(result);
  })
);
```

**Detection:** assertions comparing the same expression, or assertions that don't use the function result meaningfully.

### Vacuous Tests (CRITICAL)

Tests where filters reject most inputs.

```typescript
// VACUOUS — impossible filter chain
fc.assert(
  fc.property(
    fc
      .integer()
      .filter(x => x > 100)
      .filter(x => x < 50), // never satisfies
    x => expect(compute(x)).toBeGreaterThan(0)
  )
);

// VACUOUS — only one value possible
fc.assert(
  fc.property(
    fc.integer().filter(x => x === 42), // it's now an example test
    x => expect(compute(x)).toBe(expected)
  )
);
```

**Detection:** chained `.filter` calls, filters with very narrow conditions.

### Weak Properties (HIGH)

Properties that only test minimal guarantees.

```typescript
// WEAK — only tests no crash
fc.assert(
  fc.property(fc.string(), s => {
    process(s);
    // No expect, no return — just shouldn't throw
  })
);

// WEAK — only tests type
fc.assert(
  fc.property(fc.integer(), x => {
    expect(typeof compute(x)).toBe('number');
  })
);
```

Both are acceptable as a baseline, but you should always look for stronger properties first.

### Reimplementing the Function (HIGH)

```typescript
// BAD — just reimplements the logic
fc.assert(
  fc.property(fc.integer(), fc.integer(), (a, b) => {
    expect(add(a, b)).toBe(a + b);
  })
);
```

If `add` IS `a + b`, this test passes by tautology. Use algebraic properties instead:

```typescript
// GOOD — algebraic structure
fc.assert(fc.property(fc.integer(), x => expect(add(x, 0)).toBe(x))); // identity
fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => expect(add(a, b)).toBe(add(b, a)))); // commutativity
```

### Poor Input Coverage (MEDIUM)

```typescript
// NARROW — misses edge cases
fc.assert(
  fc.property(fc.integer({ min: 1, max: 10 }), x => {
    expect(compute(x)).toBeGreaterThanOrEqual(0);
  })
);
// What about 0? Negatives? Very large values?

// MISSING — no edge case examples
fc.assert(
  fc.property(fc.array(fc.integer()), arr => {
    expect(sort(arr).length).toBe(arr.length);
  })
);
// Should include `examples: [[[]], [[1]]]`.
```

### Missing Stronger Properties (MEDIUM)

```typescript
// EXISTS — but could be stronger
fc.assert(
  fc.property(fc.array(fc.integer()), arr => {
    expect(sort(arr).length).toBe(arr.length);
  })
);
// MISSING: ordering, element preservation
```

### Poor Settings (LOW)

```typescript
// TOO FEW — may miss bugs
fc.assert(fc.property(...), { numRuns: 5 });

// NO TIMEOUT — may hang in CI
fc.assert(fc.property(slowArbitrary, fn));  // could timeout
```

## Review Process

### 1. Locate PBT Tests

```bash
rg --type ts "fc\.(assert|property)" test/ src/
rg --type ts "test\.prop\(" test/ src/
```

### 2. Analyze Each Test

Walk through the issues above, starting with critical, then high, medium, low.

### 3. Evaluate Shrinking Quality

Will failures shrink to minimal counterexamples? Complex arbitraries with `.map` chains may produce hard-to-debug failures. Prefer `fc.record` and named base arbitraries.

### 4. Check for Flakiness

- Non-determinism in code under test (timestamps, random)
- Floating-point comparisons without `toBeCloseTo`
- Global state dependencies

### 5. Suggest Stronger Properties

Compare against the property catalog (in `SKILL.md`) — are stronger properties available but not tested?

## Test Health Score

| Category          | Score | What to Check                             |
| ----------------- | ----- | ----------------------------------------- |
| Property strength | X/5   | Roundtrip > Idempotence > Type > No crash |
| Input coverage    | X/5   | Edge cases, arbitrary breadth             |
| Assertions        | X/5   | Meaningful, not tautological              |
| Settings          | X/5   | Appropriate for context                   |

## Mutation Testing Verification

Suggest specific mutations to verify tests catch bugs:

```
To verify test_sort catches bugs:

1. Return input unchanged: `return xs`
   - Should fail: ordering test

2. Drop last element: `return [...xs].sort().slice(0, -1)`
   - Should fail: length-preserved test

3. Reverse order: `return [...xs].sort().reverse()`
   - Should fail: ordering test
```

## Quality Checklist

For each test, verify:

- [ ] Not tautological (assertion doesn't compare same expression)
- [ ] Strong assertion (not just "no crash")
- [ ] Not vacuous (inputs not over-filtered)
- [ ] Edge cases covered (`examples` option or extra `it` blocks)
- [ ] No reimplementation of function logic
- [ ] Appropriate settings (`numRuns`, `seed`, `timeout`)
- [ ] Good shrinking potential (avoid deep `.map` chains)
- [ ] Deterministic (no flakiness)

## Red Flags

- **Marking tautologies as fine**: `expect(x).toBe(x)` is NEVER a valid test
- **Accepting "no crash" as sufficient**: always push for stronger properties
- **Ignoring vacuous tests**: filters that reject 99% of inputs provide false confidence
- **Not checking for reimplementation**: `expect(add(a, b)).toBe(a + b)` tests nothing if `add` is just `+`
