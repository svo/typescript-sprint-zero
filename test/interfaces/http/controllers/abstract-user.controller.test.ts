import { AbstractUserController } from '../../../../src/interfaces/http/controllers/abstract-user.controller';
import { CreateUserUseCase } from '../../../../src/application/use-case/create-user.use-case';
import { GetUserUseCase } from '../../../../src/application/use-case/get-user.use-case';
import { HttpRequest, HttpResponse } from '../../../../src/interfaces/http/adapters/server.adapter';
import { createUserId } from '../../../../src/domain/model/user';

describe('AbstractUserController', () => {
  let controller: AbstractUserController;
  let mockCreateUserUseCase: jest.Mocked<CreateUserUseCase>;
  let mockGetUserUseCase: jest.Mocked<GetUserUseCase>;
  let mockRequest: Partial<HttpRequest>;
  let mockResponse: jest.Mocked<HttpResponse>;

  beforeEach(() => {
    mockCreateUserUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateUserUseCase>;

    mockGetUserUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetUserUseCase>;

    controller = new AbstractUserController(mockCreateUserUseCase, mockGetUserUseCase);

    mockRequest = {
      body: {},
      params: {},
      query: {},
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      header: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userId = createUserId('test-id');
      mockRequest.body = { email: 'test@example.com', name: 'Test User' };
      mockCreateUserUseCase.execute.mockResolvedValue({ userId });

      await controller.createUser(mockRequest as HttpRequest, mockResponse);

      expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.header).toHaveBeenCalledWith('Location', '/users/test-id');
      expect(mockResponse.json).toHaveBeenCalledWith({
        id: 'test-id',
        location: '/users/test-id',
      });
    });

    it('should return 400 for missing email', async () => {
      mockRequest.body = { name: 'Test User' };

      await controller.createUser(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'ValidationError',
        message: 'Email and name are required',
        timestamp: expect.any(String),
      });
    });

    it('should return 400 for missing name', async () => {
      mockRequest.body = { email: 'test@example.com' };

      await controller.createUser(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'ValidationError',
        message: 'Email and name are required',
        timestamp: expect.any(String),
      });
    });

    it('should return 409 for duplicate user', async () => {
      mockRequest.body = { email: 'test@example.com', name: 'Test User' };
      mockCreateUserUseCase.execute.mockRejectedValue(new Error('User already exists'));

      await controller.createUser(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'ConflictError',
        message: 'User already exists',
        timestamp: expect.any(String),
      });
    });

    it('should return 400 for validation error', async () => {
      mockRequest.body = { email: 'test@example.com', name: 'Test User' };
      mockCreateUserUseCase.execute.mockRejectedValue(new Error('Invalid email format'));

      await controller.createUser(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'ValidationError',
        message: 'Invalid email format',
        timestamp: expect.any(String),
      });
    });

    it('should return 400 for empty field validation error', async () => {
      mockRequest.body = { email: 'test@example.com', name: 'Test User' };
      mockCreateUserUseCase.execute.mockRejectedValue(new Error('Name cannot be empty'));

      await controller.createUser(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'ValidationError',
        message: 'Name cannot be empty',
        timestamp: expect.any(String),
      });
    });

    it('should return 500 for unexpected error', async () => {
      mockRequest.body = { email: 'test@example.com', name: 'Test User' };
      mockCreateUserUseCase.execute.mockRejectedValue(new Error('Database connection failed'));

      await controller.createUser(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
        timestamp: expect.any(String),
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockRequest.body = { email: 'test@example.com', name: 'Test User' };
      mockCreateUserUseCase.execute.mockRejectedValue('String error');

      await controller.createUser(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
        timestamp: expect.any(String),
      });
    });
  });

  describe('getUser', () => {
    it('should get user successfully', async () => {
      const user = {
        id: createUserId('test-id'),
        email: 'test@example.com',
        name: 'Test User',
      };
      mockRequest.params = { id: 'test-id' };
      mockGetUserUseCase.execute.mockResolvedValue({ user });

      await controller.getUser(mockRequest as HttpRequest, mockResponse);

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

      await controller.getUser(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'ValidationError',
        message: 'User ID is required',
        timestamp: expect.any(String),
      });
    });

    it('should return 404 for user not found', async () => {
      mockRequest.params = { id: 'nonexistent-id' };
      mockGetUserUseCase.execute.mockRejectedValue(new Error('User not found'));

      await controller.getUser(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'NotFoundError',
        message: 'User not found',
        timestamp: expect.any(String),
      });
    });

    it('should return 400 for empty validation error', async () => {
      mockRequest.params = { id: 'test-id' };
      mockGetUserUseCase.execute.mockRejectedValue(new Error('User ID cannot be empty'));

      await controller.getUser(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'ValidationError',
        message: 'User ID cannot be empty',
        timestamp: expect.any(String),
      });
    });

    it('should return 500 for unexpected error', async () => {
      mockRequest.params = { id: 'test-id' };
      mockGetUserUseCase.execute.mockRejectedValue(new Error('Database connection failed'));

      await controller.getUser(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
        timestamp: expect.any(String),
      });
    });

    it('should handle non-Error exceptions', async () => {
      mockRequest.params = { id: 'test-id' };
      mockGetUserUseCase.execute.mockRejectedValue('String error');

      await controller.getUser(mockRequest as HttpRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
        timestamp: expect.any(String),
      });
    });
  });
});
