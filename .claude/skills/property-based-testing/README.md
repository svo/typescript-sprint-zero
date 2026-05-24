# Property-Based Testing Skill (TypeScript)

A skill that provides guidance for property-based testing (PBT) in this codebase using `fast-check`.

## What This Skill Does

When activated, the skill helps Claude:

- **Detect PBT opportunities** — recognises patterns like encode/decode pairs, validators, normalizers, pure functions, and domain factories
- **Generate property-based tests** — creates `fast-check` tests with appropriate arbitraries, properties, and edge cases
- **Review existing PBT tests** — identifies tautological properties, vacuous tests, and weak assertions
- **Design with properties** — uses Property-Driven Development to define specifications before implementation
- **Refactor for testability** — suggests TypeScript refactors that enable stronger property testing

## Library

| Library            | Use                                               |
| ------------------ | ------------------------------------------------- |
| `fast-check`       | Core PBT library — generators, runners, shrinking |
| `@fast-check/jest` | Optional Jest integration providing `test.prop`   |

Install:

```bash
npm install --save-dev fast-check
npm install --save-dev @fast-check/jest   # optional
```

## File Structure

```
property-based-testing/
├── SKILL.md           # Entry point — detection patterns and routing
├── README.md          # This file
└── references/
    ├── generating.md  # How to write PBT tests (with fast-check examples)
    ├── reviewing.md   # How to evaluate test quality
    ├── strategies.md  # fast-check arbitrary reference
    ├── design.md      # Property-Driven Development workflow
    ├── refactoring.md # Making TypeScript code more testable
    └── libraries.md   # PBT libraries reference (fast-check + alternatives)
```

## Usage

The skill activates automatically when Claude detects relevant patterns:

- Serialization pairs (`encode`/`decode`, `serialize`/`deserialize`)
- Validators and normalizers
- Pure functions with clear input/output types
- Data structure operations
- Domain factories with provable invariants

Or invoke it explicitly: "use property-based testing for this", "/property-based-testing".

### Example Prompts

```
"Write property-based tests for this JSON serializer"
"Review this fast-check test for quality issues"
"Help me design this feature using properties first"
"This function is hard to test — how can I refactor it?"
```

## Property Quick Reference

| Property      | Pattern                       | Use Case           |
| ------------- | ----------------------------- | ------------------ |
| Roundtrip     | `decode(encode(x)) === x`     | Serialization      |
| Idempotence   | `f(f(x)) === f(x)`            | Normalization      |
| Invariant     | property holds                | Any transformation |
| Commutativity | `f(a, b) === f(b, a)`         | Binary operations  |
| Oracle        | `newImpl(x) === reference(x)` | Refactoring        |

## Project-Specific Notes

- One `expect` per `it` — PBT counts as a single assertion when wrapped in one `fc.assert(fc.property(...))`
- Domain factories (`createUser`, `createUserId`) make excellent PBT subjects — use them as the "valid input" arbitrary
- Tests still need to fit within the `max-lines-per-function` budget (300 in tests). Extract custom arbitraries to module scope, not into the test body.
