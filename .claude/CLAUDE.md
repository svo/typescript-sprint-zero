# TypeScript Sprint Zero - Claude Code Instructions

## Absolute Non-Negotiables

These rules are **MANDATORY** and violations will break the build:

### 1. NO COMMENTS

- Code MUST be self-documenting through expressive naming
- NEVER add comments to any TypeScript source or test
- If code needs explanation, refactor it to be clearer instead
- TSDoc/JSDoc are not used in this project — types and names carry the meaning

### 2. ONE ASSERTION PER TEST

- Each `it(...)` block MUST contain exactly ONE `expect(...)` assertion
- Split tests with multiple assertions into separate `it` blocks
- **Example:**

  ```typescript
  // WRONG - Multiple assertions
  it('should return user when found', async () => {
    const result = await getUserUseCase.execute({ userId: 'test-id' });
    expect(result.user).toEqual(expectedUser);
    expect(mockQueryRepository.findById).toHaveBeenCalledWith(userId);
  });

  // CORRECT - One assertion per test
  it('should return user when found', async () => {
    const result = await getUserUseCase.execute({ userId: 'test-id' });
    expect(result.user).toEqual(expectedUser);
  });

  it('should call findById with the correct user id', async () => {
    await getUserUseCase.execute({ userId: 'test-id' });
    expect(mockQueryRepository.findById).toHaveBeenCalledWith(userId);
  });
  ```

### 3. LAYER BOUNDARY VIOLATIONS FORBIDDEN

- **`domain/`** MUST NOT import from: `application`, `infrastructure`, `interfaces`, `config`
- **`application/`** MUST NOT import from: `infrastructure`, `interfaces`
- **`infrastructure/`** MUST NOT import from: `interfaces`
- **`interfaces/`** MUST NOT import from `domain` directly — go through `application`
- **`config/`** MAY import from any layer (composition root)

These boundaries are enforced by three independent mechanisms:

1. `eslint-plugin-boundaries` (in `.eslintrc.js`) — fails `npm run lint`
2. `dependency-cruiser` (in `.dependency-cruiser.js`) — fails `npm run arch:validate`
3. Custom architecture tests in `test/architecture/` — fail `npm run test:architecture`

### 4. 100% TEST COVERAGE REQUIRED

- Every function, class, and method MUST have tests
- Tests MUST be meaningful, not just coverage-seeking
- `jest.config.js` enforces 100% across branches, functions, lines, and statements
- Coverage gate runs as part of `npm run test:coverage`

### 5. PREFER EDITING OVER CREATING

- ALWAYS prefer editing existing files to creating new ones
- Only create new files when absolutely necessary
- Do NOT create documentation files unless explicitly requested

### 6. STRICT TYPESCRIPT — NO `any`

- `tsconfig.json` runs the strict family flags including `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`
- ESLint forbids `@typescript-eslint/no-explicit-any` (errors, not warnings)
- `npm run typecheck` must pass before completion

### 7. COMPLEXITY BUDGET

ESLint enforces hard limits for source code (`src/**/*.ts`):

| Rule                      | Limit                              |
| ------------------------- | ---------------------------------- |
| `complexity` (cyclomatic) | 5                                  |
| `max-depth`               | 3                                  |
| `max-nested-callbacks`    | 2                                  |
| `max-lines-per-function`  | 50 (excluding blank/comment lines) |
| `max-statements`          | 10                                 |
| `max-params`              | 3                                  |

Test files have a relaxed budget (see `.eslintrc.js` overrides). When you exceed the source budget, refactor — do not raise the limit.

## Architectural Layer Rules

### Project Structure Overview

