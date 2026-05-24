# Layer Dependency Rules

## Allowed Import Directions

```
┌──────────────────────────────────────────┐
│   config/  (composition root)            │ ← May import from ANY layer
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│   domain/                                │ ← Imports nothing (pure business logic)
└──────────────────────────────────────────┘
                  ↑
                  │
┌──────────────────────────────────────────┐
│   application/                           │ ← May import: domain/
└──────────────────────────────────────────┘   May NOT: infrastructure/, interfaces/
                  ↑
       ┌──────────┴───────────┐
       │                      │
┌───────────────────┐  ┌──────────────────────┐
│ infrastructure/   │  │ interfaces/          │ ← Peers; do not import each other
│                   │  │                      │
│ Imports:          │  │ Imports:             │
│  domain/          │  │  application/        │
│  application/     │  │  (NOT domain/        │
│                   │  │   directly)          │
└───────────────────┘  └──────────────────────┘
```

This is **stricter than typical hexagonal layouts**: the `interfaces/` layer cannot import from `domain/` directly. Use cases must mediate. The architecture test in `test/architecture/architecture-layers.test.ts` enforces this.

## Specific Rules

### `domain/`

**MAY import:**

- Node standard library
- Other `domain/` modules

**MAY NOT import:**

- `application/`
- `infrastructure/`
- `interfaces/`
- `config/`
- `express`, databases, third-party frameworks

**Why:** Domain must remain pure business logic, free from framework coupling. This is the layer that tests can pin down with the highest leverage.

### `application/`

**MAY import:**

- `domain/`
- Node standard library

**MAY NOT import:**

- `infrastructure/`
- `interfaces/`
- `express`, databases, third-party frameworks

**Why:** Use cases orchestrate domain logic but must not know about technical adapters.

### `infrastructure/`

**MAY import:**

- `domain/` (to implement repository interfaces)
- `application/`
- External libraries (database drivers, HTTP clients, etc.)

**MAY NOT import:**

- `interfaces/`

**Why:** Infrastructure provides technical implementations of domain abstractions and consumes use cases for things like background jobs.

### `interfaces/`

**MAY import:**

- `application/`
- External libraries (`express`, validators, etc.)

**MAY NOT import:**

- `domain/` directly
- `infrastructure/`

**Why:** Controllers should depend only on use cases. Domain types reach the HTTP boundary indirectly through DTOs and structural types.

### `config/`

**MAY import:** every layer (this is the composition root)

**Why:** Wiring needs concrete classes from `infrastructure/` and abstractions from `domain/` to register them with the container.

## Enforcement

Three independent mechanisms enforce these rules:

### 1. ESLint (`eslint-plugin-boundaries`)

`.eslintrc.js` defines boundaries via `boundaries/element-types`. Violations fail `npm run lint`.

### 2. dependency-cruiser

`.dependency-cruiser.js` defines forbidden edges plus circular-dependency detection. Violations fail `npm run arch:validate`.

### 3. Custom Jest tests

`test/architecture/architecture-layers.test.ts` and siblings walk the source tree and assert no forbidden imports. Violations fail `npm run test:architecture`.

If you change the layer rules, update **all three**. They exist for redundancy — if you change only the linter, the dep-cruiser config or the architecture tests will still flag violations.

## Common Violations to Avoid

1. **Domain importing `express`** — domain should be transport-agnostic
2. **Domain importing infrastructure** — repository implementations belong in infrastructure
3. **Application importing infrastructure** — use cases depend on domain interfaces, not concretes
4. **DTOs in domain** — DTOs are HTTP-shaping concerns; they live in `interfaces/http/dto`
5. **Use case logic in controllers** — controllers should only translate between HTTP and use cases

## Dependency Injection Pattern

To respect layer boundaries while wiring up dependencies:

1. Define interface in `domain/` (e.g., `WidgetQueryRepository`)
2. Implement in `infrastructure/` (e.g., `InMemoryWidgetRepository`)
3. Use cases depend on the interface (constructor parameter typed as the interface)
4. The container in `config/container.ts` maps the string token to the implementation
5. Controllers receive use cases (not repositories) via the container

This allows swapping implementations (e.g., in-memory → Postgres) without touching `domain/` or `application/`.
