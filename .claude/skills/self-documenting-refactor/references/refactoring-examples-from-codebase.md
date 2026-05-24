# Self-Documenting Code: Real Examples from Codebase

Concrete examples from the TypeScript Sprint Zero codebase demonstrating the no-comments policy. All examples are taken from actual production code.

## Pattern 1: Expressive Method Names

### Use Case Methods

**Location:** `src/application/use-case/get-user.use-case.ts`

```typescript
export class GetUserUseCase {
  constructor(private readonly queryRepository: UserQueryRepository) {}

  async execute(request: GetUserRequest): Promise<GetUserResponse> {
    const userId = createUserId(request.userId);
    const user = await this.queryRepository.findById(userId);

    if (!user) {
      throw new Error(`User with ID ${userId.value} not found`);
    }

    return { user };
  }
}
```

**Why this works:**

- `GetUserUseCase` — class name states purpose
- `execute` — standard use case method name
- `queryRepository` — type and name explain the dependency
- `findById` — repository method that clearly describes the action
- The error message names the missing entity and the id that wasn't found

No comments needed.

### Domain Factory

**Location:** `src/domain/model/user.ts`

```typescript
export const createUser = (id: UserId, email: string, name: string): User => {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }
  if (!name || name.trim().length === 0) {
    throw new Error('Name cannot be empty');
  }
  return {
    id,
    email: email.trim().toLowerCase(),
    name: name.trim(),
  };
};
```

**Why this works:**

- `createUser` — verb phrase that says what it produces
- Validation comes before the return — a guard-clause pattern
- Error messages describe the constraint that failed
- Trim/lowercase normalization is visible in the return

## Pattern 2: Descriptive Variable Names

### Container Wiring

**Location:** `src/config/container.ts`

```typescript
const userRepository = new InMemoryUserRepository();

container.registerInstance<UserQueryRepository>('UserQueryRepository', userRepository);
container.registerInstance<UserCommandRepository>('UserCommandRepository', userRepository);
```

**Why this works:**

- `userRepository` — concrete, not `repo` or `r`
- String tokens match the interface names exactly — no comment needed to explain the convention
- Explicit type annotations document what each token resolves to

## Pattern 3: Clear Error Messages

### Domain Validation

**Location:** `src/domain/model/user.ts`

```typescript
export const createUserId = (value: string): UserId => {
  if (!value || value.trim().length === 0) {
    throw new Error('User ID cannot be empty');
  }
  return { value: value.trim() };
};
```

**Why this works:**

- Error message describes the constraint (`cannot be empty`)
- No comment needed — the validation reads itself
- Returns a normalized value (trimmed) — caller doesn't need to remember to trim

### Use Case Errors

**Location:** `src/application/use-case/create-user.use-case.ts`

```typescript
const existingUser = await this.queryRepository.findById(userId);
if (existingUser) {
  throw new Error(`User with ID ${userId.value} already exists`);
}

const existingUserByEmail = await this.queryRepository.findByEmail(request.email);
if (existingUserByEmail) {
  throw new Error(`User with email ${request.email} already exists`);
}
```

**Why this works:**

- `existingUser` and `existingUserByEmail` — names tell you what the variable holds
- Error messages identify the resource and the conflicting value
- Two separate guard clauses — one per uniqueness constraint

## Pattern 4: Small, Single-Purpose Functions

### Controller Helpers

**Location:** `src/interfaces/http/controllers/user.controller.ts`

The controller extracts validation and error handling to keep the public methods within the complexity budget:

```typescript
private validateCreateUserRequest(requestDto: CreateUserRequestDto, res: Response): boolean {
  if (!requestDto.email || !requestDto.name) {
    res.status(400).json(createErrorResponseDto('ValidationError', 'Email and name are required'));
    return false;
  }
  return true;
}

private handleCreateUserError(error: unknown, res: Response): void {
  if (!(error instanceof Error)) {
    res.status(500).json(createErrorResponseDto('InternalServerError', 'An unexpected error occurred'));
    return;
  }
  if (error.message.includes('already exists')) {
    res.status(409).json(createErrorResponseDto('ConflictError', error.message));
  } else if (error.message.includes('Invalid') || error.message.includes('cannot be empty')) {
    res.status(400).json(createErrorResponseDto('ValidationError', error.message));
  } else {
    res.status(500).json(createErrorResponseDto('InternalServerError', 'An unexpected error occurred'));
  }
}

createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestDto: CreateUserRequestDto = req.body;
    if (!this.validateCreateUserRequest(requestDto, res)) return;

    const result = await this.createUserUseCase.execute(requestDto);
    const responseDto = createUserResponseDto(result.userId.value);
    res.status(201).header('Location', responseDto.location).json(responseDto);
  } catch (error) {
    this.handleCreateUserError(error, res);
  }
};
```

**Why this works:**

- Each method has one job
- The public `createUser` reads as a sequence of steps
- Error → status code mapping is in one place
- Method names (`validateCreateUserRequest`, `handleCreateUserError`) explain what each helper does

## Pattern 5: Boolean Predicates in Domain Validation

```typescript
export const createUser = (id: UserId, email: string, name: string): User => {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }
  // ...
};
```

`!email || !email.includes('@')` is short enough to read inline. If the predicate grew, extracting it would be the next step:

```typescript
const isInvalidEmail = (email: string): boolean => !email || !email.includes('@');

export const createUser = (id: UserId, email: string, name: string): User => {
  if (isInvalidEmail(email)) {
    throw new Error('Invalid email address');
  }
  // ...
};
```

## Before/After Refactoring

### Scenario 1: Use Case With Comments → Self-Documenting

**Before (forbidden):**

```typescript
class GetUserUseCase {
  constructor(repo: UserQueryRepository) {
    // Store the repository for later use
    this.repo = repo;
  }

  async execute(id: string) {
    // Call the repository to get the user
    return this.repo.findById(id);
  }
}
```

**After (actual code):**

```typescript
export class GetUserUseCase {
  constructor(private readonly queryRepository: UserQueryRepository) {}

  async execute(request: GetUserRequest): Promise<GetUserResponse> {
    const userId = createUserId(request.userId);
    const user = await this.queryRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId.value} not found`);
    }
    return { user };
  }
}
```

**Improvements:**

- Type hints (`UserQueryRepository`, `GetUserRequest`, `GetUserResponse`) document everything the comments tried to say
- `private readonly queryRepository` (TypeScript shorthand) replaces the manual `this.repo = repo`
- Validation via `createUserId` — the domain factory enforces it
- Explicit handling of the `null` case with a descriptive error

### Scenario 2: Magic Status Codes → Named Constants

**Before:**

```typescript
if (response.status === 404) {
  // user not found
  return null;
}
```

**After:**

```typescript
const HTTP_NOT_FOUND = 404;

if (response.status === HTTP_NOT_FOUND) {
  return null;
}
```

Or, more idiomatically in this codebase, the controller maps domain errors to status codes via a helper, so the magic number lives in exactly one place.

## Project-Specific Patterns

### CQRS Separation

The project separates read and write operations using different repository interfaces:

```typescript
export interface UserQueryRepository extends UserRepository {
  findAll(): Promise<User[]>;
}

export interface UserCommandRepository {
  create(user: User): Promise<UserId>;
  update(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}
```

**Why no comments needed:**

- The `Query` and `Command` suffixes carry the CQRS intent
- Method names (`findAll`, `create`, `update`, `delete`) are unambiguous
- Type annotations document the contracts

### Dependency Injection With Constructor Shorthand

```typescript
export class GetUserUseCase {
  constructor(private readonly queryRepository: UserQueryRepository) {}
}
```

**Why no comments needed:**

- Type annotation `UserQueryRepository` documents the expected interface
- Parameter name `queryRepository` describes the role
- TypeScript's `private readonly` shorthand assigns and seals in one declaration

### DTO Conversion

```typescript
export const getUserResponseDto = (user: UserData): GetUserResponseDto => ({
  id: user.id.value,
  email: user.email,
  name: user.name,
});
```

**Why no comments needed:**

- Function name (`getUserResponseDto`) describes what it produces
- Input type (`UserData`) and output type (`GetUserResponseDto`) document the conversion
- Pure projection — no logic to comment on

## Quick Reference: When Tempted to Add a Comment

| Temptation             | Refactor To                    | Example from Codebase              |
| ---------------------- | ------------------------------ | ---------------------------------- |
| "This creates X"       | `createX()` or `buildX()`      | `createUserResponseDto()`          |
| "This validates X"     | `validateX()` or guard clause  | `validateCreateUserRequest()`      |
| "This checks if X"     | `isX()` / `hasX()` predicate   | `if (existingUser)`                |
| "Get X from Y"         | `getXFromY()`                  | `getUserResponseDto()`             |
| "Register/setup"       | `setupX()` / `registerX()`     | `setupContainer()`                 |
| "Store for later"      | descriptive private field name | `private readonly queryRepository` |
| "Magic number means X" | named constant                 | `HTTP_201_CREATED` (would be)      |

## Anti-Patterns to Avoid

### Cryptic Abbreviations

```typescript
// ❌
const repo = getRepo();
const dto = buildDto();
```

```typescript
// ✅
const queryRepository = container.resolve<UserQueryRepository>('UserQueryRepository');
const responseDto = createUserResponseDto(userId.value);
```

### Generic Names

```typescript
// ❌
function process(data: unknown) {
  const result = doStuff(data);
  return result;
}
```

```typescript
// ✅
async function execute(request: CreateUserRequest): Promise<CreateUserResponse> {
  // ...
}
```

### Magic Numbers/Strings

```typescript
// ❌
if (response.status === 404) {
  return null;
}
await new Promise(r => setTimeout(r, 5000));
```

```typescript
// ✅
const HTTP_NOT_FOUND = 404;
const RATE_LIMIT_DELAY_MS = 5000;

if (response.status === HTTP_NOT_FOUND) {
  return null;
}
await waitForRateLimit();
```

## Conclusion

Every example here is production code that:

1. Compiles and runs without comments
2. Maintains 100% test coverage
3. Stays within the complexity budget
4. Follows the layered architecture rules

When tempted to add a comment, refer back to these patterns and refactor instead.

## References

All examples drawn from:

- `src/application/use-case/get-user.use-case.ts`
- `src/application/use-case/create-user.use-case.ts`
- `src/domain/model/user.ts`
- `src/domain/repository/user-repository.ts`
- `src/interfaces/http/controllers/user.controller.ts`
- `src/interfaces/http/dto/user.dto.ts`
- `src/config/container.ts`

See `.claude/CLAUDE.md` for the full project rules.
