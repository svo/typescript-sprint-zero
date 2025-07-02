import { InMemoryUserRepository } from '../../../../src/infrastructure/persistence/memory/in-memory-user-repository';
import { createUser, createUserId } from '../../../../src/domain/model/user';

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const user = createUser(createUserId('test-id'), 'test@example.com', 'Test User');

      const result = await repository.create(user);

      expect(result).toEqual(user.id);
    });

    it('should throw error when user ID already exists', async () => {
      const user = createUser(createUserId('test-id'), 'test@example.com', 'Test User');

      await repository.create(user);

      const duplicateUser = createUser(
        createUserId('test-id'),
        'another@example.com',
        'Another User'
      );

      await expect(repository.create(duplicateUser)).rejects.toThrow(
        'User with ID test-id already exists'
      );
    });

    it('should throw error when email already exists', async () => {
      const user1 = createUser(createUserId('test-id-1'), 'same@example.com', 'Test User 1');

      await repository.create(user1);

      const user2 = createUser(createUserId('test-id-2'), 'same@example.com', 'Test User 2');

      await expect(repository.create(user2)).rejects.toThrow(
        'User with email same@example.com already exists'
      );
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const user = createUser(createUserId('test-id'), 'test@example.com', 'Test User');

      await repository.create(user);
      const result = await repository.findById(createUserId('test-id'));

      expect(result).toEqual(user);
    });

    it('should return null when user not found', async () => {
      const result = await repository.findById(createUserId('non-existent'));
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const user = createUser(createUserId('test-id'), 'test@example.com', 'Test User');

      await repository.create(user);
      const result = await repository.findByEmail('test@example.com');

      expect(result).toEqual(user);
    });

    it('should return user with case-insensitive email search', async () => {
      const user = createUser(createUserId('test-id'), 'test@example.com', 'Test User');

      await repository.create(user);
      const result = await repository.findByEmail('TEST@EXAMPLE.COM');

      expect(result).toEqual(user);
    });

    it('should return null when user not found by email', async () => {
      const result = await repository.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true when user exists', async () => {
      const user = createUser(createUserId('test-id'), 'test@example.com', 'Test User');

      await repository.create(user);
      const result = await repository.exists(createUserId('test-id'));

      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      const result = await repository.exists(createUserId('non-existent'));
      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const user1 = createUser(createUserId('test-id-1'), 'test1@example.com', 'Test User 1');

      const user2 = createUser(createUserId('test-id-2'), 'test2@example.com', 'Test User 2');

      await repository.create(user1);
      await repository.create(user2);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result).toContain(user1);
      expect(result).toContain(user2);
    });

    it('should return empty array when no users exist', async () => {
      const result = await repository.findAll();
      expect(result).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update existing user', async () => {
      const user = createUser(createUserId('test-id'), 'test@example.com', 'Test User');

      await repository.create(user);

      const updatedUser = createUser(
        createUserId('test-id'),
        'updated@example.com',
        'Updated User'
      );

      await repository.update(updatedUser);

      const result = await repository.findById(createUserId('test-id'));
      expect(result).toEqual(updatedUser);
    });

    it('should throw error when updating non-existent user', async () => {
      const user = createUser(createUserId('non-existent'), 'test@example.com', 'Test User');

      await expect(repository.update(user)).rejects.toThrow('User with ID non-existent not found');
    });
  });

  describe('delete', () => {
    it('should delete existing user', async () => {
      const user = createUser(createUserId('test-id'), 'test@example.com', 'Test User');

      await repository.create(user);
      await repository.delete(createUserId('test-id'));

      const result = await repository.findById(createUserId('test-id'));
      expect(result).toBeNull();
    });

    it('should throw error when deleting non-existent user', async () => {
      await expect(repository.delete(createUserId('non-existent'))).rejects.toThrow(
        'User with ID non-existent not found'
      );
    });
  });
});