```
project/
├── src/
│   ├── domain/                         # Business logic (pure)
│   │   ├── model/
│   │   │   └── user.ts
│   │   ├── repository/
│   │   │   └── user-repository.ts
│   │   └── health/
│   │       ├── health-checker.ts
│   │       └── health-status.ts
│   │
│   ├── application/                    # Use cases
│   │   └── use-case/
│   │       ├── create-user.use-case.ts
│   │       ├── get-user.use-case.ts
│   │       └── health.use-case.ts
│   │
│   ├── infrastructure/                 # Adapters, drivers
│   │   ├── persistence/
│   │   │   └── memory/
│   │   │       └── in-memory-user-repository.ts
│   │   ├── observability/              # Logging, metrics, tracing (when added)
│   │   ├── security/
│   │   │   └── basic-authenticator.ts
│   │   └── system/
│   │       └── system-health-checker.ts
│   │
│   ├── interfaces/                     # APIs and HTTP
│   │   └── http/
│   │       ├── adapters/
│   │       │   └── express-server.adapter.ts
│   │       ├── controllers/
│   │       │   ├── abstract-user.controller.ts
│   │       │   ├── user.controller.ts
│   │       │   └── health.controller.ts
│   │       ├── dto/
│   │       │   ├── user.dto.ts
│   │       │   └── health.dto.ts
│   │       ├── middleware/
│   │       │   └── auth.middleware.ts
│   │       ├── routes/
│   │       │   ├── user.routes.ts
│   │       │   └── health.routes.ts
│   │       ├── abstract-server.ts
│   │       └── server.ts
│   │
│   ├── config/                         # DI and configuration (composition root)
│   │   ├── container.ts
│   │   └── environment.ts
│   │
│   └── main.ts                         # Application entry point
│
└── test/                               # Tests mirror src/ structure exactly
    ├── architecture/                   # Architecture-as-code tests
    ├── application/
    ├── domain/
    ├── infrastructure/
    └── interfaces/
```

### Domain Layer (`src/domain/`)

**Purpose:** Pure business logic, entities, and repository interfaces

**Rules:**

- Define repository interfaces using TypeScript `interface`
- Implement entities as `interface { readonly ... }` plus factory functions
- Validation lives in factory functions (e.g., `createUser`, `createUserId`)
- MUST NOT depend on Express, databases, or any framework
- MUST NOT have side effects (no I/O, no external calls)

**Structure:**

- `model/` — Domain entities and factories (e.g., `user.ts`)
- `repository/` — Repository interfaces (e.g., `UserQueryRepository`, `UserCommandRepository`)
- `health/` — Health domain logic

### Application Layer (`src/application/`)

**Purpose:** Orchestrate use cases and coordinate domain logic

**Rules:**

- Use cases are classes with `execute(request): Promise<response>`
- Co-locate `Request` and `Response` interfaces in the same file as the use case
- Inject dependencies via constructor (`private readonly`)
- Depend on **interfaces** from `domain/repository`, never on concrete implementations
- MUST NOT depend on Express, databases, or file systems directly

**Structure:**

- `use-case/` — One file per use case, kebab-cased: `create-user.use-case.ts`

### Infrastructure Layer (`src/infrastructure/`)

**Purpose:** Implement technical adapters and integrations

**Rules:**

- Implement repository interfaces from `domain/repository`
- Handle all external integrations (databases, APIs, message queues)
- Provide concrete implementations of domain abstractions
- Include observability, security, and system implementations

**Structure:**

- `persistence/` — Repository implementations (e.g., `memory/in-memory-user-repository.ts`)
- `observability/` — Structured logging, metrics collection, distributed tracing
- `security/` — Authentication and authorization
- `system/` — Health checks and diagnostics

### Interfaces Layer (`src/interfaces/`)

**Purpose:** Expose APIs and handle HTTP communication

**Rules:**

- Controllers depend on **use cases** from the application layer, never directly on domain types
- DTOs handle request/response shaping
- Use Express types (`Request`, `Response`) at the controller boundary only
- Express access goes through `adapters/express-server.adapter.ts` — keep the framework-agnostic seam intact
- Translate domain errors to HTTP status codes inside controllers

**Structure:**

- `http/controllers/` — Express request handlers
- `http/dto/` — Request/response interfaces and factory functions
- `http/middleware/` — Cross-cutting concerns (auth, etc.)
- `http/routes/` — Route configuration
- `http/adapters/` — Server adapters (framework abstraction)
- `http/abstract-server.ts` — Framework-agnostic server contract

### Config Layer (`src/config/`)

**Purpose:** Composition root — DI container wiring and environment loading

