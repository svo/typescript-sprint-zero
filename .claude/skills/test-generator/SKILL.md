---
name: Test Generator with One-Assertion Rule
description: This skill should be used when the user asks to "generate tests", "create tests for", "write test cases", "add test coverage", "write tests", or "test this code". This skill generates Jest tests following the project's strict one-assertion-per-test rule with proper naming and structure.
version: 1.0.0
---

# Test Generator with One-Assertion Rule

## Overview

This skill generates Jest tests following the project's mandatory testing standards:

- **One assertion per test** (critical rule — violations break the build's stated standard)
- **Descriptive test names** using `should [expected] when [condition]`
- **Arrange-Act-Assert (AAA) structure**
- **Typed mocks** via `jest.Mocked<Interface>`
- **100% coverage** requirement

## When to Use

- Creating tests for new code
- Adding missing test coverage
- Refactoring tests that violate the one-assertion rule
- Splitting multi-assertion tests into separate `it` blocks

## Critical Rule: ONE ASSERTION PER TEST

Each `it(...)` block MUST contain exactly ONE `expect(...)` (or one `await expect(...)`). If you need to assert multiple things, create separate `it` blocks — duplicating the Arrange-Act setup is fine.

### Wrong (Multiple Assertions)

```typescript
it('should return user when found', async () => {
  const result = await getUserUseCase.execute({ userId: 'test-id' });
  expect(result.user).toEqual(expectedUser); // ❌
  expect(mockQueryRepository.findById).toHaveBeenCalledWith(userId); // ❌
});
```

### Correct (One Assertion Each)

```typescript
it('should return user when found', async () => {
  const result = await getUserUseCase.execute({ userId: 'test-id' });
  expect(result.user).toEqual(expectedUser);
});

it('should call findById with the resolved user id', async () => {
  await getUserUseCase.execute({ userId: 'test-id' });
  expect(mockQueryRepository.findById).toHaveBeenCalledWith(userId);
});
```

## Test Naming Convention

Use sentence-style behaviour descriptions inside `it`:

```
it('should [expected behaviour] when [condition]', ...)
```

The `describe` block names the unit under test; the `it` names the behaviour.

**Examples:**

- `it('should return user when user exists', ...)`
- `it('should throw error when user is not found', ...)`
- `it('should reject empty user id', ...)`
- `it('should return 404 when resource is missing', ...)`
- `it('should call repository.create exactly once', ...)`

## Test Structure: Arrange-Act-Assert (AAA)

Every test follows three parts. Keep blank lines between them so the structure is visible.

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
  });
});
```

### Section Guidelines

**Arrange:**

- Build test data with domain factories (`createUser`, `createUserId`) — they enforce real validation
- Initialize the system under test in `beforeEach`
- Configure mock return values per test
- Variables that change shape per test belong in the `it` block; shared variables go in `beforeEach`

**Act:**

- One line if possible — the call under test
- `await` async operations

**Assert:**

- Exactly one `expect(...)`
- For thrown errors: `await expect(promise).rejects.toThrow(message)`
- For exact equality of objects: `toEqual` (not `toBe`)
- For partial matches: `toMatchObject`
- For mock-call verification: `toHaveBeenCalledWith(...)` — but if you're verifying both a return value and a call, that's two tests

## Testing by Layer

### Domain Model Tests

```typescript
import { createUser, createUserId } from '../../../src/domain/model/user';

