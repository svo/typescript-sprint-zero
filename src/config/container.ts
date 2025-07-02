import 'reflect-metadata';
import { container } from 'tsyringe';
import { CreateUserUseCase } from '../application/use-case/create-user.use-case';
import { GetUserUseCase } from '../application/use-case/get-user.use-case';
import { HealthUseCase } from '../application/use-case/health.use-case';
import { HealthChecker } from '../domain/health/health-checker';
import { UserCommandRepository, UserQueryRepository } from '../domain/repository/user-repository';
import { InMemoryUserRepository } from '../infrastructure/persistence/memory/in-memory-user-repository';
import { BasicAuthenticator } from '../infrastructure/security/basic-authenticator';
import { SystemHealthChecker } from '../infrastructure/system/system-health-checker';
import { UserController } from '../interfaces/http/controllers/user.controller';
import { HealthController } from '../interfaces/http/controllers/health.controller';

export const setupContainer = (): void => {
  const userRepository = new InMemoryUserRepository();

  container.registerInstance<UserQueryRepository>('UserQueryRepository', userRepository);
  container.registerInstance<UserCommandRepository>('UserCommandRepository', userRepository);

  container.register<CreateUserUseCase>(CreateUserUseCase, {
    useFactory: () =>
      new CreateUserUseCase(
        container.resolve<UserCommandRepository>('UserCommandRepository'),
        container.resolve<UserQueryRepository>('UserQueryRepository')
      ),
  });

  container.register<GetUserUseCase>(GetUserUseCase, {
    useFactory: () =>
      new GetUserUseCase(container.resolve<UserQueryRepository>('UserQueryRepository')),
  });

  container.registerSingleton<HealthChecker>(SystemHealthChecker);

  container.register<HealthUseCase>(HealthUseCase, {
    useFactory: () => new HealthUseCase(container.resolve<HealthChecker>(SystemHealthChecker)),
  });

  container.registerInstance<BasicAuthenticator>('BasicAuthenticator', new BasicAuthenticator());

  container.register<UserController>(UserController, {
    useFactory: () =>
      new UserController(
        container.resolve<CreateUserUseCase>(CreateUserUseCase),
        container.resolve<GetUserUseCase>(GetUserUseCase)
      ),
  });

  container.register<HealthController>(HealthController, {
    useFactory: () => new HealthController(container.resolve<HealthUseCase>(HealthUseCase)),
  });
};

export { container };
