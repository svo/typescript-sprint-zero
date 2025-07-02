import { CreateUserUseCase } from '../../../src/application/use-case/create-user.use-case';
import {
  UserCommandRepository,
  UserQueryRepository,
} from '../../../src/domain/repository/user-repository';
import { createUser, createUserId } from '../../../src/domain/model/user';

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase;
  let mockCommandRepository: jest.Mocked<UserCommandRepository>;
  let mockQueryRepository: jest.Mocked<UserQueryRepository>;

  beforeEach(() => {
    mockCommandRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockQueryRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      exists: jest.fn(),
      findAll: jest.fn(),
    };

    createUserUseCase = new CreateUserUseCase(mockCommandRepository, mockQueryRepository);
  });

  describe('execute', () => {
    it('should create a user successfully', async () => {
      const request = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const expectedUserId = createUserId('generated-id');

      mockQueryRepository.findById.mockResolvedValue(null);
      mockQueryRepository.findByEmail.mockResolvedValue(null);
      mockCommandRepository.create.mockResolvedValue(expectedUserId);

      const result = await createUserUseCase.execute(request);

      expect(result.userId).toBeDefined();
      expect(mockQueryRepository.findById).toHaveBeenCalledWith(expect.any(Object));
      expect(mockQueryRepository.findByEmail).toHaveBeenCalledWith(request.email);
      expect(mockCommandRepository.create).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should create a user with provided ID', async () => {
      const request = {
        email: 'test@example.com',
        name: 'Test User',
        id: 'custom-id',
      };

      const expectedUserId = createUserId('custom-id');

      mockQueryRepository.findById.mockResolvedValue(null);
      mockQueryRepository.findByEmail.mockResolvedValue(null);
      mockCommandRepository.create.mockResolvedValue(expectedUserId);

      const result = await createUserUseCase.execute(request);

      expect(result.userId.value).toBe('custom-id');
      expect(mockQueryRepository.findById).toHaveBeenCalledWith(expectedUserId);
    });

    it('should throw error when user ID already exists', async () => {
      const request = {
        email: 'test@example.com',
        name: 'Test User',
        id: 'existing-id',
      };

      const existingUser = createUser(
        createUserId('existing-id'),
        'existing@example.com',
        'Existing User'
      );

      mockQueryRepository.findById.mockResolvedValue(existingUser);

      await expect(createUserUseCase.execute(request)).rejects.toThrow(
        'User with ID existing-id already exists'
      );
    });

    it('should throw error when email already exists', async () => {
      const request = {
        email: 'existing@example.com',
        name: 'Test User',
      };

      const existingUser = createUser(
        createUserId('existing-id'),
        'existing@example.com',
        'Existing User'
      );

      mockQueryRepository.findById.mockResolvedValue(null);
      mockQueryRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(createUserUseCase.execute(request)).rejects.toThrow(
        'User with email existing@example.com already exists'
      );
    });
  });
});