describe('createUser', () => {
  it('should create user with valid input', () => {
    const id = createUserId('id-1');

    const user = createUser(id, 'test@example.com', 'Alice');

    expect(user).toEqual({ id, email: 'test@example.com', name: 'Alice' });
  });

  it('should throw when email is missing @ symbol', () => {
    const id = createUserId('id-1');

    expect(() => createUser(id, 'invalid', 'Alice')).toThrow('Invalid email address');
  });

  it('should throw when name is empty', () => {
    const id = createUserId('id-1');

    expect(() => createUser(id, 'test@example.com', '')).toThrow('Name cannot be empty');
  });
});
```

### Repository Implementation Tests

Test concrete repositories without mocks — they own their state:

```typescript
import { InMemoryUserRepository } from '../../../../src/infrastructure/persistence/memory/in-memory-user-repository';
import { createUser, createUserId } from '../../../../src/domain/model/user';

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
  });

  describe('findById', () => {
    it('should return user when stored', async () => {
      const user = createUser(createUserId('id-1'), 'a@b.com', 'Alice');
      await repository.create(user);

      const result = await repository.findById(user.id);

      expect(result).toEqual(user);
    });

    it('should return null when user is missing', async () => {
      const result = await repository.findById(createUserId('missing'));

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should throw when user id already exists', async () => {
      const user = createUser(createUserId('id-1'), 'a@b.com', 'Alice');
      await repository.create(user);

      await expect(repository.create(user)).rejects.toThrow('already exists');
    });
  });
});
```

### Use Case Tests

Mock the repository interface, not the concrete implementation:

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

  it('should return the user wrapped in a response', async () => {
    const id = createUserId('id-1');
    const user = createUser(id, 'a@b.com', 'Alice');
    mockQueryRepository.findById.mockResolvedValue(user);

    const result = await getUserUseCase.execute({ userId: 'id-1' });

    expect(result.user).toEqual(user);
  });

  it('should throw when the user is not found', async () => {
    mockQueryRepository.findById.mockResolvedValue(null);

    await expect(getUserUseCase.execute({ userId: 'missing' })).rejects.toThrow(
      'User with ID missing not found'
    );
  });

  it('should reject empty user id', async () => {
    await expect(getUserUseCase.execute({ userId: '' })).rejects.toThrow('User ID cannot be empty');
  });
});
```

### Controller Tests (HTTP Boundary)

For controllers, mock the use case and assert on the Express `Response` mock:

```typescript
import { Request, Response } from 'express';
import { UserController } from '../../../../src/interfaces/http/controllers/user.controller';
import { GetUserUseCase } from '../../../../src/application/use-case/get-user.use-case';
import { CreateUserUseCase } from '../../../../src/application/use-case/create-user.use-case';

describe('UserController', () => {
  let controller: UserController;
  let mockGet: jest.Mocked<GetUserUseCase>;
  let mockCreate: jest.Mocked<CreateUserUseCase>;
  let res: Partial<Response>;
  let statusJson: jest.Mock;

  beforeEach(() => {
    mockGet = { execute: jest.fn() } as unknown as jest.Mocked<GetUserUseCase>;
    mockCreate = { execute: jest.fn() } as unknown as jest.Mocked<CreateUserUseCase>;
    statusJson = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: statusJson,
      header: jest.fn().mockReturnThis(),
    };
    controller = new UserController(mockCreate, mockGet);
  });

  it('should respond 200 when user is found', async () => {
    const req = { params: { id: 'id-1' } } as unknown as Request;
    mockGet.execute.mockResolvedValue({
      user: { id: { value: 'id-1' }, email: 'a@b.com', name: 'Alice' } as never,
    });

    await controller.getUser(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should respond 404 when use case throws not-found', async () => {
    const req = { params: { id: 'id-1' } } as unknown as Request;
    mockGet.execute.mockRejectedValue(new Error('User with ID id-1 not found'));

    await controller.getUser(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
```

### Integration Tests

Use `supertest` against the assembled Express app for full HTTP flow tests. They live in `test/interfaces/http/integration/`.

## Mocking Guidelines

### When to Mock

- **Repositories** in use case tests
- **Use cases** in controller tests
- **External I/O** (HTTP clients, file system, time)

### What NOT to Mock

- **Domain models** and DTOs — they are pure data
- **Domain factories** (`createUser`, `createUserId`) — they enforce real validation; use them in arrangements
- **The system under test** itself

### Typed Mocks

```typescript
let mockRepo: jest.Mocked<UserQueryRepository>;

beforeEach(() => {
  mockRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    exists: jest.fn(),
    findAll: jest.fn(),
  };
});
```

