# Claude Code Skills for TypeScript Sprint Zero

Custom skills tailored to this project's hexagonal architecture, TypeScript stack (`tsyringe`, `Express`, Jest), and quality standards (100% coverage, no comments, one assertion per test, complexity budget, layer-boundary enforcement).

## Skills

### 1. Hexagonal Architecture Feature Scaffolder

**Directory:** `hexagonal-architecture-scaffolder/`
**Trigger phrases:** "create a new feature", "scaffold a feature", "add a new domain entity", "create a new API endpoint"

Walks through creating a complete feature across `domain/`, `application/`, `infrastructure/`, `interfaces/`, and `config/container.ts`. Enforces:

- Domain entities as `readonly` interfaces + factory functions (not classes)
- CQRS-split repository interfaces in `domain/`, implementations in `infrastructure/`
- Use cases with constructor DI, one `execute` method
- DTOs at the HTTP boundary
- tsyringe wiring only in `src/config/container.ts` via `useFactory` registration
- Test files mirroring the source structure

**Supporting files:**

- `references/existing-user-example.md` — walkthrough of the existing `User` feature
- `references/layer-dependency-rules.md` — import direction matrix and triple enforcement (ESLint + dep-cruiser + Jest arch tests)

---

### 2. Test Generator with One-Assertion Rule

**Directory:** `test-generator/`
**Trigger phrases:** "generate tests", "create tests for", "write test cases", "add test coverage"

Generates Jest tests following the project's mandatory standards:

- One `expect(...)` per `it(...)`
- `it('should ... when ...')` sentence pattern
- Arrange-Act-Assert with blank-line separation
- `jest.Mocked<Interface>` for typed mocks
- Domain factories in arrangements (not raw object literals)
- Patterns by layer: domain models, repository implementations, use cases, controllers, integration tests

**Supporting files:**

- `references/test-examples-from-codebase.md` — actual examples from `test/`

---

### 3. Self-Documenting Code Refactorer

**Directory:** `self-documenting-refactor/`
**Trigger phrases:** "remove comments", "make code self-documenting", "refactor to eliminate comments"

Enforces the no-comments policy by refactoring TypeScript to be self-explanatory through:

- Extracting to well-named functions
- Expressive variable names
- Boolean predicates for complex conditions
- Named constants for magic numbers
- Single-purpose functions within the complexity budget

**Supporting files:**

- `references/refactoring-examples-from-codebase.md` — before/after examples from this project
- `scripts/find-comments.sh` — bash scanner to find comments in `src/`

```bash
./.claude/skills/self-documenting-refactor/scripts/find-comments.sh src
# Expected output: zero comments
```

---

### 4. Property-Based Testing

**Directory:** `property-based-testing/`
**Trigger phrases:** "property-based testing", "roundtrip test", "fast-check", "encode/decode test"

Guidance for property-based testing in TypeScript using `fast-check`. Covers:

- Detection patterns (encode/decode pairs, normalizers, validators)
- Property catalog (roundtrip, idempotence, invariant, commutativity, oracle)
- `fc.assert(fc.property(...))` and `@fast-check/jest`'s `test.prop`
- Custom arbitraries via `fc.record` mapped through domain factories
- Property strength hierarchy (no-crash → roundtrip)

**Supporting files:**

- `README.md` — overview
- `references/design.md` — Property-Driven Development workflow
- `references/generating.md` — writing PBT tests
- `references/strategies.md` — fast-check arbitrary reference
- `references/libraries.md` — fast-check + cross-language alternatives
- `references/refactoring.md` — making TypeScript code more testable
- `references/reviewing.md` — quality checklist

---

### 5. Test-Driven Development

**Directory:** `test-driven-development/`
**Trigger phrases:** "implement feature", "fix bug", "write code", "TDD", "red-green-refactor"

Strict Red-Green-Refactor enforcement. The Iron Law: no production code without a failing test first. Includes:

- Why test order matters (rebuts common rationalizations)
- Verifying RED before GREEN
- Minimal implementation discipline
- Refactor-only-while-green rule
- Bug-fix workflow (write failing test that reproduces, then fix)

**Supporting files:**

- `testing-anti-patterns.md` — testing mock behaviour, test-only methods, incomplete mocks, etc.

---

### 6. Systematic Debugging

**Directory:** `systematic-debugging/`
**Trigger phrases:** "debug", "fix bug", "test failure", "unexpected behaviour", "not working"

Four-phase methodology (Root Cause → Pattern Analysis → Hypothesis → Implementation). Iron Law: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST. Resists time pressure with explicit anti-patterns. Includes architectural-failure escalation after 3 failed fixes.

**Supporting files:**

