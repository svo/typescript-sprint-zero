---
name: Hexagonal Architecture Feature Scaffolder
description: This skill should be used when the user asks to "create a new feature", "scaffold a feature", "add a new domain entity", "create a new API endpoint", "add a new resource", or "implement a new use case". This skill guides Claude through creating features following the project's hexagonal architecture with proper layer separation, tsyringe DI, and 100% test coverage.
version: 1.0.0
---

# Hexagonal Architecture Feature Scaffolder

## Overview

This skill guides you through scaffolding a complete feature across all layers of the hexagonal architecture used in this TypeScript Sprint Zero project. It ensures proper layer separation, tsyringe-based dependency injection, and adherence to the project's quality gates (100% coverage, complexity budget, no comments, one assertion per test).

## When to Use This Skill

Use when implementing any new feature that requires:

- A new domain entity or business rule
- A new API endpoint
- A new use case or workflow
- A complete vertical slice through the architecture

## Architecture Layers

The project follows hexagonal architecture with these layers:

1. **`src/domain/`** — Pure business logic, entities, repository interfaces. No external dependencies.
2. **`src/application/`** — Use case orchestration. Depends on domain interfaces only.
3. **`src/infrastructure/`** — Technical adapters: persistence, security, system, external integrations.
4. **`src/interfaces/`** — HTTP controllers, DTOs, middleware, routes. Depends on `application/` only.
5. **`src/config/`** — Composition root: DI container wiring and environment loading. May import from any layer.

See `references/layer-dependency-rules.md` for the complete import direction matrix and enforcement mechanisms.

See `references/existing-user-example.md` for a working reference implementation (the `User` feature) that demonstrates every pattern below.

## Step-by-Step Scaffolding Process

For a feature called `Widget`, the steps are:

### Step 1: Domain Model

**Location:** `src/domain/model/widget.ts`

Use a `readonly` interface plus factory functions. Validation lives in the factory.

```typescript
export interface WidgetId {
  readonly value: string;
}

export interface Widget {
  readonly id: WidgetId;
  readonly name: string;
}

export const createWidgetId = (value: string): WidgetId => {
  if (!value || value.trim().length === 0) {
    throw new Error('Widget ID cannot be empty');
  }
  return { value: value.trim() };
};

export const createWidget = (id: WidgetId, name: string): Widget => {
  if (!name || name.trim().length === 0) {
    throw new Error('Widget name cannot be empty');
  }
  return { id, name: name.trim() };
};
```

**Rules:**

- No classes for domain entities — use `interface` + factories
- Validation lives in the factory; constructors do not exist
- `readonly` on every field
- No imports from `application`, `infrastructure`, `interfaces`, or `config`
- No framework dependencies (no `express`, no DB libs)

### Step 2: Repository Interface (Domain)

**Location:** `src/domain/repository/widget-repository.ts`

Define separate query and command interfaces (CQRS):

```typescript
import { Widget, WidgetId } from '../model/widget';

export interface WidgetRepository {
  create(widget: Widget): Promise<WidgetId>;
  findById(id: WidgetId): Promise<Widget | null>;
  exists(id: WidgetId): Promise<boolean>;
}

export interface WidgetQueryRepository extends WidgetRepository {
  findAll(): Promise<Widget[]>;
}

export interface WidgetCommandRepository {
  create(widget: Widget): Promise<WidgetId>;
  update(widget: Widget): Promise<void>;
  delete(id: WidgetId): Promise<void>;
}
```

**Rules:**

- Use `interface` (not abstract classes)
- All methods return `Promise<...>` even when synchronous today — preserves seam
- Splitting query and command interfaces enables CQRS and independent test mocking

### Step 3: Repository Implementation (Infrastructure)

**Location:** `src/infrastructure/persistence/memory/in-memory-widget-repository.ts`

```typescript
import { Widget, WidgetId } from '../../../domain/model/widget';
import {
  WidgetCommandRepository,
  WidgetQueryRepository,
} from '../../../domain/repository/widget-repository';

export class InMemoryWidgetRepository implements WidgetQueryRepository, WidgetCommandRepository {
  private readonly widgets = new Map<string, Widget>();

  async create(widget: Widget): Promise<WidgetId> {
    if (this.widgets.has(widget.id.value)) {
      throw new Error(`Widget with ID ${widget.id.value} already exists`);
    }
    this.widgets.set(widget.id.value, widget);
    return widget.id;
  }

  async findById(id: WidgetId): Promise<Widget | null> {
    return this.widgets.get(id.value) ?? null;
  }

  async exists(id: WidgetId): Promise<boolean> {
    return this.widgets.has(id.value);
  }

  async findAll(): Promise<Widget[]> {
    return Array.from(this.widgets.values());
  }

  async update(widget: Widget): Promise<void> {
    if (!this.widgets.has(widget.id.value)) {
      throw new Error(`Widget with ID ${widget.id.value} not found`);
    }
    this.widgets.set(widget.id.value, widget);
  }

  async delete(id: WidgetId): Promise<void> {
    if (!this.widgets.has(id.value)) {
      throw new Error(`Widget with ID ${id.value} not found`);
    }
    this.widgets.delete(id.value);
  }
}
```

