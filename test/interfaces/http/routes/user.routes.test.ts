import { createUserRoutes } from '../../../../src/interfaces/http/routes/user.routes';
import { UserController } from '../../../../src/interfaces/http/controllers/user.controller';

describe('UserRoutes', () => {
  let mockController: jest.Mocked<UserController>;

  beforeEach(() => {
    mockController = {
      createUser: jest.fn(),
      getUser: jest.fn(),
    } as unknown as jest.Mocked<UserController>;
  });

  describe('createUserRoutes', () => {
    it('should return an Express router', () => {
      const router = createUserRoutes(mockController);

      expect(router).toBeDefined();
      expect(typeof router).toBe('function');
    });

    it('should create router with user controller', () => {
      const router = createUserRoutes(mockController);

      expect(typeof router).toBe('function');
      expect(router.stack).toBeDefined();
    });
  });
});
