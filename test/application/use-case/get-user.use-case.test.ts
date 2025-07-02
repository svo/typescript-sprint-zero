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
    it('should return user when found', async () => {
      const userId = createUserId('test-id');
      const expectedUser = createUser(userId, 'test@example.com', 'Test User');

      mockQueryRepository.findById.mockResolvedValue(expectedUser);

      const result = await getUserUseCase.execute({ userId: 'test-id' });

      expect(result.user).toEqual(expectedUser);
      expect(mockQueryRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw error when user not found', async () => {
      mockQueryRepository.findById.mockResolvedValue(null);

      await expect(getUserUseCase.execute({ userId: 'non-existent' })).rejects.toThrow(
        'User with ID non-existent not found'
      );
    });

    it('should handle invalid user ID', async () => {
      await expect(getUserUseCase.execute({ userId: '' })).rejects.toThrow(
        'User ID cannot be empty'
      );
    });
  });
});
