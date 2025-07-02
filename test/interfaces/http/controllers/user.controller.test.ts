import { Request, Response } from 'express';
import { UserController } from '../../../../src/interfaces/http/controllers/user.controller';
import { CreateUserUseCase } from '../../../../src/application/use-case/create-user.use-case';
import { GetUserUseCase } from '../../../../src/application/use-case/get-user.use-case';
import { createUser, createUserId } from '../../../../src/domain/model/user';

describe('UserController', () => {
  let userController: UserController;
  let mockCreateUserUseCase: jest.Mocked<CreateUserUseCase>;
  let mockGetUserUseCase: jest.Mocked<GetUserUseCase>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockCreateUserUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateUserUseCase>;

    mockGetUserUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetUserUseCase>;

    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
    };

    userController = new UserController(mockCreateUserUseCase, mockGetUserUseCase);
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const requestBody = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const userId = createUserId('test-id');
      mockCreateUserUseCase.execute.mockResolvedValue({ userId });

      mockRequest.body = requestBody;

      await userController.createUser(mockRequest as Request, mockResponse as Response);

      expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith(requestBody);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.header).toHaveBeenCalledWith('Location', '/users/test-id');
      expect(mockResponse.json).toHaveBeenCalledWith({
        id: 'test-id',
        location: '/users/test-id',
      });
    });

    it('should return 400 for missing email', async () => {
      mockRequest.body = { name: 'Test User' };

      await userController.createUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ValidationError',
          message: 'Email and name are required',
        })
      );
    });

    it('should return 400 for missing name', async () => {
      mockRequest.body = { email: 'test@example.com' };

      await userController.createUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 409 for duplicate user', async () => {
      const requestBody = {
        email: 'test@example.com',
        name: 'Test User',
      };

      mockCreateUserUseCase.execute.mockRejectedValue(
        new Error('User with email test@example.com already exists')
      );

      mockRequest.body = requestBody;

      await userController.createUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ConflictError',
        })
      );
    });

    it('should return 400 for validation error', async () => {
      const requestBody = {
        email: 'invalid-email',
        name: 'Test User',
      };

      mockCreateUserUseCase.execute.mockRejectedValue(new Error('Invalid email address'));

      mockRequest.body = requestBody;

      await userController.createUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ValidationError',
        })
      );
    });

    it('should return 500 for unexpected error', async () => {
      const requestBody = {
        email: 'test@example.com',
        name: 'Test User',
      };

      mockCreateUserUseCase.execute.mockRejectedValue(new Error('Unexpected database error'));

      mockRequest.body = requestBody;

      await userController.createUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'InternalServerError',
        })
      );
    });
  });

  describe('getUser', () => {
    it('should get user successfully', async () => {
      const user = createUser(createUserId('test-id'), 'test@example.com', 'Test User');

      mockGetUserUseCase.execute.mockResolvedValue({ user });

      mockRequest.params = { id: 'test-id' };

      await userController.getUser(mockRequest as Request, mockResponse as Response);

      expect(mockGetUserUseCase.execute).toHaveBeenCalledWith({ userId: 'test-id' });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should return 400 for missing user ID', async () => {
      mockRequest.params = {};

      await userController.getUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ValidationError',
          message: 'User ID is required',
        })
      );
    });

    it('should return 404 for user not found', async () => {
      mockGetUserUseCase.execute.mockRejectedValue(new Error('User with ID test-id not found'));

      mockRequest.params = { id: 'test-id' };

      await userController.getUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'NotFoundError',
        })
      );
    });

    it('should return 500 for unexpected error', async () => {
      mockGetUserUseCase.execute.mockRejectedValue(new Error('Unexpected database error'));

      mockRequest.params = { id: 'test-id' };

      await userController.getUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should return 400 for empty user ID validation error', async () => {
      mockGetUserUseCase.execute.mockRejectedValue(new Error('User ID cannot be empty'));

      mockRequest.params = { id: 'test-id' };

      await userController.getUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ValidationError',
          message: 'User ID cannot be empty',
        })
      );
    });
  });
});
