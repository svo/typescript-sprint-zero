import { createUserRoutes } from '../../../../src/interfaces/http/routes/abstract-user.routes';
import { AbstractUserController } from '../../../../src/interfaces/http/controllers/abstract-user.controller';
import { RouteDefinition } from '../../../../src/interfaces/http/adapters/server.adapter';

describe('AbstractUserRoutes', () => {
  let mockController: jest.Mocked<AbstractUserController>;

  beforeEach(() => {
    mockController = {
      createUser: jest.fn(),
      getUser: jest.fn(),
    } as unknown as jest.Mocked<AbstractUserController>;
  });

  describe('createUserRoutes', () => {
    it('should return route definitions for user endpoints', () => {
      const routes: RouteDefinition[] = createUserRoutes(mockController);

      expect(routes).toHaveLength(2);

      expect(routes[0]).toEqual({
        method: 'POST',
        path: '/users',
        handler: mockController.createUser,
      });

      expect(routes[1]).toEqual({
        method: 'GET',
        path: '/users/:id',
        handler: mockController.getUser,
      });
    });

    it('should create routes with correct handler references', () => {
      const routes: RouteDefinition[] = createUserRoutes(mockController);

      expect(routes[0]?.handler).toBe(mockController.createUser);
      expect(routes[1]?.handler).toBe(mockController.getUser);
    });

    it('should create routes without middleware by default', () => {
      const routes: RouteDefinition[] = createUserRoutes(mockController);

      expect(routes[0]?.middleware).toBeUndefined();
      expect(routes[1]?.middleware).toBeUndefined();
    });
  });
});