**Rules:**

- Only the config layer may import from all other layers
- `container.ts` registers all dependencies with `tsyringe`
- `environment.ts` loads and validates environment variables

## Testing Requirements

### Test Naming Convention

Test names MUST be sentences describing the behaviour, using the pattern:

```
should [expected behaviour] when [condition]
```

The `describe` block names the unit under test; the `it` block names the behaviour.

**Examples:**

- `it('should return user when user exists', ...)`
- `it('should throw error when user not found', ...)`
- `it('should reject empty user id', ...)`
- `it('should return 404 when resource is not found', ...)`

### Test Structure

All tests MUST follow Arrange-Act-Assert.

```typescript
import { GetUserUseCase } from '../../../src/application/use-case/get-user.use-case';
import { UserQueryRepository } from '../../../src/domain/repository/user-repository';
import { createUser, createUserId } from '../../../src/domain/model/user';

describe('GetUserUseCase', () => {
  let getUserUseCase: GetUserUseCase;
  let mockQueryRepository: jest.Mocked<UserQueryRepository>;

  beforeEach(() => {
    mockQueryRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      exists: jest.fn(),
      findAll: jest.fn(),
    };
    getUserUseCase = new GetUserUseCase(mockQueryRepository);
  });

  describe('execute', () => {
    it('should return user when user is found', async () => {
      const userId = createUserId('test-id');
      const expectedUser = createUser(userId, 'test@example.com', 'Test User');
      mockQueryRepository.findById.mockResolvedValue(expectedUser);

      const result = await getUserUseCase.execute({ userId: 'test-id' });

      expect(result.user).toEqual(expectedUser);
    });

    it('should throw when user is not found', async () => {
      mockQueryRepository.findById.mockResolvedValue(null);

      await expect(getUserUseCase.execute({ userId: 'missing' })).rejects.toThrow(
        'User with ID missing not found'
      );
    });
  });
});
```

### Architectural Unit Testing

Architecture rules are enforced by tests in `test/architecture/`:

- `architecture-layers.test.ts` — Layer import direction
- `architecture-cycles.test.ts` — No circular dependencies
- `architecture-controllers.test.ts` — Controllers depend on use cases
- `architecture-modules.test.ts` — Module boundaries
- `architecture-shared.test.ts` — Shared module isolation

When you change architecture (new layer, new module type), update these tests in the same change.

### Mocking and Test Isolation

- Use `jest.Mocked<Interface>` for typed test doubles
- Use `jest.fn()` for individual mock functions
- `mockResolvedValue` / `mockRejectedValue` for async stubs
- Mock external dependencies (repositories in use case tests, use cases in controller tests)
- Do NOT mock domain models or DTOs — they are pure data

## Dependency Injection with tsyringe

**ALWAYS use dependency injection** — never directly instantiate dependencies inside a class.

### Project Pattern

This codebase uses `tsyringe`'s container with **factory registration** rather than `@injectable()` decorators on every class. Wiring lives in `src/config/container.ts`.

```typescript
import 'reflect-metadata';
import { container } from 'tsyringe';
import { CreateUserUseCase } from '../application/use-case/create-user.use-case';
import { UserCommandRepository, UserQueryRepository } from '../domain/repository/user-repository';
import { InMemoryUserRepository } from '../infrastructure/persistence/memory/in-memory-user-repository';

export const setupContainer = (): void => {
  const userRepository = new InMemoryUserRepository();

  container.registerInstance<UserQueryRepository>('UserQueryRepository', userRepository);
  container.registerInstance<UserCommandRepository>('UserCommandRepository', userRepository);

  container.register<CreateUserUseCase>(CreateUserUseCase, {
    useFactory: () =>
      new CreateUserUseCase(
        container.resolve<UserCommandRepository>('UserCommandRepository'),
        container.resolve<UserQueryRepository>('UserQueryRepository')
      ),
  });
};
```

**Conventions:**

- String tokens for **interface** registrations (`'UserQueryRepository'`, `'BasicAuthenticator'`)
- Class tokens for **concrete classes** (`CreateUserUseCase`, `HealthController`)
- Wiring lives only in `src/config/container.ts` — never sprinkled across other layers

