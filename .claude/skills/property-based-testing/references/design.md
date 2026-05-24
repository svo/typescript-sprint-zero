# Property-Driven Development (TypeScript)

Design features by defining properties upfront as executable specifications, before implementation.

## When to Use

- Designing a new feature from scratch
- Building something with clear algebraic properties (serialization, validation, transformations)
- Complex domain where edge cases are likely
- User wants to think through requirements rigorously before coding

## Process

### Phase 1: Understand the Feature

Gather:

- **Purpose** — what problem does this solve?
- **Inputs** — what data does it accept? what makes inputs valid?
- **Outputs** — what does it produce? what guarantees?
- **Constraints** — what must always be true?
- **Edge cases** — boundary conditions
- **Relationships** — inverse operations? compositions?

### Phase 2: Identify Candidate Properties

| Question                               | Property Type | Example                           |
| -------------------------------------- | ------------- | --------------------------------- |
| Does it have an inverse?               | Roundtrip     | `decode(encode(x)) === x`         |
| Is applying it twice the same as once? | Idempotence   | `f(f(x)) === f(x)`                |
| What quantities are preserved?         | Invariants    | length, sum, count                |
| Is order of arguments irrelevant?      | Commutativity | `f(a, b) === f(b, a)`             |
| Can operations be regrouped?           | Associativity | `f(f(a, b), c) === f(a, f(b, c))` |
| Is there a neutral element?            | Identity      | `f(x, 0) === x`                   |
| Is there an oracle/reference impl?     | Oracle        | `newImpl(x) === reference(x)`     |
| Can output be easily verified?         | Hard/Easy     | `isSorted(sort(x))`               |

### Phase 3: Define Input Arbitraries

The arbitrary IS the specification of valid input.

```typescript
import fc from 'fast-check';

const validRegistrationRequests = fc.record({
  username: fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 100 }),
  age: fc.integer({ min: 13, max: 150 }),
});
```

### Phase 4: Write Property Tests Before Implementation

```typescript
describe('registerUser (spec)', () => {
  it('should produce a registered user with normalized email', () => {
    fc.assert(
      fc.property(validRegistrationRequests, req => {
        const user = registerUser(req);
        expect(user.email).toBe(req.email.toLowerCase());
      })
    );
  });
});
```

The test will fail until `registerUser` is implemented. That is the spec made executable.

### Phase 5: Iterate on Design

Properties surface design questions:

- "What about deleted users?"
- "Case-sensitive emails?"
- "Which hashing algorithm?"
- "Stable sort or not?"

Discuss these questions early — before implementation.

## Property Strength Hierarchy

Build incrementally from weak to strong:

### Level 1: No Crash (Weakest)

```typescript
it('should not throw on any valid input', () => {
  fc.assert(
    fc.property(validInputs, input => {
      process(input); // No expect — just must not throw
    })
  );
});
```

### Level 2: Type Preservation

```typescript
it('should always return an Order', () => {
  fc.assert(
    fc.property(validInputs, input => {
      expect(process(input)).toMatchObject({ id: expect.any(String) });
    })
  );
});
```

### Level 3: Invariants

```typescript
it('should produce a non-negative total', () => {
  fc.assert(
    fc.property(validOrders, order => {
      expect(calculateTotal(order)).toBeGreaterThanOrEqual(0);
    })
  );
});
```

### Level 4: Full Specification (Strongest)

```typescript
it('should equal subtotal plus tax', () => {
  fc.assert(
    fc.property(validOrders, order => {
      const subtotal = order.items.reduce((s, i) => s + i.price, 0);
      const expected = subtotal * (1 + TAX_RATE);
      expect(calculateTotal(order)).toBeCloseTo(expected);
    })
  );
});
```

## Strategy Design Principles

### 1. Build Constraints Into the Arbitrary

```typescript
// ✅ GOOD
fc.integer({ min: 1, max: 100 });

// ❌ BAD — high rejection rate
fc.integer().filter(x => x >= 1 && x <= 100);
```

### 2. Match Real-World Constraints

```typescript
const validUsers = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  age: fc.integer({ min: 0, max: 150 }),
  email: fc.emailAddress(),
});
```

### 3. Include Edge Cases Explicitly

```typescript
fc.assert(fc.property(validLists, ...), {
  examples: [[[]], [[1]], [[1, 1, 1]]],
});
```

## Common Design Questions Raised

| Property Attempt    | Question Raised                        |
| ------------------- | -------------------------------------- |
| Roundtrip for users | What about deleted/deactivated users?  |
| Duplicate rejection | Case-sensitive? Unicode normalization? |
| Password storage    | Which algorithm? Salted? Configurable? |
| Ordering guarantee  | Stable sort? Tie-breaking rules?       |

## Red Flags

- **Tautological properties**: don't reimplement the function in the test

  ```typescript
  // ❌ tests nothing
  expect(add(a, b)).toBe(a + b);

  // ✅ tests algebraic structure
  expect(add(a, 0)).toBe(a); // identity
  expect(add(a, b)).toBe(add(b, a)); // commutativity
  ```

- **Starting too strong**: build from weak to strong properties
- **Ignoring design questions**: properties that feel awkward often reveal design gaps
- **Overly complex arbitraries**: a 50-line input arbitrary suggests the domain model needs simplification
- **Not involving the user**: design questions should be discussed, not assumed

## Checklist

- [ ] Properties are not tautological
- [ ] At least one strong property defined
- [ ] Input arbitrary documents valid inputs
- [ ] Design questions surfaced (and recorded somewhere — maybe a design doc, not a code comment)
- [ ] Tests will actually FAIL without implementation
