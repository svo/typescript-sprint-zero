import { createUser, createUserId } from '../../../src/domain/model/user';

describe('User Domain Model', () => {
  describe('createUserId', () => {
    it('should create a valid user ID', () => {
      const userId = createUserId('test-id');
      expect(userId.value).toBe('test-id');
    });

    it('should trim whitespace from user ID', () => {
      const userId = createUserId('  test-id  ');
      expect(userId.value).toBe('test-id');
    });

    it('should throw error for empty user ID', () => {
      expect(() => createUserId('')).toThrow('User ID cannot be empty');
    });

    it('should throw error for whitespace-only user ID', () => {
      expect(() => createUserId('   ')).toThrow('User ID cannot be empty');
    });
  });

  describe('createUser', () => {
    const validUserId = createUserId('test-id');

    it('should create a valid user', () => {
      const user = createUser(validUserId, 'test@example.com', 'Test User');

      expect(user.id).toBe(validUserId);
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
    });

    it('should normalize email to lowercase', () => {
      const user = createUser(validUserId, 'TEST@EXAMPLE.COM', 'Test User');
      expect(user.email).toBe('test@example.com');
    });

    it('should trim whitespace from email and name', () => {
      const user = createUser(validUserId, '  test@example.com  ', '  Test User  ');
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
    });

    it('should throw error for invalid email', () => {
      expect(() => createUser(validUserId, 'invalid-email', 'Test User')).toThrow(
        'Invalid email address'
      );
    });

    it('should throw error for empty email', () => {
      expect(() => createUser(validUserId, '', 'Test User')).toThrow('Invalid email address');
    });

    it('should throw error for empty name', () => {
      expect(() => createUser(validUserId, 'test@example.com', '')).toThrow('Name cannot be empty');
    });

    it('should throw error for whitespace-only name', () => {
      expect(() => createUser(validUserId, 'test@example.com', '   ')).toThrow(
        'Name cannot be empty'
      );
    });
  });
});