`reflect-metadata` is imported once at the top of `src/main.ts` and `src/config/container.ts`.

## Observability Requirements

### Structured Logging

- Include `correlation-id` in all log entries for request tracing
- Use structured logging format (JSON) for machine-parseable output
- Log at appropriate levels (DEBUG, INFO, WARN, ERROR)
- Logging implementations live in `infrastructure/observability/`

### Metrics Collection

- Track key business metrics (request counts, latencies, error rates)
- Use appropriate metric types (counters, gauges, histograms)
- Expose metrics at the `/metrics` endpoint

### Distributed Tracing

- Propagate trace context across service boundaries via headers
- Instrument use cases and infrastructure adapters
- Track request flows through the system

### Where Observability Lives

- **Domain interfaces** for logging/metrics ports live in `domain/` (if abstracted)
- **Concrete implementations** live in `infrastructure/observability/`
- **Middleware** for correlation-id injection lives in `interfaces/http/middleware/`
- Never couple domain logic to a specific logging library

## Security Requirements

### Authentication & Authorization

- Authentication domain abstractions live in `domain/` (when domain-level auth logic is needed)
- Concrete implementations live in `infrastructure/security/` (e.g., `basic-authenticator.ts`)
- Middleware enforcement lives in `interfaces/http/middleware/` (e.g., `auth.middleware.ts`)
- Token-based authentication (Bearer tokens) at the HTTP boundary

### Secrets Management

- Never commit credentials or secrets to the repository
- Load secrets from environment variables via `config/environment.ts`
- Use `.env` files for local development (`.env` is gitignored)
- Production secrets come from a secret manager (Vault, AWS SSM, etc.)

### Dependency Auditing

- `audit-ci` runs as part of `npm run security:audit`
- Address critical/high vulnerabilities before merging
- Review transitive dependency updates in `package-lock.json`

## Consumer-Driven Contract Testing (CDCT)

### When Required

- Any internal service your project calls (consumer tests)
- Any API routes your project provides (producer tests)

### Consumer Tests

Verify that external services your code calls return the expected contract:

```typescript
it('should return expected user schema from user service', async () => {
  const response = await supertest(app).get('/api/users/test-id');

  expect(response.body).toMatchObject({
    id: expect.any(String),
    email: expect.any(String),
    name: expect.any(String),
  });
});
```

### Producer Tests

Verify that your API endpoints return the contract consumers depend on:

```typescript
it('should return user schema in GET endpoint response', async () => {
  const response = await supertest(app).get('/api/users/test-id');

  expect(response.body).toMatchObject({
    id: expect.any(String),
    email: expect.any(String),
    name: expect.any(String),
  });
});
```

### Location

Contract tests live in `test/interfaces/http/integration/` alongside other integration tests.

## Code Quality Standards

### Static Analysis Tools

Before completing any work, code MUST pass:

| Tool                 | Purpose                                      | Command                  |
| -------------------- | -------------------------------------------- | ------------------------ |
| `tsc --noEmit`       | Type checking                                | `npm run typecheck`      |
| `eslint`             | Linting, style, complexity, layer boundaries | `npm run lint`           |
| `prettier`           | Code formatting                              | `npm run format:check`   |
| `dependency-cruiser` | Architecture validation                      | `npm run arch:validate`  |
| `jest`               | Tests + 100% coverage                        | `npm run test:coverage`  |
| `audit-ci`           | Dependency vulnerabilities                   | `npm run security:audit` |

The aggregate gate is `npm run test:all`, which runs typecheck → lint → format:check → test:coverage → arch:validate.

### Naming Conventions

- File names: kebab-case with semantic suffixes — `create-user.use-case.ts`, `user.controller.ts`, `user.dto.ts`, `in-memory-user-repository.ts`
- Test files: same name plus `.test.ts` (e.g., `create-user.use-case.test.ts`)
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Type/interface names: `PascalCase` (no `I` prefix — TypeScript convention)
- Constants: `UPPER_SNAKE_CASE`

### TypeScript Patterns

