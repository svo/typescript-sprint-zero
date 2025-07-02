import 'reflect-metadata';
import { container, setupContainer } from '../../src/config/container';
import { CreateUserUseCase } from '../../src/application/use-case/create-user.use-case';
import { GetUserUseCase } from '../../src/application/use-case/get-user.use-case';
import { HealthUseCase } from '../../src/application/use-case/health.use-case';
import { UserController } from '../../src/interfaces/http/controllers/user.controller';
import { HealthController } from '../../src/interfaces/http/controllers/health.controller';
import { BasicAuthenticator } from '../../src/infrastructure/security/basic-authenticator';
import { SystemHealthChecker } from '../../src/infrastructure/system/system-health-checker';

describe('Container Configuration', () => {
  beforeEach(() => {
    container.clearInstances();
    setupContainer();
  });

  afterEach(() => {
    container.clearInstances();
  });

  it('should register all services correctly', () => {
    expect(() => setupContainer()).not.toThrow();
  });

  it('should resolve CreateUserUseCase', () => {
    const useCase = container.resolve(CreateUserUseCase);
    expect(useCase).toBeInstanceOf(CreateUserUseCase);
  });

  it('should resolve GetUserUseCase', () => {
    const useCase = container.resolve(GetUserUseCase);
    expect(useCase).toBeInstanceOf(GetUserUseCase);
  });

  it('should resolve HealthUseCase', () => {
    const useCase = container.resolve(HealthUseCase);
    expect(useCase).toBeInstanceOf(HealthUseCase);
  });

  it('should resolve UserController', () => {
    const controller = container.resolve(UserController);
    expect(controller).toBeInstanceOf(UserController);
  });

  it('should resolve HealthController', () => {
    const controller = container.resolve(HealthController);
    expect(controller).toBeInstanceOf(HealthController);
  });

  it('should resolve BasicAuthenticator as singleton', () => {
    const auth1 = container.resolve('BasicAuthenticator');
    const auth2 = container.resolve('BasicAuthenticator');
    expect(auth1).toBeInstanceOf(BasicAuthenticator);
    expect(auth1).toBe(auth2);
  });

  it('should resolve SystemHealthChecker as singleton', () => {
    const checker1 = container.resolve(SystemHealthChecker);
    const checker2 = container.resolve(SystemHealthChecker);
    expect(checker1).toBeInstanceOf(SystemHealthChecker);
    expect(checker1).toBe(checker2);
  });
});