**Rules:**

- One concrete class implements both query and command interfaces when storage is shared
- May import from `domain/` and `application/` only
- Throws `Error` with descriptive messages — controllers translate to HTTP later

### Step 4: Use Case (Application)

**Location:** `src/application/use-case/get-widget.use-case.ts`

```typescript
import { Widget, createWidgetId } from '../../domain/model/widget';
import { WidgetQueryRepository } from '../../domain/repository/widget-repository';

export interface GetWidgetRequest {
  readonly widgetId: string;
}

export interface GetWidgetResponse {
  readonly widget: Widget;
}

export class GetWidgetUseCase {
  constructor(private readonly queryRepository: WidgetQueryRepository) {}

  async execute(request: GetWidgetRequest): Promise<GetWidgetResponse> {
    const widgetId = createWidgetId(request.widgetId);
    const widget = await this.queryRepository.findById(widgetId);
    if (!widget) {
      throw new Error(`Widget with ID ${widgetId.value} not found`);
    }
    return { widget };
  }
}
```

**Rules:**

- Co-locate `Request` and `Response` interfaces in the same file
- Use `class` with constructor injection — `private readonly` for each dependency
- Depend on **interfaces** from `domain/repository`, never on concrete implementations
- One method: `execute(request): Promise<response>`

### Step 5: DTOs (Interfaces)

**Location:** `src/interfaces/http/dto/widget.dto.ts`

```typescript
export interface CreateWidgetRequestDto {
  readonly name: string;
  readonly id?: string;
}

export interface CreateWidgetResponseDto {
  readonly id: string;
  readonly location: string;
}

export interface GetWidgetResponseDto {
  readonly id: string;
  readonly name: string;
}

export interface WidgetData {
  readonly id: { value: string };
  readonly name: string;
}

export const createWidgetResponseDto = (widgetId: string): CreateWidgetResponseDto => ({
  id: widgetId,
  location: `/widgets/${widgetId}`,
});

export const getWidgetResponseDto = (widget: WidgetData): GetWidgetResponseDto => ({
  id: widget.id.value,
  name: widget.name,
});
```

**Rules:**

- Use `readonly` interfaces and pure factory functions
- Never expose domain types directly to the HTTP boundary — wrap in DTOs
- DTOs may not import from `domain/` (the architecture tests enforce this); accept a structural type like `WidgetData` instead

### Step 6: Controller (Interfaces)

**Location:** `src/interfaces/http/controllers/widget.controller.ts`

Keep controllers small. Extract validation and error mapping into private helpers to stay within the complexity budget (cyclomatic ≤ 5, max-statements ≤ 10).

```typescript
import { Request, Response } from 'express';
import { GetWidgetUseCase } from '../../../application/use-case/get-widget.use-case';
import { getWidgetResponseDto, createErrorResponseDto } from '../dto/widget.dto';

export class WidgetController {
  constructor(private readonly getWidgetUseCase: GetWidgetUseCase) {}

  private validateGetWidget(widgetId: string | undefined, res: Response): widgetId is string {
    if (!widgetId) {
      res.status(400).json(createErrorResponseDto('ValidationError', 'Widget ID is required'));
      return false;
    }
    return true;
  }

  private handleGetWidgetError(error: unknown, res: Response): void {
    if (!(error instanceof Error)) {
      res.status(500).json(createErrorResponseDto('InternalServerError', 'Unexpected error'));
      return;
    }
    if (error.message.includes('not found')) {
      res.status(404).json(createErrorResponseDto('NotFoundError', error.message));
    } else {
      res.status(400).json(createErrorResponseDto('ValidationError', error.message));
    }
  }

  getWidget = async (req: Request, res: Response): Promise<void> => {
    try {
      const widgetId = req.params['id'];
      if (!this.validateGetWidget(widgetId, res)) return;
      const result = await this.getWidgetUseCase.execute({ widgetId });
      res.status(200).json(getWidgetResponseDto(result.widget));
    } catch (error) {
      this.handleGetWidgetError(error, res);
    }
  };
}
```

**Rules:**

- Arrow-function methods (`getWidget = async (req, res) => {...}`) — they bind `this` and are easy to pass to `Router`
- Extract validation and error mapping into private methods
- Map errors to HTTP status codes inside the controller
- Use DTOs for both request and response

### Step 7: Routes (Interfaces)

