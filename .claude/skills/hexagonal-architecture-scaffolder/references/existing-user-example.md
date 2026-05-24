# Existing User Feature Example

This document maps the existing `User` feature to the hexagonal layers. Use it as a working reference when scaffolding a new feature.

## File Structure

```
src/
├── domain/
│   ├── model/
│   │   └── user.ts                                     # User, UserId interfaces + factories
│   └── repository/
│       └── user-repository.ts                          # UserRepository, Query/Command interfaces
├── application/
│   └── use-case/
│       ├── create-user.use-case.ts                     # CreateUserUseCase
│       └── get-user.use-case.ts                        # GetUserUseCase
├── infrastructure/
│   └── persistence/
│       └── memory/
│           └── in-memory-user-repository.ts            # Implements both Query and Command
├── interfaces/
│   └── http/
│       ├── controllers/
│       │   ├── abstract-user.controller.ts             # Framework-agnostic shape
│       │   └── user.controller.ts                      # Express-bound implementation
│       ├── dto/
│       │   └── user.dto.ts                             # Request/Response DTOs
│       └── routes/
│           ├── abstract-user.routes.ts
│           └── user.routes.ts
└── config/
    └── container.ts                                    # tsyringe wiring

test/
├── domain/
│   └── model/
│       └── user.test.ts
├── application/
│   └── use-case/
│       ├── create-user.use-case.test.ts
│       └── get-user.use-case.test.ts
├── infrastructure/
│   └── persistence/
│       └── memory/
│           └── in-memory-user-repository.test.ts
└── interfaces/
    └── http/
        ├── controllers/
        │   └── user.controller.test.ts
        └── integration/
            └── api.integration.test.ts
```

## Key Implementation Details

### Domain (`src/domain/model/user.ts`)

- `UserId` is a value object: `interface UserId { readonly value: string }`
- `User` is a `readonly` interface composed of `UserId`, email, name
- Factories `createUserId` and `createUser` perform validation and return frozen-shape objects
- No classes, no constructors, no decorators

### Domain Repository (`src/domain/repository/user-repository.ts`)

- `UserRepository` defines the union of read+write operations
- `UserQueryRepository extends UserRepository` adds bulk reads (`findAll`)
- `UserCommandRepository` is a separate interface with the write side (`create`, `update`, `delete`)
- The split lets use cases ask for only what they need

### Application Use Cases

- `GetUserUseCase` depends on `UserQueryRepository` (read-only)
- `CreateUserUseCase` depends on **both** `UserCommandRepository` and `UserQueryRepository` (it must check uniqueness before writing)
- Each use case has co-located `Request` and `Response` interfaces
- Each has a single `execute(request): Promise<response>` method

### Infrastructure (`src/infrastructure/persistence/memory/in-memory-user-repository.ts`)

- One class implements **both** `UserQueryRepository` and `UserCommandRepository`
- Uses an internal `Map<string, User>` keyed by `UserId.value`
- Throws descriptive `Error` when invariants break — controllers translate to HTTP

### Interfaces

- `UserController` receives `CreateUserUseCase` and `GetUserUseCase` via constructor
- Validation and error-mapping are extracted into **private** helper methods to stay within the complexity budget (cyclomatic ≤ 5)
- Public methods (`createUser`, `getUser`) are arrow functions so they bind `this` when registered with the Express `Router`
- DTOs (`CreateUserRequestDto`, `CreateUserResponseDto`, `GetUserResponseDto`, `ErrorResponseDto`) and their factory functions live in `user.dto.ts`
- The route module (`user.routes.ts`) is a thin function that wires the controller to URL paths

### Composition Root (`src/config/container.ts`)

```typescript
container.registerInstance<UserQueryRepository>('UserQueryRepository', userRepository);
container.registerInstance<UserCommandRepository>('UserCommandRepository', userRepository);
container.register<CreateUserUseCase>(CreateUserUseCase, { useFactory: () => ... });
container.register<GetUserUseCase>(GetUserUseCase, { useFactory: () => ... });
container.register<UserController>(UserController, { useFactory: () => ... });
```

Notice that the same `userRepository` instance is registered against **both** interface tokens. The two interfaces share a single backing implementation but the use cases see them as distinct.

## Pattern Observations

1. **CQRS Separation** — separate query and command interfaces in domain
2. **Shared Storage** — one in-memory map satisfies both interfaces
3. **Use Case per Operation** — `Get...UseCase`, `Create...UseCase` rather than a single `UserService`
4. **Error Translation** — controllers convert domain `Error` strings to HTTP status codes
5. **Authentication** — handled by middleware in `interfaces/http/middleware/`, not inside controllers
6. **Location Header** — `POST` returns a `Location` header pointing at the new resource
7. **Abstract + Concrete** — `abstract-user.controller.ts` defines a framework-agnostic shape, `user.controller.ts` is the Express adapter

## Test Patterns

- Tests mirror source structure exactly
- `describe` for the unit; `it` for the behaviour
- `it('should ... when ...')` sentence pattern
- One `expect` per `it`
- `jest.Mocked<Interface>` for typed mocks
- `beforeEach` resets state between tests
- Architecture tests in `test/architecture/` verify import directions

## Import Flow

```
config/  ─┐
          ├─→ domain/        (imports nothing else)
          ├─→ application/   (imports domain/)
          ├─→ infrastructure/(imports domain/, application/)
          └─→ interfaces/    (imports application/ — NOT domain/ directly)
```

The `interfaces/` → `domain/` edge is forbidden in this codebase. DTOs accept structural types like `WidgetData` so they don't need to import from `domain/`.
