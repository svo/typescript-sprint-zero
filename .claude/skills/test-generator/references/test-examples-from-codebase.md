# Test Examples from Codebase

Real test patterns drawn from the existing test suite under `test/`.

## Use Case Test

From `test/application/use-case/get-user.use-case.test.ts`:

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

    it('should call findById with the resolved user id', async () => {
      const userId = createUserId('test-id');
      const expectedUser = createUser(userId, 'test@example.com', 'Test User');
      mockQueryRepository.findById.mockResolvedValue(expectedUser);

      await getUserUseCase.execute({ userId: 'test-id' });

      expect(mockQueryRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw when user is not found', async () => {
      mockQueryRepository.findById.mockResolvedValue(null);

      await expect(getUserUseCase.execute({ userId: 'non-existent' })).rejects.toThrow(
        'User with ID non-existent not found'
      );
    });

    it('should reject empty user id', async () => {
      await expect(getUserUseCase.execute({ userId: '' })).rejects.toThrow(
        'User ID cannot be empty'
      );
    });
  });
});
```

**Observations:**

- Each `it` has ONE `expect` (or one `await expect`)
- Setup that varies per test stays in the `it`; the SUT itself is built in `beforeEach`
- Domain factories (`createUser`, `createUserId`) build real, validated objects — they catch unrealistic inputs that string literals would miss

## Architecture Test

From `test/architecture/architecture-layers.test.ts`:

```typescript
import { checkNoImportsFromLayer } from './helpers';

describe('Architecture - Layer Independence', () => {
  it('Domain Layer - should not import from application layer', () => {
    const violations = checkNoImportsFromLayer('domain', 'application');
    expect(violations).toEqual([]);
  });

  it('Application Layer - should not import from infrastructure layer', () => {
    const violations = checkNoImportsFromLayer('application', 'infrastructure');
    expect(violations).toEqual([]);
  });

  it('Interfaces Layer - should not import from domain layer directly', () => {
    const violations = checkNoImportsFromLayer('interfaces', 'domain');
    expect(violations).toEqual([]);
  });
});
```

**Observations:**

- Architecture rules are tested as code, not just configured
- One assertion per `it`, asserting an empty violation list
- The helper `checkNoImportsFromLayer` walks the source tree and parses imports

## Repository Implementation Test

Pattern for testing infrastructure with real state:

```typescript
import { InMemoryUserRepository } from '../../../../src/infrastructure/persistence/memory/in-memory-user-repository';
import { createUser, createUserId } from '../../../../src/domain/model/user';

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
  });

  describe('findById', () => {
    it('should return the stored user', async () => {
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

    it('should throw when email already exists', async () => {
      const user1 = createUser(createUserId('id-1'), 'a@b.com', 'Alice');
      const user2 = createUser(createUserId('id-2'), 'a@b.com', 'Bob');
      await repository.create(user1);

      await expect(repository.create(user2)).rejects.toThrow('email');
    });
  });
});
```

**Observations:**

- No mocks for the repository under test — exercise the real implementation
- Each behaviour gets its own `it`
- Use domain factories so the test data is valid

## Pattern: Splitting Multi-Assertion Tests

The existing codebase has some legacy tests with multiple `expect` calls in one `it`. The stated standard (per `README.md`) is one assertion per test. When you touch those tests, split them.

### Before (legacy)

```typescript
it('should return user when found', async () => {
  const result = await getUserUseCase.execute({ userId: 'test-id' });
  expect(result.user).toEqual(expectedUser);
  expect(mockQueryRepository.findById).toHaveBeenCalledWith(userId);
});
```

### After (current standard)

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

Both tests share the same Arrange / mock setup via `beforeEach`. Duplication of `await getUserUseCase.execute(...)` is fine — readability beats DRY in tests.

## Pattern: Common Test Setup

Use `beforeEach` for setup that runs every test in the `describe`:

```typescript
describe('SomeUseCase', () => {
  let useCase: SomeUseCase;
  let mockRepo: jest.Mocked<SomeRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      // ... all interface methods
    };
    useCase = new SomeUseCase(mockRepo);
  });

  // tests use `useCase` and `mockRepo` directly
});
```

Use `let` (not `const`) for variables assigned in `beforeEach`. The fresh assignment per test guarantees isolation.