**Location:** `src/interfaces/http/routes/widget.routes.ts`

```typescript
import { Router } from 'express';
import { WidgetController } from '../controllers/widget.controller';

export const createWidgetRoutes = (widgetController: WidgetController): Router => {
  const router = Router();
  router.get('/widgets/:id', widgetController.getWidget);
  return router;
};
```

### Step 8: Wire Up DI (Config)

Edit **only** `src/config/container.ts` — the composition root. Never wire DI elsewhere.

```typescript
import { GetWidgetUseCase } from '../application/use-case/get-widget.use-case';
import { WidgetQueryRepository } from '../domain/repository/widget-repository';
import { InMemoryWidgetRepository } from '../infrastructure/persistence/memory/in-memory-widget-repository';
import { WidgetController } from '../interfaces/http/controllers/widget.controller';

export const setupContainer = (): void => {
  const widgetRepository = new InMemoryWidgetRepository();
  container.registerInstance<WidgetQueryRepository>('WidgetQueryRepository', widgetRepository);

  container.register<GetWidgetUseCase>(GetWidgetUseCase, {
    useFactory: () =>
      new GetWidgetUseCase(container.resolve<WidgetQueryRepository>('WidgetQueryRepository')),
  });

  container.register<WidgetController>(WidgetController, {
    useFactory: () => new WidgetController(container.resolve<GetWidgetUseCase>(GetWidgetUseCase)),
  });
};
```

**Conventions:**

- String token (`'WidgetQueryRepository'`) for **interface** registrations
- Class token (`GetWidgetUseCase`, `WidgetController`) for **concrete** classes
- Use `useFactory` for resolution rather than scattering `@injectable()` decorators

### Step 9: Test Files

For each source file, create a test file at the mirroring path under `test/`:

```
test/domain/model/widget.test.ts
test/infrastructure/persistence/memory/in-memory-widget-repository.test.ts
test/application/use-case/get-widget.use-case.test.ts
test/interfaces/http/dto/widget.dto.test.ts
test/interfaces/http/controllers/widget.controller.test.ts
test/interfaces/http/routes/widget.routes.test.ts
```

Use the **test-generator** skill for the test bodies — it enforces the one-assertion-per-test rule and the `should ... when ...` naming.

### Step 10: Update Architecture Tests if Needed

If you introduce a new module type (not just a new feature within an existing layer), update `test/architecture/` accordingly. For ordinary features, the existing layer tests already cover you.

## Critical Rules

1. **NO COMMENTS** — code must be self-documenting through expressive naming
2. **Layer boundaries** — enforced by ESLint, dependency-cruiser, and Jest architecture tests:
   - `domain/` cannot import from any other layer
   - `application/` cannot import from `infrastructure/` or `interfaces/`
   - `infrastructure/` cannot import from `interfaces/`
   - `interfaces/` cannot import from `domain/` directly (go through `application/`)
3. **Dependency injection** — wiring lives only in `src/config/container.ts`
4. **One assertion per test** — every `it(...)` has exactly one `expect(...)`
5. **100% coverage** — enforced by `jest.config.js`
6. **Strict TypeScript** — `any` is forbidden by ESLint
7. **Complexity budget** — cyclomatic ≤ 5, max-depth ≤ 3, max-statements ≤ 10, max-params ≤ 3, max-lines-per-function ≤ 50

## Verification Checklist

After scaffolding, run and verify:

- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run format:check` exits 0
- [ ] `npm run arch:validate` exits 0
- [ ] `npm run test:architecture` passes
- [ ] `npm run test:coverage` passes with 100% across all dimensions
- [ ] No comments in `src/` or `test/`
- [ ] Each new test file has one `expect` per `it`
- [ ] DTOs used at HTTP boundary (no domain types leak)
- [ ] DI wiring lives only in `src/config/container.ts`
- [ ] Repository interface in `domain/`, implementation in `infrastructure/`

The aggregate gate is `npm run test:all`.

## References

- `references/existing-user-example.md` — full walkthrough of the existing `User` feature
- `references/layer-dependency-rules.md` — import direction matrix and enforcement

## Common Mistakes

1. **Direct instantiation** — always go through the tsyringe container
2. **Domain importing infrastructure** — keep `domain/` pure
3. **DTOs that import domain types** — use a structural type at the boundary
4. **Business logic in controllers** — push logic into use cases or domain
5. **Multiple `expect` calls in one `it`** — split into separate `it` blocks
6. **Adding `@injectable()` to every class** — this project uses `useFactory` registration
7. **Adding `interface I...` prefix** — TypeScript convention is no `I` prefix
8. **Skipping architecture tests** — they catch boundary violations the linter misses
9. **Adding comments** — refactor to self-documenting code instead
10. **Using `any`** — ESLint will reject it; fix the type instead