- Prefer `interface` over `type` for object shapes
- Use `readonly` on all immutable fields
- Use factory functions in domain (`createUser`, `createUserId`) — not constructors
- Avoid classes in domain models; reserve classes for use cases, controllers, repositories
- Path aliases: `@/domain/*`, `@/application/*`, `@/infrastructure/*`, `@/interfaces/*`, `@/config/*`

## Development Workflow

### Before Starting Work

1. Identify which architectural layer the change belongs in
2. Identify existing files to edit rather than creating new ones
3. Plan tests before implementation

### During Development

1. Write tests first (TDD red-green-refactor)
2. One assertion per `it` block
3. Use dependency injection (tsyringe)
4. Add observability (structured logging with correlation-id, metrics, tracing)
5. Make code self-documenting (no comments)

### Before Completing Work

1. Run `npm run test:all` — must exit 0
2. Verify architecture tests pass: `npm run test:architecture`
3. Confirm no comments were introduced in `src/`
4. Confirm coverage stayed at 100%

### Running Tests

**IMPORTANT: Always use `npm run test:all` for final verification, NOT `jest` directly.**

Running `jest` directly bypasses six critical quality gates:

- `tsc --noEmit` (type checking)
- `eslint` (linting, complexity, layer boundaries)
- `prettier --check` (formatting)
- `dependency-cruiser` (architecture)
- 100% coverage threshold
- (Plus `audit-ci` if you run `security:audit`)

```bash
# CORRECT — full verification
npm run test:all

# CORRECT — quick iteration during TDD on one file
npx jest path/to/specific.test.ts

# CORRECT — watch mode
npm run test:watch

# WRONG — bypasses quality gates
jest
```

### Pre-commit hook

Husky runs typecheck → lint → format:check → arch:validate → test on every commit. If a hook fails, fix the underlying issue — never use `--no-verify`.

## When Uncertain

### ASK rather than guess when:

- Unclear which layer should contain logic
- Uncertain about dependency direction
- Need clarification on requirements
- Unsure if creating a new file is necessary

### DO NOT:

- Create files without necessity
- Add comments to explain unclear code (refactor instead)
- Violate layer boundaries "just this once"
- Write tests with multiple assertions
- Skip running `npm run test:all` before completion
- Use `any` to make types compile
- Disable an ESLint rule to bypass the complexity budget

## Common Pitfalls to Avoid

1. **Importing from `infrastructure` in `domain`** — domain must be pure
2. **Importing from `domain` in `interfaces`** — go through `application`
3. **Multiple `expect` calls in one `it`** — split into separate `it` blocks
4. **Returning plain objects without DTO interfaces** — DTOs document the contract
5. **Adding comments** — make code self-documenting instead
6. **Direct instantiation in production code** — use the tsyringe container
7. **Wrong test names** — use the `should ... when ...` sentence pattern
8. **Missing observability** — add structured logging with correlation-id, metrics, and tracing
9. **Using `jest` instead of `npm run test:all` for final verification** — bypasses 6 quality gates
10. **Creating new files unnecessarily** — prefer editing existing
11. **`@ts-ignore` / `@ts-expect-error`** — these are not allowed; fix the type instead
12. **Wiring DI outside `src/config/container.ts`** — composition root is the only place
13. **Skipping CDCT tests** — required for any service interactions (consumer and producer)
14. **Committing secrets** — use environment variables and `.env` files (gitignored)

## Success Criteria

Work is complete when:

- [ ] All tests pass with 100% coverage (`npm run test:coverage`)
- [ ] All static analysis passes (`npm run lint`, `npm run typecheck`, `npm run format:check`)
- [ ] Architecture tests pass (`npm run test:architecture`, `npm run arch:validate`)
- [ ] Each test has exactly one `expect` call
- [ ] Test names follow sentence pattern (`should ... when ...`)
- [ ] No comments exist in source or tests
- [ ] Layer boundaries are respected
- [ ] Dependency injection is used throughout
- [ ] DTOs are used at the HTTP boundary
- [ ] No `any` types introduced
- [ ] No secrets committed
- [ ] CDCT tests exist for service interactions
- [ ] Observability is implemented (structured logging, metrics, tracing)