- `root-cause-tracing.md` — tracing bugs backward through call stack (with TypeScript-specific hints: `noUncheckedIndexedAccess`, `as` casts, `reflect-metadata`)
- `defense-in-depth.md` — validation at HTTP, domain factory, repository, environment layers
- `condition-based-waiting.md` — replace `setTimeout` with condition polling for flaky tests
- `find-polluter.sh` — bisection script to find tests that pollute global state

---

### 7. Verification Before Completion

**Directory:** `verification-before-completion/`
**Trigger phrases:** "done", "complete", "fixed", "passing", "commit", "create PR", "finished"

Requires running verification commands and reading output before any success claim. Project-specific gate: `npm run test:all` (typecheck → lint → format:check → coverage → arch:validate). Includes a rationalization-prevention table.

---

### 8. Sequential Thinking

**Directory:** `sequential-thinking/`
**Trigger phrases:** "think through", "break down", "analyze step by step", "reason about"

Structured, reflective problem-solving with numbered thought steps, explicit revisions, branches, hypothesis–verification cycles. Integrates with the `mcp__sequential-thinking__sequentialthinking` tool when available.

---

## How Claude Uses These Skills

### Proactive Skills (triggered by Claude's behaviour)

Activated automatically when Claude is doing the relevant kind of work:

- **systematic-debugging** — on bug, test failure, unexpected behaviour
- **test-driven-development** — when implementing any feature or bug fix
- **verification-before-completion** — before claiming work complete
- **sequential-thinking** — for complex problems with trade-offs

### Reactive Skills (triggered by user requests)

- **hexagonal-architecture-scaffolder** — "create a new feature", "scaffold X"
- **test-generator** — "generate tests", "write tests for X"
- **self-documenting-refactor** — "remove comments", "make this self-documenting"
- **property-based-testing** — "property-based test", "roundtrip test"

### Slash Command Invocation

Any skill can be invoked explicitly:

- `/hexagonal-architecture-scaffolder`
- `/test-generator`
- `/self-documenting-refactor`
- `/property-based-testing`
- `/test-driven-development`
- `/systematic-debugging`
- `/verification-before-completion`
- `/sequential-thinking`

## Project-Specific Rules All Skills Enforce

- **No comments** — code self-documents through naming
- **One assertion per test** — exactly one `expect` per `it`
- **Layer boundaries** — `domain → application → (infrastructure | interfaces) ← config`
- **`interfaces/` cannot import from `domain/` directly** — use cases mediate
- **Dependency injection** — wiring lives only in `src/config/container.ts`
- **100% test coverage** — enforced by `jest.config.js`
- **No `any` types** — ESLint rejects them
- **Complexity budget** — cyclomatic ≤ 5, max-statements ≤ 10, max-params ≤ 3

## File Structure

```
.claude/
├── CLAUDE.md
└── skills/
    ├── README.md (this file)
    ├── hexagonal-architecture-scaffolder/
    │   ├── SKILL.md
    │   └── references/
    │       ├── existing-user-example.md
    │       └── layer-dependency-rules.md
    ├── test-generator/
    │   ├── SKILL.md
    │   └── references/
    │       └── test-examples-from-codebase.md
    ├── self-documenting-refactor/
    │   ├── SKILL.md
    │   ├── references/
    │   │   └── refactoring-examples-from-codebase.md
    │   └── scripts/
    │       └── find-comments.sh
    ├── property-based-testing/
    │   ├── SKILL.md
    │   ├── README.md
    │   └── references/
    │       ├── design.md
    │       ├── generating.md
    │       ├── strategies.md
    │       ├── libraries.md
    │       ├── refactoring.md
    │       └── reviewing.md
    ├── test-driven-development/
    │   ├── SKILL.md
    │   └── testing-anti-patterns.md
    ├── systematic-debugging/
    │   ├── SKILL.md
    │   ├── root-cause-tracing.md
    │   ├── defense-in-depth.md
    │   ├── condition-based-waiting.md
    │   └── find-polluter.sh
    ├── verification-before-completion/
    │   └── SKILL.md
    └── sequential-thinking/
        └── SKILL.md
```

## Verifying Skill Discovery

Each skill's frontmatter is checked by Claude Code. Quick check that all SKILL.md files exist:

```bash
ls .claude/skills/*/SKILL.md
# Expected: 8 paths
```

```bash
find .claude -name 'SKILL.md' | wc -l
# Expected: 8
```

## Extending

To add a new skill:

1. Create `.claude/skills/<skill-name>/`
2. Add `SKILL.md` with YAML frontmatter (`name`, `description`, optional `version`, `user_invocable`)
3. Optionally add `references/`, `scripts/`, supporting docs
4. Update this README's index
5. Use specific trigger phrases in the frontmatter `description` so reactive matching works
6. Keep the SKILL body concise — push detail into `references/`

## Resources

- Project rules: `.claude/CLAUDE.md`
- Project README: `README.md`
- Architecture validation: `.eslintrc.js`, `.dependency-cruiser.js`, `test/architecture/`