### Common Mock Configurations

```typescript
mockRepo.findById.mockResolvedValue(user);             // async return
mockRepo.findById.mockRejectedValue(new Error('boom')); // async throw
mockRepo.findById.mockReturnValueOnce(...);            // sync, single call
expect(mockRepo.findById).toHaveBeenCalledWith(userId); // verify call args
expect(mockRepo.findById).toHaveBeenCalledTimes(1);    // verify call count
```

## Splitting Multi-Assertion Tests

When you encounter a test with multiple `expect`s, split it. Duplicating the Arrange-Act block is intentional — each test should be independently readable.

### Before (Violates Rule)

```typescript
it('creates user', async () => {
  const result = await createUserUseCase.execute({ email: 'a@b.com', name: 'Alice' });
  expect(result.userId).toBeDefined(); // ❌
  expect(mockCommandRepository.create).toHaveBeenCalled(); // ❌
  expect(mockQueryRepository.findByEmail).toHaveBeenCalledWith('a@b.com'); // ❌
});
```

### After (Follows Rule)

```typescript
it('should return a user id when create succeeds', async () => {
  const result = await createUserUseCase.execute({ email: 'a@b.com', name: 'Alice' });
  expect(result.userId).toBeDefined();
});

it('should write to the command repository', async () => {
  await createUserUseCase.execute({ email: 'a@b.com', name: 'Alice' });
  expect(mockCommandRepository.create).toHaveBeenCalled();
});

it('should check for an existing user by email before creating', async () => {
  await createUserUseCase.execute({ email: 'a@b.com', name: 'Alice' });
  expect(mockQueryRepository.findByEmail).toHaveBeenCalledWith('a@b.com');
});
```

## Coverage Requirements

`jest.config.js` enforces 100% across branches, functions, lines, and statements. Verify with:

```bash
npm run test:coverage
```

For final verification, always run the full gate:

```bash
npm run test:all
```

This runs typecheck → lint → format:check → test:coverage → arch:validate. Running `jest` alone bypasses six quality gates and gives a false sense of completion.

## Common Patterns

### Async Throws

```typescript
await expect(useCase.execute(req)).rejects.toThrow('expected message');
```

### Sync Throws

```typescript
expect(() => createUser(id, '', 'Alice')).toThrow('Name cannot be empty');
```

### Object Equality

Use `toEqual` for deep equality, never `toBe` for objects:

```typescript
expect(result).toEqual({ id, email: 'a@b.com', name: 'Alice' });
```

### Mock Call Args

```typescript
expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.com' }));
```

## Test Checklist

Before marking test generation complete:

- [ ] Each `it(...)` has exactly ONE `expect` (or `await expect`)
- [ ] Test names follow the `should ... when ...` pattern
- [ ] Tests use Arrange-Act-Assert with blank lines between sections
- [ ] Mocks are typed via `jest.Mocked<Interface>`
- [ ] Domain factories used in arrangements (not raw object literals)
- [ ] No `any` types (ESLint will reject)
- [ ] No comments
- [ ] Verified with `npm run test:all`, not just `jest`
- [ ] Coverage stays at 100%

## Common Mistakes

1. **Multiple assertions** — split into separate `it` blocks
2. **Vague test names** — use the sentence pattern with `should` and `when`
3. **Testing implementation details** — assert on behaviour and outputs, not internal calls (unless the contract is the call)
4. **Untyped mocks** — `jest.Mocked<Interface>` catches missing methods at compile time
5. **Shared state between tests** — use `beforeEach` to reset
6. **`toBe` on objects** — use `toEqual` for value equality
7. **Missing `await` on async assertions** — `expect(asyncFn()).rejects.toThrow()` without `await` is a bug
8. **Using `jest` for final verification** — run `npm run test:all`
9. **Mocking domain factories** — they're pure functions, just call them

## References

- `references/test-examples-from-codebase.md` — actual examples from the existing test suite
